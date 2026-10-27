import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  FxError,
  type CachedFxQuote,
  type FxCache,
  type FxQuote,
} from '@/ports/fx'
import { createMemorySession } from '@/store/memory-session'
import { loadDemoSession } from '@/application/session/actions'
import { commitImportedBatch } from '@/application/import/commit'
import { deriveWorkspace } from '@/application/session/selectors'
import { statement, testCard, transaction } from '@/test-support/fixtures/dataset'
import { deferred } from '@/test-support/helpers/deferred'
import { createFxController, FX_RETRY_DELAYS } from './controller'
import { msUntilNextFxDay } from './freshness'

const timestamp = Date.parse('2026-10-27T10:00:00Z')
const quote: FxQuote = { hkdToCnyPpm: 850000, rateDate: '2026-10-26' }
const data = () => ({
  cards: [testCard],
  statements: [statement()],
  transactions: [transaction()],
})
const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
}
function memoryCache(initial: CachedFxQuote | null = null): FxCache {
  let value = initial
  return {
    read: () => value,
    write: (quote) => {
      value = quote
    },
  }
}
function setup(cache = memoryCache()) {
  const store = createMemorySession()
  const latest = vi
    .fn<(signal: AbortSignal) => Promise<FxQuote>>()
    .mockResolvedValue(quote)
  const controller = createFxController({
    store,
    provider: { latest },
    cache,
    now: Date.now,
  })
  return { store, latest, controller, cache }
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(timestamp)
})
afterEach(() => vi.useRealTimers())

