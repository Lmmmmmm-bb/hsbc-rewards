import { rewardPeriod } from '@/domain/normalization/dates'
import type { AgentSnapshot } from './snapshots'
import { AgentError } from './errors'

export interface ResultScope {
  readonly periodId?: string
  readonly cardRef?: string
}

export function agentScope(snapshot: AgentSnapshot, input: ResultScope) {
  const periodId = input.periodId ?? 'all'
  const period = periodId === 'all' ? null : snapshot.view.periods.find((item) => item.id === periodId)
  if (periodId !== 'all' && !period) throw new AgentError('period_not_found')
  const view = period ?? snapshot.view
  const cardId = input.cardRef ? snapshot.references.resolve('card', input.cardRef) : null
  const cards = view.rewardCards.filter((card) => cardId === null || card.cardId === cardId)
  if (cardId !== null && cards.length === 0) throw new AgentError('card_not_found')
  const rows = snapshot.session.dataset.transactions.filter((row) =>
    (periodId === 'all' || rewardPeriod(row.transactionDate, 'half-year') === periodId) &&
    (cardId === null || row.cardId === cardId),
  )
  const ids = new Set(rows.map((row) => row.id))
  const rewards = snapshot.view.rewards.transactions.filter((row) => ids.has(row.transactionId))
  const cardSources = new Set([
    ...rows.flatMap((row) => row.sources.map((source) => source.statementId)),
    ...cards.flatMap((card) => card.card.statementIds ?? []),
  ])
  // Use the same source set that produced period counts and quality, including empty sources.
  const candidates = period?.sourceIds ?? snapshot.session.dataset.statements.map((source) => source.id)
  const sourceIds = new Set(candidates.filter((id) => cardId === null || cardSources.has(id)))
  return { periodId, period, view, cards, rows, rewards, cardId, sourceIds }
}

export type AgentScope = ReturnType<typeof agentScope>
