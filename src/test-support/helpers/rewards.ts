import type { Dataset } from '@/domain/model/types'
import { reconcileStatement } from '@/domain/reconciliation/reconcile'
import { calculateRewards } from '@/domain/rewards/calculate'

export function rewardContext(dataset: Dataset, hkdToCnyPpm: number | null) {
  return {
    rewards: calculateRewards(dataset.transactions, dataset.cards, {
      hkdToCnyPpm,
    }),
    reports: dataset.statements.map((statement) => ({
      statement,
      accounts: reconcileStatement(statement, dataset.transactions),
    })),
  }
}
