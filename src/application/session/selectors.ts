import { addMinor, microRcToCnyMinor } from '@/domain/money/money'
import { reconcileStatement } from '@/domain/reconciliation/reconcile'
import { calculateRewards } from '@/domain/rewards/calculate'
import { LATEST_RULES } from '@/domain/rewards/rules'
import type { SessionState } from './types'
import { deriveRewardDetails } from './reward-details'
import { deriveRewardQuality } from './reward-quality'
import { deriveRewardPoolViews } from './reward-pools'

export function deriveWorkspace(session: SessionState) {
  const { dataset } = session
  const reports = dataset.statements.map((statement) => ({
    statement,
    accounts: reconcileStatement(statement, dataset.transactions),
  }))
  const expenses = dataset.transactions.filter(
    (t) => t.classification.kind === 'purchase' && t.account.minor > 0,
  )
  const rewardResult = calculateRewards(dataset.transactions, dataset.cards, {
    hkdToCnyPpm: session.fx.hkdToCnyPpm,
  })
  const totalRewardMicroRc = rewardResult.cards.some(
    (card) => card.totalMicroRc === null,
  )
    ? null
    : addMinor(rewardResult.cards.map((card) => card.totalMicroRc ?? 0))
  const details = deriveRewardDetails(dataset, rewardResult)
  const quality = deriveRewardQuality(dataset, rewardResult, reports)
  const poolViews = deriveRewardPoolViews(dataset, rewardResult)
  return {
    reports,
    rewards: rewardResult,
    rules: LATEST_RULES,
    quality: quality.total,
    coverage: details.coverage,
    periodInferred: dataset.statements.some((statement) =>
      statement.warnings.some(
        (warning) => warning.code === 'statement.period-inferred',
      ),
    ),
    tierTotals: (['basic', 'abroad', 'pulse'] as const).map((tier) => {
      const amounts = rewardResult.cards.map((card) => card[`${tier}MicroRc`])
      return {
        tier,
        knownMicroRc: addMinor(
          rewardResult.transactions.map(
            (result) =>
              result.tiers.find((item) => item.tier === tier)?.microRc ?? 0,
          ),
        ),
        microRc: amounts.some((amount) => amount === null)
          ? null
          : addMinor(amounts.map((amount) => amount ?? 0)),
      }
    }),
    rewardCards: rewardResult.cards.map((result) => ({
      ...result,
      ...details.cards.find((card) => card.cardId === result.cardId)!,
      card: dataset.cards.find((card) => card.id === result.cardId)!,
      quality: quality.byCard.get(result.cardId)!,
      cnyMinor:
        result.totalMicroRc === null
          ? null
          : microRcToCnyMinor(result.totalMicroRc, session.fx.hkdToCnyPpm),
      pools: poolViews.get(result.cardId) ?? [],
    })),
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
    totalRewardMicroRc,
    knownRewardMicroRc: addMinor(
      rewardResult.cards.map((card) => card.knownMicroRc),
    ),
    totalRewardCnyMinor:
      totalRewardMicroRc === null
        ? null
        : microRcToCnyMinor(totalRewardMicroRc, session.fx.hkdToCnyPpm),
  }
}

export type WorkspaceView = ReturnType<typeof deriveWorkspace>
