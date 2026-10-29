import type { SessionState } from '../session/types'
import type { WorkspaceView } from '../session/selectors'
import type { ResultScope } from './scope'
import { resultPage } from './pagination'

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