describe('automatic daily reference lifecycle', () => {
  it('uses today’s persisted public quote without issuing a network request', async () => {
    const { store, latest, controller } = setup(
      memoryCache({ ...quote, retrievedAt: timestamp - 1000 }),
    )
    store.replace(data(), 'real')
    await controller.ensure()
    expect(latest).not.toHaveBeenCalled()
    expect(store.getSnapshot().fx).toMatchObject({
      source: 'cache',
      stale: false,
      hkdToCnyPpm: 850000,
    })
    expect(
      deriveWorkspace(store.getSnapshot()).totalRewardMicroRc,
    ).not.toBeNull()
  })
  it('never fetches or applies the persisted quote to an empty or demonstration session', async () => {
    const { store, latest, controller } = setup()
    const disconnect = controller.connect()
    loadDemoSession(store)
    expect(latest).not.toHaveBeenCalled()
    expect(store.getSnapshot().fx).toMatchObject({
      source: 'demo',
      hkdToCnyPpm: 900000,
    })
    commitImportedBatch(store, [data()], store.getSnapshot().revision)
    await flush()
    expect(store.getSnapshot().fx).toMatchObject({
      source: 'live',
      hkdToCnyPpm: 850000,
    })
    disconnect()
  })
  it('reuses the quote across repeated checks, clear/reimport and a new controller instance', async () => {
    const first = setup(),
      disconnect = first.controller.connect()
    first.store.replace(data(), 'real')
    await flush()
    await first.controller.ensure()
    await first.controller.ensure()
    first.store.clear()
    first.store.replace(data(), 'real')
    await flush()
    expect(first.latest).toHaveBeenCalledTimes(1)
    const second = setup(first.cache)
    second.store.replace(data(), 'real')
    await second.controller.ensure()
    expect(second.latest).not.toHaveBeenCalled()
    disconnect()
  })
  it('automatically fetches once at Hong Kong midnight and does not refetch during that day', async () => {
    vi.setSystemTime(Date.parse('2026-10-27T15:59:59Z'))
    const { store, latest, controller } = setup(),
      disconnect = controller.connect()
    store.replace(data(), 'real')
    await flush()
    latest.mockResolvedValueOnce({ ...quote, hkdToCnyPpm: 870000 })
    await vi.advanceTimersByTimeAsync(1000)
    expect(latest).toHaveBeenCalledTimes(2)
    expect(store.getSnapshot().fx.hkdToCnyPpm).toBe(870000)
    await controller.ensure()
    expect(latest).toHaveBeenCalledTimes(2)
    disconnect()
  })
  it('keeps missing values pending and automatically retries with backoff', async () => {
    const { store, latest, controller } = setup()
    latest.mockRejectedValueOnce(new FxError('timeout'))
    store.replace(data(), 'real')
    await controller.ensure()
    expect(controller.getSnapshot()).toEqual({
      status: 'error',
      problem: 'timeout',
    })
    expect(store.getSnapshot().fx.hkdToCnyPpm).toBeNull()
    await controller.ensure()
    expect(latest).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(FX_RETRY_DELAYS[0])
    expect(latest).toHaveBeenCalledTimes(2)
    expect(controller.getSnapshot().status).toBe('ready')
  })
  it('retains yesterday’s quote during an automatic update failure and recovers on retry', async () => {
    const cached = { ...quote, retrievedAt: timestamp - 86400000 }
    const { store, latest, controller } = setup(memoryCache(cached))
    latest.mockRejectedValueOnce(new FxError('http'))
    store.replace(data(), 'real')
    await controller.ensure()
    expect(store.getSnapshot().fx).toMatchObject({
      source: 'cache',
      stale: true,
      retrievedAt: cached.retrievedAt,
    })
    await vi.advanceTimersByTimeAsync(FX_RETRY_DELAYS[0])
    expect(store.getSnapshot().fx).toMatchObject({
      source: 'live',
      stale: false,
      retrievedAt: timestamp + FX_RETRY_DELAYS[0],
    })
  })
  it('does not adopt future cached timestamps or publication dates', async () => {
    for (const cached of [
      { ...quote, retrievedAt: timestamp + 1000 },
      { ...quote, rateDate: '2026-10-28', retrievedAt: timestamp },
    ]) {
      const { store, latest, controller } = setup(memoryCache(cached))
      store.replace(data(), 'real')
      await controller.ensure()
      expect(latest).toHaveBeenCalledTimes(1)
      expect(store.getSnapshot().fx).toMatchObject({
        source: 'live',
        hkdToCnyPpm: 850000,
      })
    }
  })
  it('isolates cancelled late responses from the replacement session and the public cache', async () => {
    const old = deferred<FxQuote>(),
      fresh = deferred<FxQuote>()
    const { store, latest, controller, cache } = setup(),
      disconnect = controller.connect()
    latest.mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise)
    store.replace(data(), 'real')
    const oldSignal = latest.mock.calls[0][0]
    store.clear()
    store.replace(data(), 'real')
    old.resolve({ ...quote, hkdToCnyPpm: 700000 })
    await flush()
    expect(oldSignal.aborted).toBe(true)
    expect(cache.read()).toBeNull()
    expect(store.getSnapshot().fx.hkdToCnyPpm).toBeNull()
    fresh.resolve(quote)
    await flush()
    expect(cache.read()?.hkdToCnyPpm).toBe(850000)
    disconnect()
  })
  it('coalesces checks and preserves an in-flight import revision when the quote arrives', async () => {
    const pending = deferred<FxQuote>(),
      { store, latest, controller } = setup()
    latest.mockReturnValueOnce(pending.promise)
    const disconnect = controller.connect()
    store.replace(data(), 'real')
    const revision = store.getSnapshot().revision
    await controller.ensure()
    pending.resolve(quote)
    await flush()
    expect(store.getSnapshot().revision).toBe(revision)
    commitImportedBatch(
      store,
      [
        {
          cards: [],
          statements: [statement({ id: 'next', fileHash: 'hash-next' })],
          transactions: [],
        },
      ],
      revision,
    )
    expect(latest).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot().fx.hkdToCnyPpm).toBe(850000)
    disconnect()
  })
  it('refuses a publication-date regression and keeps the known older-day quote', async () => {
    const { store, latest, controller } = setup(
      memoryCache({ ...quote, retrievedAt: timestamp - 86400000 }),
    )
    latest.mockResolvedValueOnce({ ...quote, rateDate: '2026-10-25' })
    store.replace(data(), 'real')
    await controller.ensure()
    expect(controller.getSnapshot().problem).toBe('invalid-response')
    expect(store.getSnapshot().fx).toMatchObject({
      hkdToCnyPpm: 850000,
      source: 'cache',
      stale: true,
    })
  })
  it('retains the last safe quote if a new daily value would overflow the result', async () => {
    const { store, latest, controller } = setup()
    const amount = 1000000000000
    store.replace(
      {
        cards: [testCard],
        statements: [
          statement({
            accounts: [
              {
                id: 'account-cny',
                currency: 'HKD',
                openingMinor: 0,
                closingMinor: amount,
              },
            ],
          }),
        ],
        transactions: [
          transaction({
            original: { currency: 'HKD', minor: amount },
            account: { currency: 'HKD', minor: amount },
            classification: { ...transaction().classification, region: 'HK' },
          }),
        ],
      },
      'real',
    )
    await controller.ensure()
    const before = deriveWorkspace(store.getSnapshot()).totalRewardCnyMinor
    vi.setSystemTime(timestamp + 86400000)
    latest.mockResolvedValueOnce({
      ...quote,
      hkdToCnyPpm: Number.MAX_SAFE_INTEGER,
    })
    await controller.ensure()
    expect(controller.getSnapshot().problem).toBe('calculation')
    expect(store.getSnapshot().fx.hkdToCnyPpm).toBe(850000)
    expect(deriveWorkspace(store.getSnapshot()).totalRewardCnyMinor).toBe(
      before,
    )
  })
  it('recalculates historical caps on the next daily value without changing basic rewards or source money', async () => {
    const { store, latest, controller } = setup()
    const input = {
      ...data(),
      transactions: [
        transaction({
          account: { currency: 'CNY', minor: 9000000 },
          original: { currency: 'CNY', minor: 9000000 },
        }),
      ],
    }
    latest.mockResolvedValueOnce({ ...quote, hkdToCnyPpm: 800000 })
    store.replace(input, 'real')
    await controller.ensure()
    const before = deriveWorkspace(store.getSnapshot())
    vi.setSystemTime(timestamp + 86400000)
    latest.mockResolvedValueOnce({ ...quote, hkdToCnyPpm: 900000 })
    await controller.ensure()
    const after = deriveWorkspace(store.getSnapshot())
    expect(before.rewardCards[0].abroadMicroRc).toBe(1600000000)
    expect(after.rewardCards[0].abroadMicroRc).toBe(1800000000)
    expect(after.rewardCards[0].basicMicroRc).toBe(
      before.rewardCards[0].basicMicroRc,
    )
    expect(store.getSnapshot().dataset).toBe(input)
  })
  it('marks an old publication stale while still reusing the successful quote for that day', async () => {
    const { store, latest, controller } = setup()
    latest.mockResolvedValueOnce({ ...quote, rateDate: '2026-10-10' })
    store.replace(data(), 'real')
    await controller.ensure()
    await controller.ensure()
    expect(store.getSnapshot().fx.stale).toBe(true)
    expect(latest).toHaveBeenCalledTimes(1)
  })
  it('releases pending requests and daily timers on disconnect', async () => {
    const { store, latest, controller } = setup(),
      pending = deferred<FxQuote>()
    latest.mockReturnValueOnce(pending.promise)
    store.replace(data(), 'real')
    const disconnect = controller.connect()
    disconnect()
    pending.resolve(quote)
    await flush()
    expect(store.getSnapshot().fx.hkdToCnyPpm).toBeNull()
    expect(controller.getSnapshot().status).toBe('idle')
    expect(vi.getTimerCount()).toBe(0)
    expect(msUntilNextFxDay(timestamp)).toBeGreaterThan(0)
  })
})
