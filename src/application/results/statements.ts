import type { SessionState } from '../session/types'
import type { WorkspaceView } from '../session/selectors'
import type { ResultScope } from './scope'
import { resultPage } from './pagination'

export function statementSummaries(
  scope: ResultScope,
  filter?: 'mismatch' | 'unverified',
) {
  return scope.reports.flatMap((report) => {
    const accounts = scope.reconciliations
      .filter(({ statement }) => statement.id === report.statement.id)
      .map(({ account }) => account)
    if (filter && !accounts.some((account) => account.status === filter))
      return []
    const status = accounts.some((account) => account.status === 'mismatch')
      ? ('mismatch' as const)
      : accounts.length &&
          accounts.every((account) => account.status === 'matched')
        ? ('matched' as const)
        : ('unverified' as const)
    return [
      {
        statement: report.statement,
        accounts,
        status,
        currencies: [...new Set(accounts.map((account) => account.currency))],
      },
    ]
  })
}

export function statementTransactions(
  session: SessionState,
  workspace: WorkspaceView,
  scope: ResultScope,
  statementId: string,
) {
  const ids = new Set(
    scope.reconciliations
      .filter(({ statement }) => statement.id === statementId)
      .flatMap(({ account }) => account.transactionIds),
  )
  const byId = new Map(session.dataset.transactions.map((row) => [row.id, row]))
  return workspace.rewards.transactions.flatMap((reward) => {
    if (!ids.has(reward.transactionId)) return []
    return [
      {
        row: byId.get(reward.transactionId)!,
        reward,
      },
    ]
  })
}

export function statementTransactionPage(
  session: SessionState,
  workspace: WorkspaceView,
  scope: ResultScope,
  statementId: string,
  page: number,
) {
  return resultPage(
    statementTransactions(session, workspace, scope, statementId),
    page,
  )
}
