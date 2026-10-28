import type { SessionState, SessionStore } from '../session/types'
import { deriveWorkspace } from '../session/selectors'
import { createAgentReferences } from './references'
import { AgentError } from './errors'

export const AGENT_PAGE_LIMIT = 20
export interface PageInput { readonly cursor?: string; readonly limit?: number }

function sameFx(a: SessionState['fx'], b: SessionState['fx']) {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Tracks only the current calculation identity and small, data-free cursor metadata. */
export function createAgentSnapshots(store: SessionStore, nextId: () => string) {
  const references = createAgentReferences(nextId)
  const cursors = new Map<string, { binding: string; offset: number }>()
  let previous = store.getSnapshot()
  let resultToken = `result_${nextId()}`
  function sync() {
    const session = store.getSnapshot()
    if (previous === session) return
    if (session.mode === 'empty' || session.mode !== previous.mode) references.clear()
    if (previous.dataset !== session.dataset || !sameFx(previous.fx, session.fx)) {
      resultToken = `result_${nextId()}`
      cursors.clear()
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
      const limit = input.limit ?? 10
      if (!Number.isInteger(limit) || limit < 1 || limit > AGENT_PAGE_LIMIT)
        throw new AgentError('invalid_arguments')
      const cursor = input.cursor ? cursors.get(input.cursor) : undefined
      if (input.cursor && (!cursor || cursor.binding !== binding))
        throw new AgentError('cursor_invalid')
      const offset = cursor?.offset ?? 0
      const entries = items.slice(offset, offset + limit)
      let nextCursor: string | null = null
      if (offset + entries.length < items.length) {
        nextCursor = `cursor_${nextId()}`
        cursors.set(nextCursor, { binding, offset: offset + entries.length })
        if (cursors.size > 128) cursors.delete(cursors.keys().next().value!)
      }
      return { items: entries, totalCount: items.length, nextCursor }
    },
    dispose() {
      unsubscribe()
      references.clear()
      cursors.clear()
    },
  }
}

export type AgentSnapshots = ReturnType<typeof createAgentSnapshots>
export type AgentSnapshot = ReturnType<AgentSnapshots['capture']>
