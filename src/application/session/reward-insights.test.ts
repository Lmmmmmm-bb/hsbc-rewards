import { describe, expect, it } from 'vitest'
import type { Dataset } from '@/domain/model/types'
import { createDemoDataset } from '@/application/demo/dataset'
import { classifyTransaction } from '@/domain/classification/classify'
import { calculateRewards } from '@/domain/rewards/calculate'
import { reconcileStatement } from '@/domain/reconciliation/reconcile'
import { deduplicateTransactions } from '@/domain/normalization/deduplicate'
import { statement, testCard, transaction } from '@/test-support/fixtures'
import { deriveRewardDetails } from './reward-details'
import { deriveRewardQuality } from './reward-quality'
import { deriveRewardPoolViews } from './reward-pools'
import { deriveWorkspace } from './selectors'

function inspect(dataset: Dataset, rate: number | null = 900000) {
  const rewards = calculateRewards(dataset.transactions, dataset.cards, {
    hkdToCnyPpm: rate,
  })
  const reports = dataset.statements.map((statement) => ({
    statement,
    accounts: reconcileStatement(statement, dataset.transactions),
  }))
  return {
    rewards,
    quality: deriveRewardQuality(dataset, rewards, reports),
    pools: deriveRewardPoolViews(dataset, rewards),
  }
}

