import { addMinor, safeInteger } from '../money/money'
import type { Statement, Transaction } from '../model/types'

export interface AccountReconciliation {
  readonly accountId: string
  readonly currency: string
  readonly status: 'matched' | 'mismatch' | 'unverified'
  readonly openingMinor: number | null
  readonly debitMinor: number
  readonly creditMinor: number
  readonly expectedMinor: number | null
  readonly closingMinor: number | null
  readonly deltaMinor: number | null
  readonly transactionIds: readonly string[]
}

export function reconcileStatement(statement: Statement, transactions: readonly Transaction[]): AccountReconciliation[] {
  return statement.accounts.map(account => {
    const rows = transactions.filter(t => t.accountId === account.id && t.account.currency === account.currency && t.sources.some(source => source.statementId === statement.id))
    const debitMinor = addMinor(rows.filter(t => t.account.minor > 0).map(t => t.account.minor))
    const creditMinor = addMinor(rows.filter(t => t.account.minor < 0).map(t => -t.account.minor))
    const expectedMinor = account.openingMinor === null ? null : addMinor([account.openingMinor, debitMinor, -creditMinor])
    const closingMinor = account.closingMinor === null ? null : safeInteger(account.closingMinor)
    const deltaMinor = expectedMinor === null || closingMinor === null ? null : safeInteger(closingMinor - expectedMinor)

    return { accountId: account.id, currency: account.currency, openingMinor: account.openingMinor, debitMinor, creditMinor, expectedMinor, closingMinor, deltaMinor, status: deltaMinor === null ? 'unverified' : deltaMinor === 0 ? 'matched' : 'mismatch', transactionIds: rows.map(t => t.id) }
  })
}
