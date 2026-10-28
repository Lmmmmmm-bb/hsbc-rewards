import { AgentError } from './errors'

export type ReferenceKind = 'card' | 'statement' | 'transaction' | 'pool' | 'file' | 'batch'

/** Page-local aliases never disclose account identities, file hashes, or source keys. */
export function createAgentReferences(nextId: () => string) {
  const aliases = new Map<string, string>()
  const identities = new Map<string, { kind: ReferenceKind; id: string }>()

  return {
    get(kind: ReferenceKind, id: string) {
      const key = JSON.stringify([kind, id])
      let alias = aliases.get(key)
      if (!alias) {
        alias = `${kind}_${nextId()}`
        aliases.set(key, alias)
        identities.set(alias, { kind, id })
      }

      return alias
    },

    resolve(kind: ReferenceKind, alias: string) {
      const identity = identities.get(alias)
      if (identity?.kind === kind) return identity.id
      throw new AgentError(kind === 'card' ? 'card_not_found' : 'file_not_found')
    },

    clear() {
      aliases.clear()
      identities.clear()
    },
  }
}

export type AgentReferences = ReturnType<typeof createAgentReferences>
