import { addMinor } from '@/domain/money/money'
import { reconcileStatement } from '@/domain/reconciliation/reconcile'
import { calculateRewards } from '@/domain/rewards/calculate'
import { LATEST_RULES } from '@/domain/rewards/rules'
import type { SessionState } from './types'
import type { Dataset } from '@/domain/model/types'
import { deriveRewardCardViews } from './reward-card-views'
import { deriveRewardTotals } from './reward-totals'
import { deriveRewardPeriods } from './reward-periods'

function computeWorkspace(dataset: Dataset, hkdToCnyPpm: number | null) {
  const reports = dataset.statements.map((statement) => ({
    statement,
    accounts: reconcileStatement(statement, dataset.transactions),
  }))
  const expenses = dataset.transactions.filter(
    (t) => t.classification.kind === 'purchase' && t.account.minor > 0,
  )
  const rewardResult = calculateRewards(dataset.transactions, dataset.cards, {
    hkdToCnyPpm,
  })
  return {
    reports,
    rewards: rewardResult,
    rules: LATEST_RULES,
    ...deriveRewardCardViews(dataset, rewardResult, reports, hkdToCnyPpm),
    ...deriveRewardTotals(rewardResult.transactions, hkdToCnyPpm),
    periods: deriveRewardPeriods(dataset, rewardResult, reports, hkdToCnyPpm),
    periodInferred: dataset.statements.some((statement) =>
      statement.warnings.some(
        (warning) => warning.code === 'statement.period-inferred',
      ),
    ),
    expenseCount: expenses.length,
    spendCnyMinor: addMinor(
      expenses
        .filter((t) => t.account.currency === 'CNY')
        .map((t) => t.account.minor),
    ),
    spendHkdMinor: addMinor(
      expenses
        .filter((t) => t.account.currency === 'HKD')
        .map((t) => t.account.minor),
    ),
    mismatchCount: reports.filter((report) =>
      report.accounts.some((account) => account.status === 'mismatch'),
    ).length,
    reviewCount: dataset.transactions.filter((t) => t.confidence < 0.85).length,
  }
}

export type WorkspaceView = ReturnType<typeof computeWorkspace>
const cache = new WeakMap<
  Dataset,
  { rate: number | null; view: WorkspaceView }
>()

/** Dataset inputs are immutable. Reuse the preflight result instead of calculating it again during publication. */
export function deriveWorkspace(session: SessionState): WorkspaceView {
  const rate = session.fx.hkdToCnyPpm
  const previous = cache.get(session.dataset)
  if (previous && previous.rate === rate) return previous.view
  const view = computeWorkspace(session.dataset, rate)
  cache.set(session.dataset, { rate, view })
  return view
}
