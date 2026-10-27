import { FxError, type FxProblem, type FxProvider } from '@/ports/fx'
import type { SessionStore } from '@/application/session/types'
import { FX_MAX_AGE_MS, isFxStale } from './freshness'

export interface FxRequestState {
  readonly status: 'idle' | 'loading' | 'ready' | 'error'
  readonly problem: FxProblem | null
}

export function createFxController({
  store,
  provider,
  now = Date.now,
}: {
  store: SessionStore
  provider: FxProvider
  now?: () => number
}) {
  let state: FxRequestState = { status: 'idle', problem: null }
  const listeners = new Set<() => void>()
  let generation = 0
  let request: AbortController | undefined
  let attempted = false
  let expiry: ReturnType<typeof setTimeout> | undefined
  const publish = (next: FxRequestState) => {
    state = next
    listeners.forEach((listener) => listener())
  }
  const isReal = () => {
    const session = store.getSnapshot()
    return session.mode === 'real' && session.dataset.statements.length > 0
  }
  const clearExpiry = () => {
    clearTimeout(expiry)
    expiry = undefined
  }
  function reset() {
    generation++
    request?.abort()
    request = undefined
    attempted = false
    clearExpiry()
    if (state.status !== 'idle') publish({ status: 'idle', problem: null })
  }
  async function refresh() {
    if (!isReal() || request) return
    attempted = true
    const token = ++generation
    const active = new AbortController()
    request = active
    clearExpiry()
    publish({ status: 'loading', problem: null })
    const current = () =>
      token === generation && !active.signal.aborted && isReal()
    try {
      const quote = await provider.latest(active.signal)
      if (!current()) return
      const previous = store.getSnapshot().fx
      if (
        (previous.source === 'live' || previous.source === 'cache') &&
        quote.rateDate < previous.rateDate
      )
        throw new FxError('invalid-response')
      const retrievedAt = now()
      const fx = {
        ...quote,
        retrievedAt,
        source: 'live' as const,
        stale: isFxStale({ ...quote, retrievedAt }, retrievedAt),
      }
      store.setFx(fx)
      publish({ status: 'ready', problem: null })
      if (!fx.stale)
        expiry = setTimeout(() => {
          if (!current() || store.getSnapshot().fx !== fx) return
          store.setFx({ ...fx, source: 'cache', stale: true })
        }, FX_MAX_AGE_MS)
    } catch (error) {
      if (!current()) return
      const fx = store.getSnapshot().fx
      if (fx.source === 'live' || fx.source === 'cache')
        store.setFx({ ...fx, source: 'cache', stale: true })
      publish({
        status: 'error',
        problem: error instanceof FxError ? error.code : 'network',
      })
    } finally {
      if (token === generation) request = undefined
    }
  }
  function sync() {
    if (!isReal()) {
      reset()
      return
    }
    if (!attempted) void refresh()
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
    refresh,
  }
}
