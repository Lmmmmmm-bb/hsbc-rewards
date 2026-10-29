import type { ResultDetailsRequest } from '@/application/results/details'
import type { SessionState } from '@/application/session/types'
import type { TransactionFilter } from '@/application/results/transactions'

export interface DetailNavigation {
  readonly cardId: string | null
  readonly filter: TransactionFilter
  readonly page: number
  readonly transactionId: string | null
  readonly dataset: SessionState['dataset']
  readonly fxIdentity: string
  readonly updated: boolean
}

export function initialNavigation(
  request: ResultDetailsRequest,
  session: SessionState,
): DetailNavigation {
  return {
    cardId: request.cardId ?? null,
    filter: {
      component: request.component,
      flags: request.flags,
      reason: request.reason,
      warning: request.warning,
      reconciliation: request.reconciliation,
    },
    page: 0,
    transactionId: null,
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
    updated: true,
  }
}
