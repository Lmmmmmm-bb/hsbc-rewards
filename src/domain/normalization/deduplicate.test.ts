import { describe, expect, it } from 'vitest'
import { transaction } from '@/test-support/fixtures'
import { deduplicateTransactions } from './deduplicate'

describe('unique-evidence transaction merging', () => {
  it('merges only proven references and preserves every source for reconciliation', () => {
    const a = transaction({ bankReference: 'BANK-UNIQUE-A' })
    const b = transaction({ id: 'transaction-b', bankReference: 'BANK-UNIQUE-A', sources: [{ ...a.sources[0], statementId: 'statement-b', fileHash: 'synthetic-b' }] })
    const result = deduplicateTransactions([b, a])
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].sources).toHaveLength(2)
    expect(result.mergedIds).toEqual(['transaction-b'])
  })
  it('retains same-day same-amount purchases without a unique reference', () => {
    const result = deduplicateTransactions([transaction(), transaction({ id: 'transaction-b' })])
    expect(result.transactions).toHaveLength(2)
    expect(result.possibleDuplicateIds).toHaveLength(2)
    expect(result.transactions[0].warnings[0].code).toBe('transaction.possible-duplicate')
  })
  it('does not merge conflicting amounts or independent bank references', () => {
    const a = transaction({ bankReference: 'REF-A' })
    const b = transaction({ id: 'transaction-b', bankReference: 'REF-A', account: { currency: 'CNY', minor: 25001 } })
    const c = transaction({ id: 'transaction-c', bankReference: 'REF-C' })
    const result = deduplicateTransactions([a, b, c])
    expect(result.transactions).toHaveLength(3)
    expect(result.conflictingReferenceIds).toEqual(['transaction-a', 'transaction-b'])
  })
  it('does not mutate input or depend on import order', () => {
    const a = transaction(), b = transaction({ id: 'transaction-b' })
    expect(deduplicateTransactions([a, b])).toEqual(deduplicateTransactions([b, a]))
    expect(a.warnings).toHaveLength(0)
  })
})
