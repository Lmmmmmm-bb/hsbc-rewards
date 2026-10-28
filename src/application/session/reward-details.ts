import type { AccountCurrency, Dataset, Statement } from '@/domain/model/types'
import { addMinor } from '@/domain/money/money'
import type { calculateRewards, RewardTier } from '@/domain/rewards/calculate'
import { LATEST_RULES } from '@/domain/rewards/rules'

type RewardResult = ReturnType<typeof calculateRewards>

const tiers: readonly RewardTier[] = ['basic', 'abroad', 'pulse']
const currencies: readonly AccountCurrency[] = ['HKD', 'CNY']

function coverage(statements: readonly Statement[]) {
  if (statements.length === 0) return null
  return {
    from: statements.map((statement) => statement.period.from).sort()[0],
    to: statements
      .map((statement) => statement.period.to)
      .sort()
      .at(-1)!,
  }
}

/** Display aggregates consume the engine's clipped amounts; eligibility is never recalculated here. */
export function deriveRewardDetails(dataset: Dataset, rewards: RewardResult) {
  return {
    coverage: coverage(dataset.statements),
    cards: dataset.cards.map((card) => {
      const rows = dataset.transactions.filter((row) => row.cardId === card.id)
      const purchases = rows.filter(
        (row) =>
          row.classification.kind === 'purchase' && row.account.minor > 0,
      )
      const sourceIds = new Set([
        ...(card.statementIds ?? []),
        ...rows.flatMap((row) =>
          row.sources.map((source) => source.statementId),
        ),
      ])
      const statements = dataset.statements.filter((statement) =>
        sourceIds.has(statement.id),
      )
      const accounts = currencies.filter(
        (currency) =>
          rows.some((row) => row.account.currency === currency) ||
          statements.some((statement) =>
            statement.accounts.some(
              (account) =>
                card.accountIds?.includes(account.id) &&
                account.currency === currency,
            ),
          ),
      )
      const rewardRows = rows.map((row) => ({
        row,
        reward: rewards.byTransaction.get(row.id)!,
      }))

      return {
        cardId: card.id,
        transactionCount: rows.length,
        purchaseCount: purchases.length,
        statementCount: statements.length,
        coverage: coverage(statements),
        currencies: accounts,
        spend: accounts.map((currency) => ({
          currency,
          minor: addMinor(
            purchases
              .filter((row) => row.account.currency === currency)
              .map((row) => row.account.minor),
          ),
        })),
        tiers: tiers.map((tier) => {
          const entries = rewardRows.map(({ row, reward }) => ({
            currency: row.account.currency,
            result: reward.tiers.find((result) => result.tier === tier)!,
          }))
          const fallbackRate =
            tier === 'basic'
              ? LATEST_RULES.basicRateBasisPoints
              : tier === 'pulse'
                ? LATEST_RULES.pulse.rateBasisPoints
                : LATEST_RULES.basicRateBasisPoints *
                  (card.abroadMultiplier ??
                    LATEST_RULES.maximumAbroadMultiplier)

          return {
            tier,
            knownMicroRc: addMinor(
              entries.map((entry) => entry.result.microRc ?? 0),
            ),
            reasons: [
              ...new Set(entries.flatMap((entry) => entry.result.reasonCodes)),
            ]
              .sort()
              .map((code) => ({
                code,
                count: entries.filter((entry) =>
                  entry.result.reasonCodes.includes(code),
                ).length,
              })),
            rateBasisPoints: entries[0]?.result.rateBasisPoints ?? fallbackRate,
            eligibleSpend: accounts.map((currency) => {
              const amounts = entries
                .filter((entry) => entry.currency === currency)
                .map((entry) => entry.result.eligibleMinor)

              return {
                currency,
                minor: amounts.some((amount) => amount === null)
                  ? null
                  : addMinor(amounts.map((amount) => amount ?? 0)),
              }
            }),
          }
        }),
        assumptions: [
          ...new Set([
            ...rewardRows.flatMap(({ reward }) => reward.assumptions),
            ...statements.flatMap((statement) =>
              statement.warnings
                .filter((warning) => warning.code.startsWith('assumption.'))
                .map((warning) => warning.code),
            ),
            ...(card.warnings ?? []).map((warning) => warning.code),
          ]),
        ],
      }
    }),
  }
}
