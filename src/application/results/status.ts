import type { Transaction } from '@/domain/model/types'
import type { TierReward } from '@/domain/rewards/calculate'

/** Shared interpretation of engine results; no eligibility or rewards are recalculated. */
export function componentFlags(tier: TierReward, row: Transaction) {
  const uncertain =
    tier.reasonCodes.some((code) =>
      ['region.unknown', 'currency.original-unknown'].includes(code),
    ) || row.warnings.some((warning) => warning.code === 'date.outside-period')
  const capped = tier.reasonCodes.includes('reward.cap-applied')
  return {
    pending: tier.microRc === null,
    uncertain,
    excluded: tier.eligibleMinor === 0 && !uncertain && !capped,
    capped,
  }
}
