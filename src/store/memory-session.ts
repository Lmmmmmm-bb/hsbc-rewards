import type { SessionState, SessionStore } from '@/application/session/types'

function emptyState(revision: number): SessionState {
  return {
    revision,
    mode: 'empty',
    dataset: { cards: [], statements: [], transactions: [] },
    fx: { hkdToCnyPpm: null, source: 'unavailable', stale: false },
  }
}

export function createMemorySession(): SessionStore {
  let snapshot = emptyState(0)
  const listeners = new Set<() => void>()

  const publish = (next: SessionState) => {
    snapshot = next
    listeners.forEach((listener) => listener())
  }

  return {
    getSnapshot: () => snapshot,

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    replace(
      dataset,
      mode,
      fx = { hkdToCnyPpm: null, source: 'unavailable', stale: false },
    ) {
      publish({ revision: snapshot.revision + 1, dataset, mode, fx })
    },

    setFx(fx) {
      if (snapshot.mode === 'real') publish({ ...snapshot, fx })
    },

    clear() {
      publish(emptyState(snapshot.revision + 1))
    },
  }
}
