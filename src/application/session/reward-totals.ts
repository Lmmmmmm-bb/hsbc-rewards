import { addMinor, microRcToCnyMinor } from '@/domain/money/money'
import type { TransactionReward } from '@/domain/rewards/calculate'

export function deriveRewardTotals(
  rows: readonly TransactionReward[],
  rate: number | null,
) {
  const knownRewardMicroRc = addMinor(rows.map((row) => row.knownMicroRc))
  const totalRewardMicroRc = rows.some((row) => row.microRc === null)
    ? null
    : knownRewardMicroRc
  return {
    totalRewardMicroRc,
    knownRewardMicroRc,
    totalRewardCnyMinor:
      totalRewardMicroRc === null
        ? null
        : microRcToCnyMinor(totalRewardMicroRc, rate),
    tierTotals: (['basic', 'abroad', 'pulse'] as const).map((tier) => {
      const amounts = rows.map(
        (row) => row.tiers.find((item) => item.tier === tier)!.microRc,
      )
      const knownMicroRc = addMinor(amounts.map((amount) => amount ?? 0))
      return {
        tier,
        knownMicroRc,
        microRc: amounts.some((amount) => amount === null)
          ? null
          : knownMicroRc,
      }
    }),
  }
}
