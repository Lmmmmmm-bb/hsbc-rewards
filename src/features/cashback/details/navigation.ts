import type {
  ResultDetailsRequest,
  DetailTab,
} from '@/application/results/details'
import type { SessionState } from '@/application/session/types'
import type { TransactionFilter } from '@/application/results/transactions'

export interface DetailNavigation {
  readonly tab: DetailTab
  readonly cardId: string | null
  readonly filter: TransactionFilter
  readonly page: number
  readonly sourcePage: number
  readonly transactionId: string | null
  readonly statementId: string | null
  readonly returnTransactionId: string | null
  readonly returnStatementId: string | null
  readonly dataset: SessionState['dataset']
  readonly fxIdentity: string
  readonly updated: boolean
}

export function initialNavigation(
  request: ResultDetailsRequest,
  session: SessionState,
): DetailNavigation {
  return {
    tab: request.tab,
    cardId: request.cardId ?? null,
    filter: {
      component: request.component,
      flags: request.flags,
      reason: request.reason,
      warning: request.warning,
    },
    page: 0,
    sourcePage: 0,
    transactionId: null,
    statementId: null,
    returnTransactionId: null,
    returnStatementId: null,
    dataset: session.dataset,
    fxIdentity: JSON.stringify(session.fx),
    updated: false,
  }
}

/** Quote provenance changes invalidate pages even if the numeric rate stays the same. */
export function synchronizeNavigation(
  state: DetailNavigation,
  session: SessionState,
): DetailNavigation {
  const fxIdentity = JSON.stringify(session.fx)
  if (state.dataset === session.dataset && state.fxIdentity === fxIdentity)
    return state
  return {
    ...state,
    dataset: session.dataset,
    fxIdentity,
    page: 0,
    sourcePage: 0,
    updated: true,
  }
}
