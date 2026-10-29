import type { SessionState } from '../session/types'
import type { RewardPool } from '@/domain/rewards/calculate'
import type { ResultScope } from './scope'

/** Preserve each period's engine snapshot and deduplicate shared pools within that snapshot. */
export function selectResultPools(session: SessionState, scope: ResultScope) {
  const pools = new Map<string, RewardPool>()
  scope.cards.forEach((card) =>
    card.pools.forEach((pool) => pools.set(pool.key, pool)),
  )
  return [...pools.values()].map((pool) => {
    const year = pool.period.slice(0, 4)
    const periodEnd = pool.period.endsWith('H1')
      ? `${year}-06-30`
      : `${year}-12-31`
    const asOf =
      scope.period && scope.period.to < periodEnd ? scope.period.to : periodEnd
    const from = pool.period.endsWith('H2') ? `${year}-07-01` : `${year}-01-01`
    const relatedCards = session.dataset.cards.filter(
      (card) => (card.pool?.id ?? card.id) === pool.ownerId,
    )
    const cardIds = new Set(relatedCards.map((card) => card.id))
    const rows = session.dataset.transactions.filter(
      (row) =>
        cardIds.has(row.cardId) &&
        row.transactionDate >= from &&
        row.transactionDate <= asOf,
    )
    const dates = rows.map((row) => row.transactionDate).sort()
    const sourceIds = new Set([
      ...rows.flatMap((row) => row.sources.map((source) => source.statementId)),
      ...relatedCards.flatMap((card) => card.statementIds ?? []),
    ])
    const statements = session.dataset.statements.filter(
      (statement) =>
        sourceIds.has(statement.id) &&
        statement.period.to >= from &&
        statement.period.from <= asOf,
    )
    return {
      ...pool,
      relatedCards,
      asOf,
      from,
      basisCode:
        pool.tier === 'abroad'
          ? ('hkd-equivalent' as const)
          : ('pulse-hkd-cny' as const),
      observedFrom: dates[0] ?? null,
      observedThrough: dates.at(-1) ?? null,
      statements,
      referenceFx: rows.some((row) =>
        scope.workspace.rewards.byTransaction
          .get(row.id)
          ?.tiers.some(
            (tier) => tier.poolKey === pool.key && tier.capUsesReferenceFx,
          ),
      ),
    }
  })
}

export type ResultPool = ReturnType<typeof selectResultPools>[number]
