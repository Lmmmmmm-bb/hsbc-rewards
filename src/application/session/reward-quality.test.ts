import { describe, expect, it } from 'vitest'
import type { Dataset } from '@/domain/model/types'
import { statement, testCard, transaction } from '@/tests/fixtures/dataset'
import { rewardContext } from '@/tests/helpers/rewards'
import { createDemoDataset } from '@/application/demo/dataset'
import { deduplicateTransactions } from '@/domain/normalization/deduplicate'
import { deriveRewardQuality } from './reward-quality'

function inspect(dataset: Dataset, rate: number | null = 900000) {
  const { rewards, reports } = rewardContext(dataset, rate)
  return { quality: deriveRewardQuality(dataset, rewards, reports) }
}

describe('reward quality aggregates', () => {
  it('separates injected balance mismatch, missing eligibility evidence and excluded payments', () => {
    const demo = createDemoDataset()
    const dataset: Dataset = {
      ...demo,
      statements: demo.statements.map((source) => source.id === 'demo-main-2026-10'
        ? { ...source, accounts: source.accounts.map((account) => account.currency === 'CNY'
          ? { ...account, closingMinor: account.closingMinor! + 3000 } : account) }
        : source),
      transactions: demo.transactions.map((row) => row.id === 'demo-additional-2026-10-1'
        ? { ...row, classification: { ...row.classification, region: null } } : row),
    }
    const { quality } = inspect(dataset)

    expect(quality.total).toMatchObject({
      matchedAccounts: 11,
      mismatchAccounts: 1,
      unverifiedAccounts: 0,
      excludedCount: 11,
      uncertainEligibilityCount: 1,
      possibleDuplicateCount: 0,
    })
    expect(quality.byCard.get('demo-main')).toMatchObject({
      matchedAccounts: 5,
      mismatchAccounts: 1,
      excludedCount: 8,
      uncertainEligibilityCount: 0,
    })
    expect(quality.byCard.get('demo-additional')).toMatchObject({
      matchedAccounts: 6,
      excludedCount: 3,
      uncertainEligibilityCount: 1,
    })
  })

  it('does not count a shared source-account reconciliation twice in global quality', () => {
    const pool = { id: 'shared', evidence: 'statement-account' as const }
    const cards = [
      {
        ...testCard,
        pool,
        statementIds: ['statement-a'],
        accountIds: ['account-cny'],
      },
      {
        ...testCard,
        id: 'second-card',
        pool,
        statementIds: ['statement-a'],
        accountIds: ['account-cny'],
      },
    ]
    const dataset: Dataset = {
      cards,
      statements: [
        statement({
          accounts: [
            {
              id: 'account-cny',
              currency: 'CNY',
              openingMinor: 0,
              closingMinor: 50000,
            },
          ],
        }),
      ],
      transactions: [
        transaction(),
        transaction({ id: 'second-row', cardId: 'second-card' }),
      ],
    }
    const { quality } = inspect(dataset)

    expect(quality.total.matchedAccounts).toBe(1)
    expect(quality.byCard.get(testCard.id)?.matchedAccounts).toBe(1)
    expect(quality.byCard.get('second-card')?.matchedAccounts).toBe(1)
  })

  it('keeps a missing opening balance unverified rather than matched to an invented zero', () => {
    const dataset: Dataset = {
      cards: [testCard],
      transactions: [transaction()],
      statements: [
        statement({
          accounts: [
            {
              id: 'account-cny',
              currency: 'CNY',
              openingMinor: null,
              closingMinor: 25000,
            },
          ],
        }),
      ],
    }

    expect(inspect(dataset).quality.total).toMatchObject({
      matchedAccounts: 0,
      mismatchAccounts: 0,
      unverifiedAccounts: 1,
    })
  })

  it('counts suspicious transactions once despite multiple provenance rows and affected tiers', () => {
    const row = transaction({
      sources: [
        ...transaction().sources,
        { ...transaction().sources[0], row: 2 },
      ],
    })
    const transactions = deduplicateTransactions([
      row,
      { ...row, id: 'second-row', sources: row.sources.map(source => ({ ...source, statementId: 'statement-b', fileHash: 'synthetic-b' })) },
    ]).transactions
    const { quality } = inspect(
      { cards: [testCard], statements: [statement(), statement({ id: 'statement-b', fileHash: 'synthetic-b' })], transactions },
      null,
    )

    expect(quality.total.possibleDuplicateCount).toBe(2)
    expect(quality.total.uncertainEligibilityCount).toBe(0)
  })
})
