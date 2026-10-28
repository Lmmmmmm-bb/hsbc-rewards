import type { SessionState, SessionStore } from '../session/types'
import { deriveWorkspace } from '../session/selectors'
import { createAgentReferences } from './references'
import { AgentError } from './errors'
import { createAgentPagination, type PageInput } from './pagination'
export type { PageInput } from './pagination'

function sameFx(a: SessionState['fx'], b: SessionState['fx']) {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Tracks only the current calculation identity and small, data-free cursor metadata. */
export function createAgentSnapshots(store: SessionStore, nextId: () => string) {
  const references = createAgentReferences(nextId)
  const pagination = createAgentPagination(nextId)
  let previous = store.getSnapshot()
  let resultToken = `result_${nextId()}`
  function sync() {
    const session = store.getSnapshot()
    if (previous === session) return
    if (session.mode === 'empty' || session.mode !== previous.mode) references.clear()
    if (previous.dataset !== session.dataset || !sameFx(previous.fx, session.fx)) {
      resultToken = `result_${nextId()}`
      pagination.clear()
    }
    previous = session
  }
  const unsubscribe = store.subscribe(sync)
  return {
    references,
    capture(expectedToken?: string) {
      sync()
      if (expectedToken !== undefined && expectedToken !== resultToken)
        throw new AgentError('result_changed')
      const session = store.getSnapshot()
      if (session.mode === 'empty') throw new AgentError('no_results')
      return { session, resultToken, references, view: deriveWorkspace(session) }
    },
    page<T>(items: readonly T[], input: PageInput, binding: string, expectedToken: string) {
      sync()
      if (resultToken !== expectedToken) throw new AgentError('result_changed')
      return pagination.page(items, input, JSON.stringify([resultToken, binding]))
    },
    dispose() {
      unsubscribe()
      references.clear()
      pagination.clear()
    },
  }
}

export type AgentSnapshots = ReturnType<typeof createAgentSnapshots>
export type AgentSnapshot = ReturnType<AgentSnapshots['capture']>
