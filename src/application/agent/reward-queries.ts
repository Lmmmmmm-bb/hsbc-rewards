import { deriveRewardTotals } from '../session/reward-totals'
import { agentScope, type ResultScope } from './scope'
import type { AgentSnapshots, PageInput } from './snapshots'
import { cardIdentity, evidence, projectPools, resultMeta } from './projections'
import { AgentError } from './errors'

export interface SummaryInput extends PageInput { readonly periodId?: string; readonly resultToken?: string }
export interface CardRewardInput extends ResultScope { readonly cardRef: string; readonly resultToken: string }

function rewardAmounts(...args: Parameters<typeof deriveRewardTotals>) {
  const { tierTotals, totalRewardCnyMinor, ...amounts } = deriveRewardTotals(...args)
  return { ...amounts, cnyReferenceMinor: totalRewardCnyMinor,
    components: tierTotals.map(({ tier, ...component }) => ({ component: tier, ...component })) }
}

export function getAgentSummary(snapshots: AgentSnapshots, input: SummaryInput = {}) {
  if (input.cursor && !input.resultToken) throw new AgentError('invalid_arguments')
  const snapshot = snapshots.capture(input.resultToken)
  const scope = agentScope(snapshot, input)
  const cards = snapshots.page(scope.cards.map((card) => cardIdentity(snapshot, card)), input,
    JSON.stringify(['cards', scope.periodId]), snapshot.resultToken)
  return {
    meta: resultMeta(snapshot, scope),
    data: {
      ...rewardAmounts(scope.rewards, snapshot.session.fx.hkdToCnyPpm),
      ...evidence(scope),
      statementCount: scope.period?.statementCount ?? snapshot.session.dataset.statements.length,
      cardCount: scope.cards.length,
      transactionCount: scope.rows.length,
      purchaseCount: scope.rows.filter((row) => row.classification.kind === 'purchase' && row.account.minor > 0).length,
      availablePeriods: snapshot.view.periods.map(({ id, from, to }) => ({ id, from, to })),
      cards,
    },
  }
}

export function getAgentCardRewards(snapshots: AgentSnapshots, input: CardRewardInput) {
  const snapshot = snapshots.capture(input.resultToken)
  const scope = agentScope(snapshot, input)
  const card = scope.cards[0]
  const amounts = rewardAmounts(scope.rewards, snapshot.session.fx.hkdToCnyPpm)
  return {
    meta: resultMeta(snapshot, scope),
    data: {
      ...cardIdentity(snapshot, card),
      ...amounts,
      ...evidence(scope),
      transactionCount: card.transactionCount,
      purchaseCount: card.purchaseCount,
      spend: card.spend,
      components: card.tiers.map((tier) => ({ ...amounts.components.find((component) => component.component === tier.tier)!, rateBasisPoints: tier.rateBasisPoints,
        eligibleSpend: tier.eligibleSpend, reasons: tier.reasons })),
      pools: projectPools(snapshot, scope),
    },
  }
}
