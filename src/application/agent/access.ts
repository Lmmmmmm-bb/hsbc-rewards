import type { SessionStore } from '../session/types'

/** This controls page-local tool output; it does not authenticate a browser agent. */
export function createAgentAccess(store: SessionStore) {
  let granted = false
  let mode = store.getSnapshot().mode
  const listeners = new Set<() => void>()
  const publish = () => listeners.forEach((listener) => listener())
  let connection: (() => void) | undefined

  const sync = () => {
    const nextMode = store.getSnapshot().mode
    if (nextMode === 'empty' || (nextMode !== mode && mode !== 'empty')) {
      granted = false
      publish()
    }

    mode = nextMode
  }

  return {
    getSnapshot: () => granted,
    allowed: () => store.getSnapshot().mode === 'demo' || granted,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },

    connect() {
      if (connection) return () => {}

      sync()
      const unsubscribe = store.subscribe(sync)
      connection = unsubscribe

      return () => { unsubscribe(); if (connection === unsubscribe) connection = undefined }
    },

    grant() { if (!granted) { granted = true; publish() } },
    revoke() { if (granted) { granted = false; publish() } },
    dispose() { connection?.(); connection = undefined; granted = false; listeners.clear() },
  }
}

export type AgentAccess = ReturnType<typeof createAgentAccess>
