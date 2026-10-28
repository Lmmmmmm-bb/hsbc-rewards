import { describe, expect, it } from 'vitest'
import type { Dataset } from '@/domain/model/types'
import { statement, testCard, transaction } from '@/tests/fixtures/dataset'
import { rewardContext } from '@/tests/helpers/rewards'
import { deriveRewardPoolViews } from './reward-pools'

function inspect(dataset: Dataset, rate: number | null = 900000) {
  const { rewards } = rewardContext(dataset, rate)
  return { rewards, pools: deriveRewardPoolViews(dataset, rewards) }
}

describe('reward pool views', () => {
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
})
