import { componentFlags } from '../results/status'
export { componentFlags } from '../results/status'
import { selectResultPools } from '../results/pools'
import type { AgentSnapshot } from './snapshots'
import type { AgentScope } from './scope'

export const BASELINE_ASSUMPTIONS = [
  'assumption.current-rules',
  'assumption.imported-spend-only',
  'assumption.opening-usage-zero',
  'assumption.refunds-no-clawback',
] as const

export function cardIdentity(snapshot: AgentSnapshot, card: AgentScope['cards'][number]) {
  return {
    cardRef: snapshot.references.get('card', card.cardId),
    maskedLastFour: /^\d{4}$/.test(card.card.lastFour) ? `••${card.card.lastFour}` : null,
    role: card.card.role,
  }
}

export function projectPools(snapshot: AgentSnapshot, scope: AgentScope) {
  return selectResultPools(snapshot.session, scope).map((pool) => ({
    poolRef: snapshot.references.get('pool', pool.key),
    cardRefs: pool.relatedCards.map((card) => snapshot.references.get('card', card.id)),
    shared: pool.shared, component: pool.tier, period: pool.period, basisCode: pool.basisCode,
    scale: 100, asOf: pool.asOf, observedThrough: pool.observedThrough,
    capMinor: pool.capMinor, usedMinor: pool.usedMinor, remainingMinor: pool.remainingMinor,
    verification: pool.verification,
  }))
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