describe('read-only reward insights', () => {
  it('separates balance mismatch, missing eligibility evidence and excluded payments in the demo', () => {
    const { quality } = inspect(createDemoDataset())
    expect(quality.total).toMatchObject({
      matchedAccounts: 2,
      mismatchAccounts: 1,
      unverifiedAccounts: 0,
      excludedCount: 3,
      uncertainEligibilityCount: 1,
      possibleDuplicateCount: 0,
    })
    expect(quality.byCard.get('demo-main')).toMatchObject({
      matchedAccounts: 1,
      mismatchAccounts: 1,
      excludedCount: 3,
      uncertainEligibilityCount: 0,
    })
    expect(quality.byCard.get('demo-additional')).toMatchObject({
      matchedAccounts: 1,
      excludedCount: 0,
      uncertainEligibilityCount: 1,
    })
  })

  it('does not count a shared source-account reconciliation twice in global quality', () => {
    const pool = { id: 'shared', evidence: 'statement-account' as const }
    const cards = [
      {
        ...testCard,
        pool,
        statementIds: ['statement-a'],
        accountIds: ['account-cny'],
      },
      {
        ...testCard,
        id: 'second-card',
        pool,
        statementIds: ['statement-a'],
        accountIds: ['account-cny'],
      },
    ]
    const dataset: Dataset = {
      cards,
      statements: [
        statement({
          accounts: [
            {
              id: 'account-cny',
              currency: 'CNY',
              openingMinor: 0,
              closingMinor: 50000,
            },
          ],
        }),
      ],
      transactions: [
        transaction(),
        transaction({ id: 'second-row', cardId: 'second-card' }),
      ],
    }
    const { quality } = inspect(dataset)
    expect(quality.total.matchedAccounts).toBe(1)
    expect(quality.byCard.get(testCard.id)?.matchedAccounts).toBe(1)
    expect(quality.byCard.get('second-card')?.matchedAccounts).toBe(1)
  })

  it('keeps a missing opening balance unverified rather than matched to an invented zero', () => {
    const dataset: Dataset = {
      cards: [testCard],
      transactions: [transaction()],
      statements: [
        statement({
          accounts: [
            {
              id: 'account-cny',
              currency: 'CNY',
              openingMinor: null,
              closingMinor: 25000,
            },
          ],
        }),
      ],
    }
    expect(inspect(dataset).quality.total).toMatchObject({
      matchedAccounts: 0,
      mismatchAccounts: 0,
      unverifiedAccounts: 1,
    })
  })

  it('counts suspicious transactions once despite multiple provenance rows and affected tiers', () => {
    const row = transaction({
      sources: [
        ...transaction().sources,
        { ...transaction().sources[0], row: 2 },
      ],
    })
    const transactions = deduplicateTransactions([
      row,
      { ...row, id: 'second-row' },
    ]).transactions
    const { quality } = inspect(
      { cards: [testCard], statements: [statement()], transactions },
      null,
    )
    expect(quality.total.possibleDuplicateCount).toBe(2)
    expect(quality.total.uncertainEligibilityCount).toBe(0)
  })

  it('exposes known rewards inside an otherwise pending tier and preserves unknown currency amounts', () => {
    const hkd = transaction({
      id: 'earlier',
      accountId: 'account-hkd',
      transactionDate: '2026-10-18',
      postingDate: '2026-10-19',
      original: { currency: 'MOP', minor: 10300 },
      account: { currency: 'HKD', minor: 10000 },
      classification: {
        ...transaction().classification,
        region: 'MO',
        paymentMethod: 'apple-pay',
      },
    })
    const dataset: Dataset = {
      cards: [testCard],
      statements: [
        statement({
          accounts: [
            {
              id: 'account-hkd',
              currency: 'HKD',
              openingMinor: 0,
              closingMinor: 10000,
            },
            {
              id: 'account-cny',
              currency: 'CNY',
              openingMinor: 0,
              closingMinor: 25000,
            },
          ],
        }),
      ],
      transactions: [hkd, transaction()],
    }
    const { rewards } = inspect(dataset, null)
    const abroad = deriveRewardDetails(dataset, rewards).cards[0].tiers.find(
      (tier) => tier.tier === 'abroad',
    )!
    expect(abroad.knownMicroRc).toBe(2000000)
    expect(abroad.eligibleSpend).toEqual([
      { currency: 'HKD', minor: 10000 },
      { currency: 'CNY', minor: null },
    ])
    expect(abroad.reasons).toEqual([
      { code: 'fx.required-for-cap', count: 1 },
      { code: 'reward.eligible', count: 1 },
    ])
    const view = deriveWorkspace({
      revision: 0,
      mode: 'real',
      dataset,
      fx: { source: 'unavailable', hkdToCnyPpm: null, stale: false },
    })
    expect(
      view.tierTotals.find((tier) => tier.tier === 'abroad'),
    ).toMatchObject({ microRc: null, knownMicroRc: 2000000 })
    expect(view.knownRewardMicroRc).toBe(10400000)
    expect(view.totalRewardMicroRc).toBeNull()
  })

  it('shows untouched observed-period caps without creating activity in the reward engine', () => {
    const local = transaction({
      original: { currency: 'HKD', minor: 25000 },
      account: { currency: 'HKD', minor: 25000 },
      classification: { ...transaction().classification, region: 'HK' },
    })
    const { rewards, pools } = inspect({
      cards: [testCard],
      statements: [statement()],
      transactions: [local],
    })
    expect(rewards.pools).toEqual([])
    expect(pools.get(testCard.id)).toHaveLength(2)
    expect(
      pools.get(testCard.id)?.find((pool) => pool.tier === 'abroad'),
    ).toMatchObject({ period: '2026', usedMinor: 0, remainingMinor: 10000000 })
    expect(
      pools.get(testCard.id)?.find((pool) => pool.tier === 'pulse'),
    ).toMatchObject({
      period: '2026-H2',
      usedMinor: 0,
      remainingMinor: 8000000,
    })
  })

  it('does not turn missing-FX pool state into an unused zero balance', () => {
    const { rewards, pools } = inspect(
      {
        cards: [testCard],
        statements: [statement()],
        transactions: [transaction()],
      },
      null,
    )
    expect(
      pools.get(testCard.id)?.find((pool) => pool.tier === 'abroad'),
    ).toEqual(rewards.pools.find((pool) => pool.tier === 'abroad'))
    expect(
      pools.get(testCard.id)?.find((pool) => pool.tier === 'abroad'),
    ).toMatchObject({
      usedMinor: null,
      remainingMinor: null,
      verification: 'missing-fx',
    })
    expect(pools.get(testCard.id)).toHaveLength(2)
  })

  it('uses transaction years and half-years for complete shared views without double-computing pools', () => {
    const pool = { id: 'shared', evidence: 'statement-account' as const }
    const cards = [
      { ...testCard, pool },
      { ...testCard, id: 'second-card', pool },
    ]
    const local = (id: string, cardId: string, date: string) =>
      transaction({
        id,
        cardId,
        transactionDate: date,
        original: { currency: 'HKD', minor: 25000 },
        account: { currency: 'HKD', minor: 25000 },
        classification: { ...transaction().classification, region: 'HK' },
      })
    const { rewards, pools } = inspect({
      cards,
      statements: [statement()],
      transactions: [
        local('old', testCard.id, '2025-12-31'),
        local('new', 'second-card', '2026-01-01'),
      ],
    })
    expect(rewards.pools).toHaveLength(0)
    expect(pools.get(testCard.id)).toEqual(pools.get('second-card'))
    expect(pools.get(testCard.id)?.map((pool) => pool.period)).toEqual([
      '2026',
      '2025',
      '2026-H1',
      '2025-H2',
    ])
    expect(pools.get(testCard.id)?.every((pool) => pool.shared)).toBe(true)
  })

  it('uses confirmed statement associations for empty cards and does not guess associations for legacy empty cards', () => {
    const dataset: Dataset = {
      cards: [
        {
          ...testCard,
          statementIds: ['statement-a'],
          accountIds: ['account-cny'],
        },
      ],
      statements: [statement()],
      transactions: [],
    }
    expect(inspect(dataset).pools.get(testCard.id)).toHaveLength(2)
    expect(
      inspect({ ...dataset, cards: [testCard] }).pools.get(testCard.id),
    ).toEqual([])
  })

  it('explains excluded reloads, nonpositive values and unknown regions without changing reward amounts', () => {
    const reload = classifyTransaction(
      transaction({ description: 'SYNTHETIC EWALLET TOP UP CN' }),
    )
    const result = calculateRewards([reload], [testCard])
    expect(result.cards[0].totalMicroRc).toBe(0)
    expect(
      result.transactions[0].tiers.every((tier) =>
        tier.reasonCodes.includes('eligibility.excluded-merchant'),
      ),
    ).toBe(true)
    const zero = calculateRewards(
      [transaction({ account: { currency: 'CNY', minor: 0 } })],
      [testCard],
    )
    expect(
      zero.transactions[0].tiers.every((tier) =>
        tier.reasonCodes.includes('transaction.non-positive'),
      ),
    ).toBe(true)
    const unknown = calculateRewards(
      [
        transaction({
          classification: { ...transaction().classification, region: null },
        }),
      ],
      [testCard],
    )
    expect(unknown.cards[0].totalMicroRc).toBe(1000000)
    expect(
      unknown.transactions[0].tiers.find((tier) => tier.tier === 'pulse')
        ?.reasonCodes,
    ).toEqual(['region.unknown'])
  })
})
