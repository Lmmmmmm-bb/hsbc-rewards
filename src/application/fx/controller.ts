import {
  FxError,
  type FxProblem,
  type FxProvider,
  type FxCache,
  type CachedFxQuote,
} from '@/ports/fx'
import type { FxSnapshot, SessionStore } from '@/application/session/types'
import { isFxFresh, isFxStale, msUntilFxExpiry } from './freshness'
import { validateSessionDataset } from '@/application/session/validate'

export interface FxRequestState {
  readonly status: 'idle' | 'loading' | 'ready' | 'error'
  readonly problem: FxProblem | null
}
export const FX_RETRY_DELAYS = [30_000, 120_000, 600_000, 1_800_000] as const

export function createFxController({
  store,
  provider,
  cache,
  now = Date.now,
}: {
  store: SessionStore
  provider: FxProvider
  cache: FxCache
  now?: () => number
}) {
  let state: FxRequestState = { status: 'idle', problem: null }
  const listeners = new Set<() => void>()
  let generation = 0
  let request: AbortController | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let retryAt = 0
  let failures = 0
  const publish = (next: FxRequestState) => {
    if (next.status === state.status && next.problem === state.problem) return
    state = next
    listeners.forEach((listener) => listener())
  }
  const isReal = () => {
    const session = store.getSnapshot()
    return session.mode === 'real' && session.dataset.statements.length > 0
  }
  const clearTimer = () => {
    clearTimeout(timer)
    timer = undefined
  }
  const available = (
    fx: FxSnapshot,
  ): fx is Extract<FxSnapshot, { source: 'live' | 'cache' }> =>
    fx.source === 'live' || fx.source === 'cache'
  function reset() {
    generation++
    request?.abort()
    request = undefined
    clearTimer()
    retryAt = 0
    failures = 0
    publish({ status: 'idle', problem: null })
  }
  function schedule(delay: number) {
    clearTimer()
    timer = setTimeout(() => {
      timer = undefined
      void ensure()
    }, delay)
  }
  function adopt(
    quote: CachedFxQuote,
    source: 'live' | 'cache',
    forceStale = false,
  ) {
    const fx = {
      ...quote,
      source,
      stale: forceStale || isFxStale(quote, now()),
    }
    try {
      validateSessionDataset(store.getSnapshot().dataset, fx)
    } catch {
      throw new FxError('calculation')
    }
    store.setFx(fx)
  }
  async function ensure() {
    if (!isReal() || request) return
    const currentFx = store.getSnapshot().fx
    if (available(currentFx) && isFxFresh(currentFx, now())) {
      if (!timer) schedule(msUntilFxExpiry(currentFx, now()))
      publish({ status: 'ready', problem: null })
      return
    }
    if (now() < retryAt) return
    const stored = cache.read()
    const cached =
      stored &&
      stored.retrievedAt <= now() &&
      stored.rateDate <= new Date(now()).toISOString().slice(0, 10)
        ? stored
        : null
    if (cached && isFxFresh(cached, now())) {
      try {
        adopt(cached, 'cache')
        failures = 0
        publish({ status: 'ready', problem: null })
        schedule(msUntilFxExpiry(cached, now()))
        return
      } catch {
        /* Fetch again if a cached quote cannot be used with this dataset. */
      }
    }
    const token = ++generation
    const active = new AbortController()
    request = active
    publish({ status: 'loading', problem: null })
    const current = () =>
      token === generation && !active.signal.aborted && isReal()
    const fallback = available(currentFx) ? currentFx : cached
    if (fallback) {
      try {
        adopt(fallback, 'cache', true)
      } catch {
        /* Keep unknown values if the old rate cannot be used safely. */
      }
    }
    try {
      const quote = await provider.latest(active.signal)
      if (!current()) return
      if (fallback && quote.rateDate < fallback.rateDate)
        throw new FxError('invalid-response')
      const next = { ...quote, retrievedAt: now() }
      adopt(next, 'live')
      cache.write(next)
      failures = 0
      retryAt = 0
      publish({ status: 'ready', problem: null })
      schedule(msUntilFxExpiry(next, now()))
    } catch (error) {
      if (!current()) return
      const delay =
        FX_RETRY_DELAYS[Math.min(failures++, FX_RETRY_DELAYS.length - 1)]
      retryAt = now() + delay
      publish({
        status: 'error',
        problem: error instanceof FxError ? error.code : 'network',
      })
      schedule(delay)
    } finally {
      if (token === generation) request = undefined
    }
  }
  function sync() {
    if (!isReal()) reset()
    else void ensure()
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    connect() {
      const unsubscribe = store.subscribe(sync)
      sync()
      return () => {
        unsubscribe()
        reset()
      }
    },
    ensure,
  }
}
