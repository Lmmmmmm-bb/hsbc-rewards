import { describe, expect, it } from 'vitest'
import { rewardContext } from '@/tests/helpers/rewards'
import { deriveRewardQuality } from '@/application/session/reward-quality'
import { createDemoDataset } from './dataset'

describe('public demonstration statements', () => {
  it('balances every source account without incomplete or suspicious records', () => {
    const dataset = createDemoDataset()
    for (const source of dataset.statements) {
      expect(source.accounts.map((account) => account.currency).sort()).toEqual(['CNY', 'HKD'])
    }
    const { rewards, reports } = rewardContext(dataset, 900000)
    expect(deriveRewardQuality(dataset, rewards, reports).total).toMatchObject({
      matchedAccounts: dataset.statements.reduce((count, source) => count + source.accounts.length, 0),
      mismatchAccounts: 0,
      unverifiedAccounts: 0,
      uncertainEligibilityCount: 0,
      possibleDuplicateCount: 0,
    })
  })

  it('uses valid source dates, account currencies and primary-card QR payments', () => {
    const dataset = createDemoDataset()
    for (const row of dataset.transactions) {
      expect(row.warnings).toEqual([])
      expect(row.transactionDate <= row.postingDate).toBe(true)
      for (const reference of row.sources) {
        const source = dataset.statements.find((item) => item.id === reference.statementId)!
        expect(row.postingDate >= source.period.from && row.postingDate <= source.period.to).toBe(true)
        expect(source.accounts.some((account) => account.id === row.accountId && account.currency === row.account.currency)).toBe(true)
        expect(reference.page).toBeLessThanOrEqual(source.pageCount)
      }
      if (row.classification.kind === 'purchase') expect(row.classification.region).not.toBeNull()
      if (row.classification.paymentMethod === 'unionpay-qr') {
        expect(dataset.cards.find((card) => card.id === row.cardId)?.role).toBe('primary')
      }
    }
    expect(new Set(dataset.transactions.map((row) => row.classification.kind)))
      .toEqual(new Set(['purchase', 'refund', 'repayment', 'fee']))
  })
})
