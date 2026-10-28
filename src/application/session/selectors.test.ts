import { describe, expect, it } from 'vitest'
import type { Dataset } from '@/domain/model/types'
import { statement, testCard, transaction } from '@/tests/fixtures/dataset'
import { rewardContext } from '@/tests/helpers/rewards'
import { deriveRewardDetails } from './reward-details'
import { deriveWorkspace } from './selectors'

describe('workspace reward queries', () => {
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
    const { rewards } = rewardContext(dataset, null)
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
})
