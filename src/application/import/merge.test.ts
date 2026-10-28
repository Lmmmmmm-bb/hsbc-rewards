import { describe, expect, it } from 'vitest'
import type { Dataset } from '@/domain/model/types'
import { importedFile as file } from '@/tests/fixtures/imported-file'
import { testCard } from '@/tests/fixtures/dataset'
import { mergeImportedDatasets } from './merge'

const empty: Dataset = { cards: [], statements: [], transactions: [] }

describe('statement dataset merge', () => {
  it('merges repeated card identities and unions source metadata without changing input objects', () => {
    const prior = file(),
      next = file('b', '2026-11-20')
    const before = JSON.stringify([prior, next])
    const dataset = mergeImportedDatasets(prior, [next])

    expect(dataset.cards).toHaveLength(1)
    expect(dataset.cards[0].statementIds).toEqual(['a', 'b'])
    expect(dataset.transactions).toHaveLength(2)
    expect(JSON.stringify([prior, next])).toBe(before)
  })

  it('uses statement date instead of arrival order for latest explicit allocation', () => {
    const old = file('a', '2026-09-20', { abroadMultiplier: 2 }),
      latest = file('b', '2026-10-20', { abroadMultiplier: 5 })

    expect(mergeImportedDatasets(empty, [latest, old])).toEqual(
      mergeImportedDatasets(empty, [old, latest]),
    )
    expect(mergeImportedDatasets(latest, [old]).cards[0].abroadMultiplier).toBe(
      5,
    )
  })

  it('does not combine cards or cap pools just because their suffixes match', () => {
    const dataset = mergeImportedDatasets(file(), [
      file('b', '2026-11-20', {
        id: 'different-card',
        lastFour: testCard.lastFour,
      }),
    ])

    expect(dataset.cards).toHaveLength(2)
    expect(dataset.cards.every((card) => !card.pool)).toBe(true)
  })

  it('skips an already imported file hash without duplicating transactions', () => {
    const prior = file(),
      duplicate = file('different-id')
    const copy = {
      ...duplicate,
      statements: [
        { ...duplicate.statements[0], fileHash: prior.statements[0].fileHash },
      ],
    }

    expect(mergeImportedDatasets(prior, [copy]).transactions).toHaveLength(1)
    expect(mergeImportedDatasets(prior, [copy]).statements).toHaveLength(1)
  })

  it('merges only proven bank references and preserves both source statements', () => {
    const first = file(),
      second = file('b')

    const proven = (dataset: Dataset) => ({
      ...dataset,
      transactions: [
        {
          ...dataset.transactions[0],
          bankReference: 'SYNTHETIC-BANK-REFERENCE',
        },
      ],
    })

    const dataset = mergeImportedDatasets(proven(first), [proven(second)])

    expect(dataset.transactions).toHaveLength(1)
    expect(
      dataset.transactions[0].sources.map((source) => source.statementId),
    ).toEqual(['a', 'b'])
  })

  it('keeps unproven lookalikes and does not accumulate duplicate warnings on later merges', () => {
    const dataset = mergeImportedDatasets(file(), [file('b')])

    expect(dataset.transactions).toHaveLength(2)
    expect(
      dataset.transactions.every((row) =>
        row.warnings.some(
          (warning) => warning.code === 'transaction.possible-duplicate',
        ),
      ),
    ).toBe(true)

    const repeated = mergeImportedDatasets(dataset, [])

    expect(repeated.transactions.map((row) => row.warnings)).toEqual(
      dataset.transactions.map((row) => row.warnings),
    )
  })

  it('drops contradictory shared-pool evidence and keeps that uncertainty on later imports', () => {
    const first = file('a', '2026-08-20', {
      pool: { id: 'one', evidence: 'statement-account' },
    })
    const second = file('b', '2026-09-20', {
      pool: { id: 'two', evidence: 'statement-account' },
    })
    const dataset = mergeImportedDatasets(first, [second])

    expect(dataset.cards[0].pool).toBeUndefined()
    expect(dataset.cards[0].warnings).toContainEqual({
      code: 'card.pool-conflict',
    })
    expect(
      mergeImportedDatasets(dataset, [
        file('c', '2026-10-20', {
          pool: { id: 'two', evidence: 'statement-account' },
        }),
      ]).cards[0].pool,
    ).toBeUndefined()
  })
})
