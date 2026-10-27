import { describe, expect, it } from 'vitest'
import type { Card, Dataset } from '@/domain/model/types'
import { statement, testCard, transaction } from '@/test-support/fixtures/dataset'
import { rewardContext } from '@/test-support/helpers/rewards'
import { deriveRewardPeriods } from './reward-periods'

const shared = {
  id: 'confirmed-family',
  evidence: 'statement-account' as const,
}
const card = (id = testCard.id): Card => ({
  ...testCard,
  id,
  pool: shared,
  statementIds: ['statement-a'],
  accountIds: ['account-cny'],
})
function inspect(dataset: Dataset, rate: number | null = 850000) {
  const { rewards, reports } = rewardContext(dataset, rate)
  return {
    rewards,
    periods: deriveRewardPeriods(dataset, rewards, reports, rate),
  }
}
function abroad(id: string, cardId: string, date: string, minor: number) {
  return transaction({
    id,
    cardId,
    transactionDate: date,
    postingDate: '2026-07-02',
    account: { currency: 'HKD', minor },
    original: { currency: 'MOP', minor },
    classification: {
      ...transaction().classification,
      region: 'MO',
      paymentMethod: 'apple-pay',
    },
  })
}

describe('natural half-year reward views', () => {
  it('keeps annual use across two half-years and shared cards, while resetting the PULSE half-year pool', () => {
    const dataset: Dataset = {
      cards: [card(), card('additional')],
      statements: [
        statement({
          date: '2026-07-20',
          period: { from: '2026-06-21', to: '2026-07-20' },
          accounts: [
            {
              id: 'account-cny',
              currency: 'HKD',
              openingMinor: 0,
              closingMinor: 12000000,
            },
          ],
        }),
      ],
      transactions: [
        abroad('june', testCard.id, '2026-06-30', 9000000),
        abroad('july', 'additional', '2026-07-01', 3000000),
      ],
    }
    const { periods } = inspect(dataset)
    expect(periods.map((period) => period.id)).toEqual(['2026-H2', '2026-H1'])
    const [second, first] = periods
    expect(first.totalRewardMicroRc).toBe(3760000000)
    expect(second.totalRewardMicroRc).toBe(920000000)
    expect(
      first.rewardCards[0].pools.find((pool) => pool.tier === 'abroad')
        ?.usedMinor,
    ).toBe(9000000)
    expect(
      second.rewardCards[0].pools.find((pool) => pool.tier === 'abroad')
        ?.usedMinor,
    ).toBe(10000000)
    expect(
      second.rewardCards[0].pools.find((pool) => pool.tier === 'pulse')
        ?.usedMinor,
    ).toBe(3000000)
    expect(first.statementCount).toBe(1)
    expect(second.statementCount).toBe(1)
    expect(first.cardCount).toBe(1)
    expect(second.quality.matchedAccounts).toBe(1)
  })
  it('uses transaction date instead of posting date and resets annual caps when the year changes', () => {
    const { periods } = inspect({
      cards: [card()],
      statements: [statement()],
      transactions: [
        abroad('old', testCard.id, '2025-12-31', 10000000),
        abroad('new', testCard.id, '2026-01-01', 10000000),
      ],
    })
    expect(periods.map((period) => period.id)).toEqual(['2026-H1', '2025-H2'])
    expect(
      periods.every(
        (period) => period.rewardCards[0].abroadMicroRc === 2000000000,
      ),
    ).toBe(true)
    expect(
      periods.map(
        (period) =>
          period.rewardCards[0].pools.find((pool) => pool.tier === 'abroad')
            ?.period,
      ),
    ).toEqual(['2026', '2025'])
  })
  it('retains missing-FX uncertainty across the annual pool instead of inventing an unused second-half pool', () => {
    const row = transaction()
    const { periods } = inspect(
      {
        cards: [card()],
        statements: [statement()],
        transactions: [
          { ...row, id: 'first', transactionDate: '2026-06-30' },
          { ...row, id: 'second', transactionDate: '2026-07-01' },
        ],
      },
      null,
    )
    expect(periods.every((period) => period.totalRewardMicroRc === null)).toBe(
      true,
    )
    expect(
      periods.every((period) => period.knownRewardMicroRc === 6000000),
    ).toBe(true)
    expect(
      periods.every(
        (period) =>
          period.rewardCards[0].pools.find((pool) => pool.tier === 'abroad')
            ?.usedMinor === null,
      ),
    ).toBe(true)
  })
  it('keeps genuine empty-card sources and full untouched caps in their associated half-year', () => {
    const { periods } = inspect({
      cards: [card()],
      statements: [
        statement({
          accounts: [
            {
              id: 'account-cny',
              currency: 'CNY',
              openingMinor: 0,
              closingMinor: 0,
            },
          ],
        }),
      ],
      transactions: [],
    })
    expect(periods).toHaveLength(1)
    expect(periods[0]).toMatchObject({
      id: '2026-H2',
      totalRewardMicroRc: 0,
      expenseCount: 0,
      cardCount: 1,
      statementCount: 1,
    })
    expect(periods[0].rewardCards[0].pools).toHaveLength(2)
    expect(
      periods[0].rewardCards[0].pools.every((pool) => pool.usedMinor === 0),
    ).toBe(true)
  })
  it('does not assign an empty card to an earlier half just because another card used the same source statement', () => {
    const { periods } = inspect({
      cards: [card(), card('empty')],
      statements: [statement({ date: '2026-07-20' })],
      transactions: [transaction({ transactionDate: '2026-06-30' })],
    })
    expect(
      periods
        .find((period) => period.id === '2026-H1')
        ?.rewardCards.map((card) => card.cardId),
    ).toEqual([testCard.id])
    expect(
      periods
        .find((period) => period.id === '2026-H2')
        ?.rewardCards.map((card) => card.cardId),
    ).toEqual(['empty'])
  })
  it('aggregates unrounded awards, so two fractional periods still sum exactly to the complete result', () => {
    const local = transaction({
      original: { currency: 'HKD', minor: 100 },
      account: { currency: 'HKD', minor: 100 },
      classification: { ...transaction().classification, region: 'HK' },
    })
    const { rewards, periods } = inspect({
      cards: [card()],
      statements: [statement()],
      transactions: [
        { ...local, id: 'a', transactionDate: '2026-06-30' },
        { ...local, id: 'b', transactionDate: '2026-07-01' },
      ],
    })
    expect(periods.map((period) => period.totalRewardMicroRc)).toEqual([
      4000, 4000,
    ])
    expect(
      periods.reduce((sum, period) => sum + period.totalRewardMicroRc!, 0),
    ).toBe(rewards.cards[0].totalMicroRc)
    expect(rewards.cards[0].totalMicroRc).toBe(8000)
  })
})
