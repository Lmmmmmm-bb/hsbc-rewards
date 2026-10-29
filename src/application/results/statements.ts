import type { SessionState } from '../session/types'
import type { WorkspaceView } from '../session/selectors'
import type { ResultScope } from './scope'

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
  return workspace.rewards.transactions.flatMap((reward) => {
    if (!ids.has(reward.transactionId)) return []
    return [
      {
        row: session.dataset.transactions.find(
          (row) => row.id === reward.transactionId,
        )!,
        reward,
      },
    ]
  })
}
