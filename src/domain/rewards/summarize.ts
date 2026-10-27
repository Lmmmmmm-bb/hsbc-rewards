import type { Card } from '../model/types'
import { safeInteger } from '../money/money'
import type { CardRewards, TransactionReward, RewardTier } from './calculate'

/** Summation only: uses the already clipped transaction results, without re-evaluating eligibility. */
export function summarizeCardRewards(
  transactions: readonly TransactionReward[],
  cards: readonly Card[],
): CardRewards[] {
  return cards.map((card) => {
    const rows = transactions.filter((row) => row.cardId === card.id)
    const totalFor = (tier: RewardTier) => {
      const values = rows.map(
        (row) => row.tiers.find((item) => item.tier === tier)?.microRc ?? null,
      )
      return values.some((value) => value === null)
        ? null
        : values.reduce<number>(
            (sum, value) => safeInteger(sum + (value ?? 0)),
            0,
          )
    }
    const basicMicroRc = totalFor('basic') ?? 0,
      abroadMicroRc = totalFor('abroad'),
      pulseMicroRc = totalFor('pulse')
    const knownMicroRc = rows.reduce(
      (sum, row) => safeInteger(sum + row.knownMicroRc),
      0,
    )
    const totalMicroRc =
      abroadMicroRc === null || pulseMicroRc === null
        ? null
        : safeInteger(basicMicroRc + abroadMicroRc + pulseMicroRc)
    return {
      cardId: card.id,
      basicMicroRc,
      abroadMicroRc,
      pulseMicroRc,
      knownMicroRc,
      totalMicroRc,
      wholeRc:
        totalMicroRc === null ? null : Math.floor(totalMicroRc / 1_000_000),
      remainderMicroRc: totalMicroRc === null ? null : totalMicroRc % 1_000_000,
    }
  })
}
