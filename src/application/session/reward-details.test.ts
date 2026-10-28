import { describe, expect, it } from 'vitest'
import { calculateRewards } from '@/domain/rewards/calculate'
import { createDemoDataset } from '@/application/demo/dataset'
import { testCard, statement, transaction } from '@/tests/fixtures/dataset'
import { deriveRewardDetails } from './reward-details'

describe('reward display aggregates', () => {
  it('keeps source coverage and zero-balance currencies for a parsed card with no transactions', () => {
    const dataset = {
      cards: [
        {
          ...testCard,
          statementIds: ['statement-a'],
          accountIds: ['account-cny', 'account-hkd'],
        },
      ],
      statements: [
        statement({
          accounts: [
            {
              id: 'account-cny',
              currency: 'CNY' as const,
              openingMinor: 0,
              closingMinor: 0,
            },
            {
              id: 'account-hkd',
              currency: 'HKD' as const,
              openingMinor: 0,
              closingMinor: 0,
            },
          ],
        }),
      ],
      transactions: [],
    }
    const details = deriveRewardDetails(
      dataset,
      calculateRewards([], dataset.cards),
    )
    expect(details.cards[0]).toMatchObject({
      statementCount: 1,
      transactionCount: 0,
      currencies: ['HKD', 'CNY'],
      spend: [
        { currency: 'HKD', minor: 0 },
        { currency: 'CNY', minor: 0 },
      ],
    })
    expect(details.cards[0].coverage).not.toBeNull()
  })
  it('keeps currencies separate and excludes refunds, repayments and fees from purchases', () => {
    const dataset = createDemoDataset()
    const details = deriveRewardDetails(
      dataset,
      calculateRewards(dataset.transactions, dataset.cards, {
        hkdToCnyPpm: 900000,
      }),
    )
    expect(details.cards[0]).toMatchObject({
      transactionCount: 22,
      purchaseCount: 14,
      statementCount: 3,
      spend: [
        { currency: 'HKD', minor: 400000 },
        { currency: 'CNY', minor: 10100000 },
      ],
    })
    expect(
      details.cards[0].tiers.find((tier) => tier.tier === 'pulse')
        ?.eligibleSpend,
    ).toEqual([
      { currency: 'HKD', minor: 10000 },
      { currency: 'CNY', minor: 8520000 },
    ])
    expect(details.coverage).toEqual({ from: '2025-11-23', to: '2026-10-22' })
  })

  it('propagates unknown FX only into the affected tier and currency', () => {
    const rows = [
      transaction(),
      transaction({
        id: 'hkd',
        transactionDate: '2026-10-20',
        account: { currency: 'HKD', minor: 10000 },
        original: { currency: 'JPY', minor: 100000 },
        classification: { ...transaction().classification, region: 'JP' },
      }),
    ]
    const dataset = {
      cards: [testCard],
      statements: [statement()],
      transactions: rows,
    }
    const details = deriveRewardDetails(
      dataset,
      calculateRewards(rows, dataset.cards),
    )
    expect(
      details.cards[0].tiers.find((tier) => tier.tier === 'basic')
        ?.eligibleSpend,
    ).toEqual([
      { currency: 'HKD', minor: 10000 },
      { currency: 'CNY', minor: 25000 },
    ])
    // A missing basis makes the shared annual pool unknown for its later transactions too.
    expect(
      details.cards[0].tiers.find((tier) => tier.tier === 'abroad')
        ?.eligibleSpend,
    ).toEqual([
      { currency: 'HKD', minor: null },
      { currency: 'CNY', minor: null },
    ])
    expect(
      details.cards[0].tiers.find((tier) => tier.tier === 'pulse')
        ?.eligibleSpend,
    ).toEqual([
      { currency: 'HKD', minor: 0 },
      { currency: 'CNY', minor: 25000 },
    ])
  })

  it('uses engine clipping instead of counting full purchase amounts beyond a cap', () => {
    const row = transaction({
      account: { currency: 'CNY', minor: 9000000 },
      original: { currency: 'CNY', minor: 9000000 },
    })
    const dataset = {
      cards: [testCard],
      statements: [statement()],
      transactions: [row],
    }
    const details = deriveRewardDetails(
      dataset,
      calculateRewards([row], dataset.cards, { hkdToCnyPpm: 900000 }),
    )
    expect(details.cards[0].spend).toEqual([
      { currency: 'CNY', minor: 9000000 },
    ])
    expect(
      details.cards[0].tiers.find((tier) => tier.tier === 'pulse')
        ?.eligibleSpend,
    ).toEqual([{ currency: 'CNY', minor: 8000000 }])
  })

  it('counts all source statements of a deduplicated transaction without duplicating spend', () => {
    const second = statement({
      id: 'second',
      period: { from: '2026-10-01', to: '2026-10-31' },
    })
    const row = transaction({
      sources: [
        ...transaction().sources,
        { ...transaction().sources[0], statementId: 'second' },
      ],
    })
    const dataset = {
      cards: [testCard],
      statements: [statement(), second],
      transactions: [row],
    }
    const details = deriveRewardDetails(
      dataset,
      calculateRewards([row], dataset.cards),
    )
    expect(details.cards[0]).toMatchObject({
      statementCount: 2,
      transactionCount: 1,
      spend: [{ currency: 'CNY', minor: 25000 }],
      coverage: { from: '2026-09-21', to: '2026-10-31' },
    })
    expect(
      deriveRewardDetails(
        { cards: [], statements: [], transactions: [] },
        calculateRewards([], []),
      ).coverage,
    ).toBeNull()
  })
})
