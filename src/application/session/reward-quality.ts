import type { Dataset, Statement, Transaction } from '@/domain/model/types'
import type { calculateRewards } from '@/domain/rewards/calculate'
import type { AccountReconciliation } from '@/domain/reconciliation/reconcile'

type RewardResult = ReturnType<typeof calculateRewards>

export interface StatementReport {
  readonly statement: Statement
  readonly accounts: readonly AccountReconciliation[]
}

function summarize(
  rows: readonly Transaction[],
  accounts: readonly AccountReconciliation[],
  rewards: RewardResult,
) {
  const warningCount = (code: string) =>
    rows.filter((row) => row.warnings.some((warning) => warning.code === code))
      .length

  return {
    matchedAccounts: accounts.filter((account) => account.status === 'matched')
      .length,
    mismatchAccounts: accounts.filter(
      (account) => account.status === 'mismatch',
    ).length,
    unverifiedAccounts: accounts.filter(
      (account) => account.status === 'unverified',
    ).length,
    possibleDuplicateCount: warningCount('transaction.possible-duplicate'),
    referenceConflictCount: warningCount('transaction.reference-conflict'),
    excludedCount: rows.filter(
      (row) =>
        rewards.byTransaction
          .get(row.id)
          ?.tiers.find((tier) => tier.tier === 'basic')?.eligibleMinor === 0,
    ).length,
    uncertainEligibilityCount: rows.filter((row) => {
      const result = rewards.byTransaction.get(row.id)!

      return (
        result.tiers.some((tier) =>
          tier.reasonCodes.some((code) =>
            ['region.unknown', 'currency.original-unknown'].includes(code),
          ),
        ) ||
        row.warnings.some((warning) => warning.code === 'date.outside-period')
      )
    }).length,
  }
}

/** Counts transactions once, regardless of continuation rows or the number of affected reward tiers. */
export function deriveRewardQuality(
  dataset: Dataset,
  rewards: RewardResult,
  reports: readonly StatementReport[],
) {
  return {
    total: summarize(
      dataset.transactions,
      reports.flatMap((report) => report.accounts),
      rewards,
    ),
    byCard: new Map(
      dataset.cards.map((card) => {
        const rows = dataset.transactions.filter(
          (row) => row.cardId === card.id,
        )
        const sourceIds = new Set([
          ...(card.statementIds ?? []),
          ...rows.flatMap((row) =>
            row.sources.map((source) => source.statementId),
          ),
        ])
        const accountIds = new Set([
          ...(card.accountIds ?? []),
          ...rows.map((row) => row.accountId),
        ])
        const accounts = reports
          .filter((report) => sourceIds.has(report.statement.id))
          .flatMap((report) =>
            report.accounts.filter((account) =>
              accountIds.has(account.accountId),
            ),
          )

        return [card.id, summarize(rows, accounts, rewards)]
      }),
    ),
  }
}
