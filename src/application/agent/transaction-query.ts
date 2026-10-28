import type { RewardTier } from '@/domain/rewards/calculate'
import { agentScope, type ResultScope } from './scope'
import type { AgentSnapshots, PageInput } from './snapshots'
import { componentFlags, resultMeta } from './projections'

export type TransactionFlag = 'pending' | 'uncertain' | 'excluded' | 'capped'
export interface TransactionInput extends ResultScope, PageInput {
  readonly resultToken: string
  readonly component?: RewardTier
  readonly flags?: readonly TransactionFlag[]
  readonly includeDescription?: boolean
}

export function listAgentTransactions(snapshots: AgentSnapshots, input: TransactionInput) {
  const snapshot = snapshots.capture(input.resultToken)
  const scope = agentScope(snapshot, input)
  const byId = new Map(scope.rows.map((row) => [row.id, row]))
  const rows = scope.rewards.flatMap((reward) => {
    const row = byId.get(reward.transactionId)!
    const matchedComponents = reward.tiers.filter((tier) =>
      (!input.component || tier.tier === input.component) &&
      (!input.flags?.length || input.flags.some((flag) => componentFlags(tier, row)[flag])),
    ).map((tier) => tier.tier)
    if (matchedComponents.length === 0) return []
    return [{ row, reward, matchedComponents }]
  })
  const binding = JSON.stringify(['transactions', scope.periodId, input.cardRef ?? null,
    input.component ?? null, [...new Set(input.flags ?? [])].sort(), input.includeDescription ?? false])
  const page = snapshots.page(rows, input, binding, snapshot.resultToken)
  return {
    meta: resultMeta(snapshot, scope),
    data: {
      ...page,
      items: page.items.map(({ row, reward, matchedComponents }) => ({
        transactionRef: snapshot.references.get('transaction', row.id),
        cardRef: snapshot.references.get('card', row.cardId),
        statementRefs: [...new Set(row.sources.map((source) => snapshot.references.get('statement', source.statementId)))],
        transactionDate: row.transactionDate,
        postingDate: row.postingDate,
        kind: row.classification.kind,
        original: row.original.currency === 'XXX' ? null : { ...row.original },
        account: { ...row.account },
        paymentMethod: row.classification.paymentMethod,
        region: row.classification.region,
        knownMicroRc: reward.knownMicroRc,
        microRc: reward.microRc,
        components: reward.tiers.map((tier) => ({ component: tier.tier, microRc: tier.microRc,
          rateBasisPoints: tier.rateBasisPoints, eligibleMinor: tier.eligibleMinor,
          cappedMinor: tier.cappedMinor, reasonCodes: [...tier.reasonCodes], flags: componentFlags(tier, row) })),
        matchedComponents,
        assumptionCodes: [...reward.assumptions],
        warningCodes: row.warnings.map((warning) => warning.code),
        ...(input.includeDescription ? { description: row.description } : {}),
      })),
    },
  }
}
