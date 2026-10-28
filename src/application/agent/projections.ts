import type { Transaction } from '@/domain/model/types'
import type { RewardPool, TierReward } from '@/domain/rewards/calculate'
import type { AgentSnapshot } from './snapshots'
import type { AgentScope } from './scope'

export const BASELINE_ASSUMPTIONS = [
  'assumption.current-rules',
  'assumption.imported-spend-only',
  'assumption.opening-usage-zero',
  'assumption.refunds-no-clawback',
] as const

export function componentFlags(tier: TierReward, row: Transaction) {
  const uncertain = tier.reasonCodes.some((code) => ['region.unknown', 'currency.original-unknown'].includes(code)) ||
    row.warnings.some((warning) => warning.code === 'date.outside-period')
  const capped = tier.reasonCodes.includes('reward.cap-applied')

  return {
    pending: tier.microRc === null,
    uncertain,
    excluded: tier.eligibleMinor === 0 && !uncertain && !capped,
    capped,
  }
}

export function cardIdentity(snapshot: AgentSnapshot, card: AgentScope['cards'][number]) {
  return {
    cardRef: snapshot.references.get('card', card.cardId),
    maskedLastFour: /^\d{4}$/.test(card.card.lastFour) ? `••${card.card.lastFour}` : null,
    role: card.card.role,
  }
}

export function projectPools(snapshot: AgentSnapshot, scope: AgentScope) {
  const pools = new Map<string, RewardPool>()
  scope.cards.forEach((card) => card.pools.forEach((pool) => pools.set(pool.key, pool)))

  return [...pools.values()].map((pool) => {
    const year = pool.period.slice(0, 4)
    const periodEnd = pool.period.endsWith('H1') ? `${year}-06-30` : `${year}-12-31`
    const asOf = scope.period && scope.period.to < periodEnd ? scope.period.to : periodEnd
    const relatedCards = snapshot.session.dataset.cards.filter((card) => (card.pool?.id ?? card.id) === pool.ownerId)
    const relatedIds = new Set(relatedCards.map((card) => card.id))
    const from = pool.period.endsWith('H2') ? `${year}-07-01` : `${year}-01-01`
    const observedThrough = snapshot.session.dataset.transactions
      .filter((row) => relatedIds.has(row.cardId) && row.transactionDate >= from && row.transactionDate <= asOf)
      .map((row) => row.transactionDate).sort().at(-1) ?? null

    return {
      poolRef: snapshot.references.get('pool', pool.key),
      cardRefs: relatedCards.map((card) => snapshot.references.get('card', card.id)),
      shared: pool.shared,
      component: pool.tier,
      period: pool.period,
      basisCode: pool.tier === 'abroad' ? 'hkd-equivalent' as const : 'pulse-hkd-cny' as const,
      scale: 100,
      asOf,
      observedThrough,
      capMinor: pool.capMinor,
      usedMinor: pool.usedMinor,
      remainingMinor: pool.remainingMinor,
      verification: pool.verification,
    }
  })
}

export function resultMeta(snapshot: AgentSnapshot, scope: AgentScope) {
  return {
    mode: snapshot.session.mode,
    resultToken: snapshot.resultToken,
    periodId: scope.periodId,
    window: scope.period ? { from: scope.period.from, to: scope.period.to } : null,
    rules: { id: snapshot.view.rules.id, verifiedAt: snapshot.view.rules.verifiedAt },
    fx: { ...snapshot.session.fx },
  }
}

export function evidence(scope: AgentScope) {
  const byId = new Map(scope.rows.map((row) => [row.id, row]))
  return {
    calculationStatus: scope.rewards.some((reward) => reward.microRc === null) ? 'partial' as const : 'calculated' as const,
    pendingTransactionCount: scope.rewards.filter((reward) => reward.microRc === null).length,
    uncertainEligibilityCount: scope.rewards.filter((reward) => reward.tiers.some((tier) => componentFlags(tier, byId.get(reward.transactionId)!).uncertain)).length,
    assumptionCodes: [...new Set([
      ...BASELINE_ASSUMPTIONS,
      ...scope.cards.flatMap((card) => card.assumptions),
      ...scope.rewards.flatMap((reward) => reward.assumptions),
    ])].sort(),
    quality: scope.cardId === null ? scope.view.quality : scope.cards[0].quality,
    observedCoverage: scope.cardId === null ? scope.view.coverage : scope.cards[0].coverage,
  }
}
