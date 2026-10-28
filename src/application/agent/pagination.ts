import { AGENT_PAGE_LIMIT } from './contract'
import { AgentError } from './errors'

export interface PageInput { readonly cursor?: string; readonly limit?: number }

/** Small, data-free cursors. Owners bind them to their own result or batch lifecycle. */
export function createAgentPagination(nextId: () => string) {
  const cursors = new Map<string, { binding: string; offset: number }>()
  return {
    page<T>(items: readonly T[], input: PageInput, binding: string) {
      const limit = input.limit ?? 10
      if (!Number.isInteger(limit) || limit < 1 || limit > AGENT_PAGE_LIMIT) throw new AgentError('invalid_arguments')
      const cursor = input.cursor ? cursors.get(input.cursor) : undefined
      if (input.cursor && (!cursor || cursor.binding !== binding)) throw new AgentError('cursor_invalid')
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
    clear: () => cursors.clear(),
  }
}

export type AgentPagination = ReturnType<typeof createAgentPagination>
