import type { Dataset, Transaction } from '@/domain/model/types'
import type { calculateRewards, RewardPool } from '@/domain/rewards/calculate'
import { summarizeCardRewards } from '@/domain/rewards/summarize'
import { rewardPeriod } from '@/domain/normalization/dates'
import type { StatementReport } from './reward-quality'
import { deriveRewardCardViews } from './reward-card-views'
import { deriveRewardTotals } from './reward-totals'

/** Group globally calculated awards. Annual caps and unrounded RC are never reset at a display boundary. */
export function deriveRewardPeriods(
  dataset: Dataset,
  rewards: ReturnType<typeof calculateRewards>,
  reports: readonly StatementReport[],
  rate: number | null,
) {
  const rowGroups = new Map<string, Transaction[]>()
  const sourceIds = new Set(
    dataset.transactions.flatMap((row) =>
      row.sources.map((source) => source.statementId),
    ),
  )
  for (const row of dataset.transactions) {
    const key = rewardPeriod(row.transactionDate, 'half-year')
    if (!rowGroups.has(key)) rowGroups.set(key, [])
    rowGroups.get(key)!.push(row)
  }

  const emptySources = dataset.statements.filter(
    (statement) => !sourceIds.has(statement.id),
  )
  const emptyCards = dataset.cards.filter(
    (card) => !dataset.transactions.some((row) => row.cardId === card.id),
  )
  const fallbackSources = dataset.statements.filter(
    (statement) =>
      emptySources.includes(statement) ||
      emptyCards.some((card) => card.statementIds?.includes(statement.id)),
  )
  for (const statement of fallbackSources) {
    const key = rewardPeriod(statement.date, 'half-year')
    if (!rowGroups.has(key)) rowGroups.set(key, [])
  }

  const poolStates = new Map<string, RewardPool>()
  const byId = new Map(dataset.transactions.map((row) => [row.id, row]))
  let position = 0

  return [...rowGroups.keys()]
    .sort()
    .map((id) => {
      const year = Number(id.slice(0, 4)),
        half = Number(id.slice(-1)) as 1 | 2
      const from = `${year}-${half === 1 ? '01-01' : '07-01'}`,
        to = `${year}-${half === 1 ? '06-30' : '12-31'}`
      const rows = rowGroups.get(id)!
      while (
        position < rewards.transactions.length &&
        byId.get(rewards.transactions[position].transactionId)!
          .transactionDate <= to
      ) {
        for (const tier of rewards.transactions[position++].tiers)
          if (tier.poolAfter) poolStates.set(tier.poolAfter.key, tier.poolAfter)
      }

      const fallbackIds = new Set(
        fallbackSources
          .filter(
            (statement) => rewardPeriod(statement.date, 'half-year') === id,
          )
          .map((statement) => statement.id),
      )
      const periodSources = new Set([
        ...rows.flatMap((row) =>
          row.sources.map((source) => source.statementId),
        ),
        ...fallbackIds,
      ])
      const scoped: Dataset = {
        transactions: rows,
        statements: dataset.statements.filter((statement) =>
          periodSources.has(statement.id),
        ),
        cards: dataset.cards.filter(
          (card) =>
            rows.some((row) => row.cardId === card.id) ||
            ((emptyCards.includes(card) ||
              emptySources.some(
                (statement) =>
                  rewardPeriod(statement.date, 'half-year') === id &&
                  card.statementIds?.includes(statement.id),
              )) &&
              card.statementIds?.some((source) => fallbackIds.has(source))),
        ),
      }
      const results = rows.map((row) => rewards.byTransaction.get(row.id)!)
      const scopedRewards = {
        ...rewards,
        transactions: results,
        cards: summarizeCardRewards(results, scoped.cards),
        pools: [...poolStates.values()].filter((pool) =>
          pool.tier === 'abroad'
            ? pool.period === String(year)
            : pool.period === id,
        ),
      }

      return {
        id,
        year,
        half,
        from,
        to,
        sourceIds: [...periodSources],
        statementCount: scoped.statements.length,
        cardCount: scoped.cards.length,
        expenseCount: rows.filter(
          (row) =>
            row.classification.kind === 'purchase' && row.account.minor > 0,
        ).length,
        ...deriveRewardTotals(results, rate),
        ...deriveRewardCardViews(
          scoped,
          scopedRewards,
          reports.filter((report) => periodSources.has(report.statement.id)),
          rate,
        ),
      }
    })
    .reverse()
}
