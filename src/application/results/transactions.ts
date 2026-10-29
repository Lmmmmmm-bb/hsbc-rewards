import type { RewardTier } from '@/domain/rewards/calculate'
import type { ResultScope } from './scope'
import { componentFlags } from './status'

export type TransactionFlag = 'pending' | 'uncertain' | 'excluded' | 'capped'
export interface TransactionFilter {
  readonly component?: RewardTier
  readonly flags?: readonly TransactionFlag[]
  readonly reason?: string
  readonly warning?: string
  readonly poolKey?: string
}

/** Flags match within the same component, shared by UI filters and Agent pagination. */
export function selectTransactions(
  scope: ResultScope,
  filter: TransactionFilter = {},
) {
  const byId = new Map(scope.rows.map((row) => [row.id, row]))
  return scope.rewards.flatMap((reward) => {
    const row = byId.get(reward.transactionId)!
    if (
      filter.warning &&
      !row.warnings.some((warning) => warning.code === filter.warning)
    )
      return []
    const matchedComponents = reward.tiers
      .filter(
        (tier) =>
          (!filter.component || tier.tier === filter.component) &&
          (!filter.reason || tier.reasonCodes.includes(filter.reason)) &&
          (!filter.poolKey || tier.poolKey === filter.poolKey) &&
          (!filter.flags?.length ||
            filter.flags.some((flag) => componentFlags(tier, row)[flag])),
      )
      .map((tier) => tier.tier)
    return matchedComponents.length ? [{ row, reward, matchedComponents }] : []
  })
}

export type ResultTransaction = ReturnType<typeof selectTransactions>[number]

export function transactionPage(
  scope: ResultScope,
  filter: TransactionFilter,
  cardId: string | null,
  page: number,
) {
  const rows = scope.rows.filter(
    (row) => cardId === null || row.cardId === cardId,
  )
  const ids = new Set(rows.map((row) => row.id))
  const entries = selectTransactions(
    {
      ...scope,
      rows,
      rewards: scope.rewards.filter((reward) => ids.has(reward.transactionId)),
    },
    filter,
  )
  const pages = Math.max(1, Math.ceil(entries.length / 20))
  const current = Math.max(0, Math.min(page, pages - 1))
  return {
    entries: entries.slice(current * 20, current * 20 + 20),
    count: entries.length,
    pages,
    current,
  }
}

export function componentExplanation(
  tier: ResultTransaction['reward']['tiers'][number],
) {
  if (!tier.reasonCodes.includes('reward.cap-applied')) return null
  return tier.capBasisMinor === null && tier.eligibleMinor === 0
    ? ('full' as const)
    : ('partial' as const)
}
