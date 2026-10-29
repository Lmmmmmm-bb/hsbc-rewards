import type { ResultSelection } from './scope'
import type { TransactionFilter } from './transactions'

export type DetailTab = 'calculation' | 'transactions' | 'statements'
export interface ResultDetailsRequest
  extends ResultSelection,
    TransactionFilter {
  readonly tab: DetailTab
  readonly reconciliation?: 'mismatch' | 'unverified'
}
