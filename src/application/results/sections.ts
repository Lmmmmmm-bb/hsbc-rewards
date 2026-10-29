import type { SessionState } from '../session/types'
import type { WorkspaceView } from '../session/selectors'
import { selectResultScope } from './scope'
import { selectResultPools } from './pools'

export function resultSections(
  session: SessionState,
  workspace: WorkspaceView,
  periodId: string,
) {
  return workspace.periods
    .filter((period) => periodId === 'all' || period.id === periodId)
    .map((period) => {
      const scope = selectResultScope(session, workspace, {
        periodId: period.id,
      })
      return {
        period,
        cards: scope.cards,
        pools: selectResultPools(session, scope),
      }
    })
}
