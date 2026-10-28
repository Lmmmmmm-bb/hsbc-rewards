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
  const sourceIds = new Set(rows.flatMap((row) => row.sources.map((source) => source.statementId)))
  if (!period && cardId === null)
    snapshot.session.dataset.statements.forEach((source) => sourceIds.add(source.id))
  for (const card of cards) {
    for (const id of card.card.statementIds ?? []) {
      const source = snapshot.session.dataset.statements.find((statement) => statement.id === id)
      if (source && (!period || (source.date >= period.from && source.date <= period.to))) sourceIds.add(id)
    }
  }
  return { periodId, period, view, cards, rows, rewards, cardId, sourceIds }
}

export type AgentScope = ReturnType<typeof agentScope>
