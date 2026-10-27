import { afterEach, describe, expect, it, vi } from 'vitest'
import { FxError, type FxQuote } from '@/ports/fx'
import { createMemorySession } from '@/store/memory-session'
import { loadDemoSession } from '@/application/session/actions'
import { commitImportedBatch } from '@/application/import/commit'
import { deriveWorkspace } from '@/application/session/selectors'
import { statement, testCard, transaction } from '@/test-support/fixtures'
import { createFxController } from './controller'
import { FX_MAX_AGE_MS } from './freshness'

const timestamp = Date.parse('2026-10-27T10:00:00Z')
const quote: FxQuote = { hkdToCnyPpm: 850000, rateDate: '2026-10-26' }
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const dataset = () => ({
  cards: [testCard],
  statements: [statement()],
  transactions: [transaction()],
})
function setup() {
  const store = createMemorySession()
  const latest = vi
    .fn<(signal: AbortSignal) => Promise<FxQuote>>()
    .mockResolvedValue(quote)
  const controller = createFxController({
    store,
    provider: { latest },
    now: () => Date.now(),
  })
  return { store, latest, controller }
}
afterEach(() => vi.useRealTimers())

describe('session reference-rate lifecycle', () => {
  it('starts only after real import and never uses a demonstration quote for real data', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(timestamp)
    const { store, latest, controller } = setup()
    const pending = deferred<FxQuote>()
    latest.mockReturnValueOnce(pending.promise)
    const disconnect = controller.connect()
    loadDemoSession(store)
    expect(latest).not.toHaveBeenCalled()
    commitImportedBatch(store, [dataset()], store.getSnapshot().revision)
    expect(store.getSnapshot().fx.source).toBe('unavailable')
    expect(controller.getSnapshot().status).toBe('loading')
    pending.resolve(quote)
    await pending.promise
    await Promise.resolve()
    expect(store.getSnapshot().fx).toEqual({
      ...quote,
      source: 'live',
      retrievedAt: timestamp,
      stale: false,
    })
    expect(
      deriveWorkspace(store.getSnapshot()).totalRewardMicroRc,
    ).not.toBeNull()
    disconnect()
  })
  it('keeps the dataset revision stable for quote changes and preserves the newest quote when the next batch commits', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(timestamp)
    const { store, controller } = setup()
    store.replace(dataset(), 'real')
    const expectedRevision = store.getSnapshot().revision
    const unchangedDataset = store.getSnapshot().dataset
    await controller.refresh()
    expect(store.getSnapshot().revision).toBe(expectedRevision)
    expect(store.getSnapshot().dataset).toBe(unchangedDataset)
    const next = statement({ id: 'next', fileHash: 'hash-next' })
    commitImportedBatch(
      store,
      [{ cards: [], statements: [next], transactions: [] }],
      expectedRevision,
    )
    expect(store.getSnapshot().dataset.statements).toHaveLength(2)
    expect(store.getSnapshot().fx.hkdToCnyPpm).toBe(850000)
  })
  it('does not let a late request restore a cleared session or overwrite a new session', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(timestamp)
    const { store, latest, controller } = setup()
    const old = deferred<FxQuote>(),
      fresh = deferred<FxQuote>()
    latest.mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise)
    const disconnect = controller.connect()
    store.replace(dataset(), 'real')
    const oldSignal = latest.mock.calls[0][0]
    store.clear()
    expect(oldSignal.aborted).toBe(true)
    expect(controller.getSnapshot().status).toBe('idle')
    store.replace(dataset(), 'real')
    old.resolve({ ...quote, hkdToCnyPpm: 700000 })
    await old.promise
    await Promise.resolve()
    expect(store.getSnapshot().fx.source).toBe('unavailable')
    fresh.resolve(quote)
    await fresh.promise
    await Promise.resolve()
    expect(store.getSnapshot().fx.hkdToCnyPpm).toBe(850000)
    disconnect()
  })
  it('leaves missing rates pending on first failure and never silently supplies an example value', async () => {
    const { store, latest, controller } = setup()
    store.replace(dataset(), 'real')
    latest.mockRejectedValueOnce(new FxError('timeout'))
    await controller.refresh()
    expect(controller.getSnapshot()).toEqual({
      status: 'error',
      problem: 'timeout',
    })
    expect(store.getSnapshot().fx.hkdToCnyPpm).toBeNull()
    expect(deriveWorkspace(store.getSnapshot()).totalRewardMicroRc).toBeNull()
  })
  it('retains an older session rate on refresh failure and recovers without altering transaction amounts', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(timestamp)
    const { store, latest, controller } = setup()
    store.replace(dataset(), 'real')
    const original = store.getSnapshot().dataset
    await controller.refresh()
    latest.mockRejectedValueOnce(new FxError('http'))
    await controller.refresh()
    expect(store.getSnapshot().fx).toMatchObject({
      source: 'cache',
      hkdToCnyPpm: 850000,
      stale: true,
      retrievedAt: timestamp,
    })
    expect(controller.getSnapshot().problem).toBe('http')
    await controller.refresh()
    expect(store.getSnapshot().fx).toMatchObject({
      source: 'live',
      stale: false,
    })
    expect(store.getSnapshot().dataset).toBe(original)
  })
  it('coalesces concurrent refresh attempts and does not refetch just because a batch appended', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(timestamp)
    const { store, latest, controller } = setup()
    const pending = deferred<FxQuote>()
    latest.mockReturnValueOnce(pending.promise)
    const disconnect = controller.connect()
    store.replace(dataset(), 'real')
    await controller.refresh()
    commitImportedBatch(
      store,
      [
        {
          cards: [],
          statements: [statement({ id: 'next', fileHash: 'hash-next' })],
          transactions: [],
        },
      ],
      store.getSnapshot().revision,
    )
    expect(latest).toHaveBeenCalledTimes(1)
    pending.resolve(quote)
    await pending.promise
    await Promise.resolve()
    expect(store.getSnapshot().dataset.statements).toHaveLength(2)
    expect(store.getSnapshot().fx.hkdToCnyPpm).toBe(850000)
    disconnect()
  })
  it('marks a day-old in-memory rate stale without background polling and releases its timer on clear', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(timestamp)
    const { store, latest, controller } = setup()
    const disconnect = controller.connect()
    store.replace(dataset(), 'real')
    await Promise.resolve()
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(FX_MAX_AGE_MS)
    expect(store.getSnapshot().fx).toMatchObject({
      source: 'cache',
      stale: true,
    })
    expect(latest).toHaveBeenCalledTimes(1)
    await controller.refresh()
    store.clear()
    expect(vi.getTimerCount()).toBe(0)
    disconnect()
  })
  it('labels old publication dates stale and never replaces a newer quote with an older publication', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(timestamp)
    const { store, latest, controller } = setup()
    store.replace(dataset(), 'real')
    latest.mockResolvedValueOnce({ ...quote, rateDate: '2026-10-10' })
    await controller.refresh()
    expect(store.getSnapshot().fx.stale).toBe(true)
    await controller.refresh()
    latest.mockResolvedValueOnce({
      ...quote,
      rateDate: '2026-10-25',
      hkdToCnyPpm: 860000,
    })
    await controller.refresh()
    expect(store.getSnapshot().fx).toMatchObject({
      rateDate: '2026-10-26',
      hkdToCnyPpm: 850000,
      source: 'cache',
      stale: true,
    })
    expect(controller.getSnapshot().problem).toBe('invalid-response')
  })
  it('recomputes historical cap rewards and reference values together while basic RC and input money remain fixed', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(timestamp)
    const { store, latest, controller } = setup()
    const input = {
      ...dataset(),
      transactions: [
        transaction({
          account: { currency: 'CNY', minor: 9000000 },
          original: { currency: 'CNY', minor: 9000000 },
        }),
      ],
    }
    store.replace(input, 'real')
    latest.mockResolvedValueOnce({ ...quote, hkdToCnyPpm: 800000 })
    await controller.refresh()
    const before = deriveWorkspace(store.getSnapshot())
    latest.mockResolvedValueOnce({ ...quote, hkdToCnyPpm: 900000 })
    await controller.refresh()
    const after = deriveWorkspace(store.getSnapshot())
    expect(before.rewardCards[0].abroadMicroRc).toBe(1600000000)
    expect(after.rewardCards[0].abroadMicroRc).toBe(1800000000)
    expect(before.rewardCards[0].basicMicroRc).toBe(
      after.rewardCards[0].basicMicroRc,
    )
    expect(before.totalRewardCnyMinor).not.toBe(after.totalRewardCnyMinor)
    expect(store.getSnapshot().dataset).toBe(input)
  })
  it('releases pending work on disconnect and ignores late completion', async () => {
    const { store, latest, controller } = setup()
    const pending = deferred<FxQuote>()
    latest.mockReturnValueOnce(pending.promise)
    store.replace(dataset(), 'real')
    const disconnect = controller.connect()
    disconnect()
    pending.resolve(quote)
    await pending.promise
    await Promise.resolve()
    expect(store.getSnapshot().fx.source).toBe('unavailable')
    expect(controller.getSnapshot().status).toBe('idle')
  })
})
