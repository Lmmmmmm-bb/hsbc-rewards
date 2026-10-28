import type { Dataset } from '@/domain/model/types'
import type { calculateRewards, RewardPool } from '@/domain/rewards/calculate'
import { LATEST_RULES } from '@/domain/rewards/rules'
import { rewardPeriod } from '@/domain/normalization/dates'

/** Fill unused observed periods for presentation without changing the calculator's activity pools. */
export function deriveRewardPoolViews(
  dataset: Dataset,
  rewards: ReturnType<typeof calculateRewards>,
) {
  return new Map(
    dataset.cards.map((card) => {
      const ownerId = card.pool?.id ?? card.id
      const related = dataset.cards.filter((candidate) =>
        card.pool ? candidate.pool?.id === ownerId : candidate.id === card.id,
      )
      const cardIds = new Set(related.map((candidate) => candidate.id))
      const rows = dataset.transactions.filter((row) => cardIds.has(row.cardId))
      const sourceIds = new Set(
        related.flatMap((candidate) => candidate.statementIds ?? []),
      )
      const dates = rows.length
        ? rows.map((row) => row.transactionDate)
        : dataset.statements
            .filter((statement) => sourceIds.has(statement.id))
            .map((statement) => statement.date)
      const actual = rewards.pools.filter((pool) => pool.ownerId === ownerId)
      const pools: RewardPool[] = [...actual]
      for (const tier of ['abroad', 'pulse'] as const) {
        for (const period of new Set(
          dates.map((date) => rewardPeriod(date, LATEST_RULES[tier].period)),
        )) {
          if (
            pools.some((pool) => pool.tier === tier && pool.period === period)
          )
            continue

          pools.push({
            key: `unused:${ownerId}:${tier}:${period}`,
            ownerId,
            shared: Boolean(card.pool),
            tier,
            period,
            capMinor: LATEST_RULES[tier].capMinor,
            usedMinor: 0,
            remainingMinor: LATEST_RULES[tier].capMinor,
            verification: 'complete',
          })
        }
      }

      return [
        card.id,
        pools.sort(
          (a, b) =>
            a.tier.localeCompare(b.tier) || b.period.localeCompare(a.period),
        ),
      ]
    }),
  )
}
