import type { Statement } from '@/domain/model/types'
import type { AgentSnapshot } from './snapshots'

/** Explain an opaque source without exposing filenames, bank identities, or raw rows. */
export function statementIdentity(snapshot: AgentSnapshot, statement: Statement) {
  const related = new Set(snapshot.session.dataset.transactions
    .filter((row) => row.sources.some((source) => source.statementId === statement.id))
    .map((row) => row.cardId))
  return {
    statementRef: snapshot.references.get('statement', statement.id),
    statementDate: statement.date,
    statementPeriod: { ...statement.period },
    cardRefs: snapshot.session.dataset.cards
      .filter((card) => related.has(card.id) || card.statementIds?.includes(statement.id))
      .map((card) => snapshot.references.get('card', card.id)),
  }
}

export type AgentStatementIdentity = ReturnType<typeof statementIdentity>
