import { describe, expect, it } from 'vitest'
import { testCard, transaction } from '@/tests/fixtures/dataset'
import { calculateRewards } from './calculate'

describe('accrued RC precision', () => {
  it('carries tiny awards rather than rounding every transaction to cents or whole RC', () => {
    const row = transaction({
      original: { currency: 'HKD', minor: 1 },
      account: { currency: 'HKD', minor: 1 },
      classification: { ...transaction().classification, region: 'HK' },
    })
    const result = calculateRewards(
      Array.from({ length: 100 }, (_, index) => ({
        ...row,
        id: String(index),
      })),
      [testCard],
    )

    expect(result.cards[0].totalMicroRc).toBe(4000)
    expect(result.cards[0].remainderMicroRc).toBe(4000)
  })

  it('does not change an uncapped award when the same spending is split into multiple transactions', () => {
    const create = (id: string, amount: number) =>
      transaction({
        id,
        account: { currency: 'CNY', minor: amount },
        original: { currency: 'CNY', minor: amount },
      })

    const single = calculateRewards([create('single', 123456)], [testCard], {
      hkdToCnyPpm: 850000,
    })
    const split = calculateRewards(
      [create('a', 100), create('b', 123356)],
      [testCard],
      { hkdToCnyPpm: 850000 },
    )

    expect(split.cards[0].totalMicroRc).toBe(single.cards[0].totalMicroRc)
    expect(single.cards[0].totalMicroRc).toBe(54320640)
  })

  it('only truncates sub-microRC at a proportional cap boundary and preserves exact pool snapshots', () => {
    const before = transaction({
      id: 'before',
      transactionDate: '2026-10-18',
      original: { currency: 'MOP', minor: 9999999 },
      account: { currency: 'HKD', minor: 9999999 },
    })
    const edge = transaction({
      id: 'edge',
      account: { currency: 'CNY', minor: 1 },
      original: { currency: 'CNY', minor: 1 },
      bankHkdEquivalentMinor: 3,
    })
    const result = calculateRewards([before, edge], [testCard], {
      hkdToCnyPpm: 850000,
    })
    const first = result.byTransaction
      .get('before')!
      .tiers.find((tier) => tier.tier === 'abroad')!
    const last = result.byTransaction
      .get('edge')!
      .tiers.find((tier) => tier.tier === 'abroad')!

    expect(first.poolAfter?.usedMinor).toBe(9999999)
    expect(last.poolAfter?.usedMinor).toBe(10000000)
    expect(last.microRc).toBe(66)
    expect(first.poolAfter?.usedMinor).toBe(9999999)
  })
})
