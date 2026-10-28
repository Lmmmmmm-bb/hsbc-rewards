import { agentScope, type ResultScope } from './scope'
import type { AgentSnapshots, PageInput } from './snapshots'
import { evidence, resultMeta } from './projections'

export interface QualityInput extends ResultScope, PageInput { readonly resultToken: string }
type QualityItem =
  | { kind: 'transaction'; transactionRef: string; codes: readonly string[] }
  | { kind: 'statement'; statementRef: string; codes: readonly string[] }
  | { kind: 'card'; cardRef: string; codes: readonly string[] }
  | { kind: 'reconciliation'; statementRef: string; currency: string; status: string; deltaMinor: number | null; scope: 'full-source-statement' }

export function getAgentQuality(snapshots: AgentSnapshots, input: QualityInput) {
  const snapshot = snapshots.capture(input.resultToken)
  const scope = agentScope(snapshot, input)
  const byId = new Map(scope.rewards.map((row) => [row.transactionId, row]))
  const items: QualityItem[] = scope.rows.flatMap((row) => {
    const reward = byId.get(row.id)!
    const codes = [...new Set([
      ...row.warnings.map((warning) => warning.code), ...reward.assumptions,
      ...reward.tiers.flatMap((tier) => tier.reasonCodes.filter((code) =>
        ['region.unknown', 'currency.original-unknown', 'fx.required-for-cap'].includes(code))),
    ])].sort()
    return codes.length ? [{ kind: 'transaction', transactionRef: snapshot.references.get('transaction', row.id), codes }] : []
  })
  for (const card of scope.cards) {
    const codes = (card.card.warnings ?? []).map((warning) => warning.code)
    if (codes.length) items.push({ kind: 'card', cardRef: snapshot.references.get('card', card.cardId), codes })
  }
  for (const report of snapshot.view.reports.filter((report) => scope.sourceIds.has(report.statement.id))) {
    const statementRef = snapshot.references.get('statement', report.statement.id)
    const codes = report.statement.warnings.map((warning) => warning.code)
    if (codes.length) items.push({ kind: 'statement', statementRef, codes })
    for (const account of report.accounts) {
      if (scope.cardId !== null && !scope.cards[0].card.accountIds?.includes(account.accountId) &&
        !scope.rows.some((row) => row.accountId === account.accountId)) continue
      items.push({ kind: 'reconciliation', statementRef, currency: account.currency,
        status: account.status, deltaMinor: account.deltaMinor, scope: 'full-source-statement' })
    }
  }
  return {
    meta: resultMeta(snapshot, scope),
    data: {
      ...evidence(scope),
      reconciliationScope: 'full-source-statement' as const,
      issues: snapshots.page(items, input, JSON.stringify(['quality', scope.periodId, input.cardRef ?? null]), snapshot.resultToken),
    },
  }
}
