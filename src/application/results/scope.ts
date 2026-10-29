import type { SessionState } from '../session/types'
import type { WorkspaceView } from '../session/selectors'
import { deriveRewardTotals } from '../session/reward-totals'
import { rewardPeriod } from '@/domain/normalization/dates'

export interface ResultSelection {
  readonly periodId?: string
  readonly cardId?: string | null
}

export class ResultSelectionError extends Error {
  readonly code: 'period_not_found' | 'card_not_found'
  constructor(code: 'period_not_found' | 'card_not_found') {
    super(code)
    this.code = code
  }
}

/** Select already-calculated rewards and the exact sources used by the period view. */
export function selectResultScope(session: SessionState, workspace: WorkspaceView, selection: ResultSelection = {}) {
  const periodId = selection.periodId ?? 'all'
  const period = periodId === 'all' ? null : workspace.periods.find((item) => item.id === periodId)
  if (periodId !== 'all' && !period) throw new ResultSelectionError('period_not_found')
  const view = period ?? workspace
  const cardId = selection.cardId ?? null
  const cards = view.rewardCards.filter((card) => cardId === null || card.cardId === cardId)
  if (cardId !== null && !cards.length) throw new ResultSelectionError('card_not_found')
  const rows = session.dataset.transactions.filter((row) =>
    (periodId === 'all' || rewardPeriod(row.transactionDate, 'half-year') === periodId) &&
    (cardId === null || row.cardId === cardId),
  )
  const ids = new Set(rows.map((row) => row.id))
  const rewards = workspace.rewards.transactions.filter((row) => ids.has(row.transactionId))
  const cardSources = new Set([
    ...rows.flatMap((row) => row.sources.map((source) => source.statementId)),
    ...cards.flatMap((card) => card.card.statementIds ?? []),
  ])
  const candidates = period?.sourceIds ?? session.dataset.statements.map((source) => source.id)
  const sourceIds = new Set(candidates.filter((id) => cardId === null || cardSources.has(id)))
  const reports = workspace.reports.filter((report) => sourceIds.has(report.statement.id))
  const accountIds = new Set([...rows.map((row) => row.accountId), ...cards.flatMap((card) => card.card.accountIds ?? [])])
  const reconciliations = reports.flatMap((report) => report.accounts
    .filter((account) => cardId === null || accountIds.has(account.accountId))
    .map((account) => ({ statement: report.statement, account })))
  const mismatchStatementCount = new Set(reconciliations
    .filter(({ account }) => account.status === 'mismatch')
    .map(({ statement }) => statement.id)).size
  return { periodId, period, view, cards, rows, rewards, cardId, sourceIds, reports, reconciliations, mismatchStatementCount, totals: deriveRewardTotals(rewards, session.fx.hkdToCnyPpm), rules: workspace.rules }
}

export type ResultScope = ReturnType<typeof selectResultScope>
