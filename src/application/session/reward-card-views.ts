import type { Dataset } from '@/domain/model/types'
import type { calculateRewards } from '@/domain/rewards/calculate'
import { microRcToCnyMinor } from '@/domain/money/money'
import { deriveRewardDetails } from './reward-details'
import { deriveRewardPoolViews } from './reward-pools'
import { deriveRewardQuality, type StatementReport } from './reward-quality'

export function deriveRewardCardViews(
  dataset: Dataset,
  rewards: ReturnType<typeof calculateRewards>,
  reports: readonly StatementReport[],
  rate: number | null,
) {
  const details = deriveRewardDetails(dataset, rewards)
  const quality = deriveRewardQuality(dataset, rewards, reports)
  const pools = deriveRewardPoolViews(dataset, rewards)

  return {
    coverage: details.coverage,
    quality: quality.total,
    rewardCards: rewards.cards.map((result) => ({
      ...result,
      ...details.cards.find((card) => card.cardId === result.cardId)!,
      card: dataset.cards.find((card) => card.id === result.cardId)!,
      quality: quality.byCard.get(result.cardId)!,
      cnyMinor:
        result.totalMicroRc === null
          ? null
          : microRcToCnyMinor(result.totalMicroRc, rate),
      pools: pools.get(result.cardId) ?? [],
    })),
  }
}
