import { describe, expect, it } from 'vitest'
import { statement, transaction } from '@/test-support/fixtures'
import { reconcileStatement } from './reconcile'

describe('sub-account balance reconciliation', () => {
  it('counts purchases, refunds, repayments and fees independently of rewards', () => {
    const rows = [transaction(), transaction({ id: 'refund', account: { currency: 'CNY', minor: -10000 }, classification: { ...transaction().classification, kind: 'refund', eligible: false } }), transaction({ id: 'payment', account: { currency: 'CNY', minor: -50000 } }), transaction({ id: 'fee', account: { currency: 'CNY', minor: 3000 } })]
    const result = reconcileStatement(statement({ accounts: [{ id: 'account-cny', currency: 'CNY', openingMinor: 100000, closingMinor: 68000 }] }), rows)[0]
    expect(result).toMatchObject({ debitMinor: 28000, creditMinor: 60000, expectedMinor: 68000, deltaMinor: 0, status: 'matched' })
  })
  it('does not mix currencies or include another statement', () => {
    const other = transaction({ id: 'other', sources: [{ ...transaction().sources[0], statementId: 'another' }] })
    const hkd = transaction({ id: 'hkd', account: { currency: 'HKD', minor: 50000 } })
    expect(reconcileStatement(statement(), [transaction(), other, hkd])[0].status).toBe('matched')
  })
  it('distinguishes missing balances from zero and reports exact minor-unit differences', () => {
    expect(reconcileStatement(statement({ accounts: [{ id: 'account-cny', currency: 'CNY', openingMinor: null, closingMinor: 0 }] }), [])[0]).toMatchObject({ status: 'unverified', deltaMinor: null })
    expect(reconcileStatement(statement({ accounts: [{ id: 'account-cny', currency: 'CNY', openingMinor: 0, closingMinor: 0 }] }), [])[0].status).toBe('matched')
    expect(reconcileStatement(statement({ accounts: [{ id: 'account-cny', currency: 'CNY', openingMinor: 100000, closingMinor: 125001 }] }), [transaction()])[0]).toMatchObject({ status: 'mismatch', deltaMinor: 1 })
  })
})
