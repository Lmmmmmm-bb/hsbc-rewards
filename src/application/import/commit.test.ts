import { describe, expect, it, vi } from 'vitest'
import type { Dataset } from '@/domain/model/types'
import { importedFile as file } from '@/tests/fixtures/imported-file'
import { createMemorySession } from '@/store/memory-session'
import { commitImportedBatch, reviewImportedCards } from './commit'
import { parsePulseStatement } from '@/domain/parsing/pulse/parse'
import { pulseFile, pulseIdentity, pulsePage } from '@/tests/fixtures/pulse-statement'

const empty: Dataset = { cards: [], statements: [], transactions: [] }

describe('atomic batch publication', () => {
  it('reviews actual cards after linking dual-currency accounts, without merging matching last four digits', () => {
    const store = createMemorySession()
    const linked = parsePulseStatement([
      pulsePage({ currency: 'HKD' }), pulsePage({ page: 2, currency: 'CNY' }),
    ], pulseFile, pulseIdentity())
    expect(linked.cards).toHaveLength(1)
    expect(linked.cards[0].accountIds).toHaveLength(2)
    const review = reviewImportedCards(store, [linked], store.getSnapshot().revision)
    expect(review).toEqual([{ cardId: linked.cards[0].id, lastFour: linked.cards[0].lastFour, role: 'primary' }])
    const other = file('other', undefined, { id: 'different-card', lastFour: linked.cards[0].lastFour, role: 'unknown' })
    const multiple = reviewImportedCards(store, [linked, other], store.getSnapshot().revision)
    expect(multiple).toHaveLength(2)
    expect(multiple.map(card => card.role)).toEqual([null, null])
    expect(store.getSnapshot().mode).toBe('empty')
  })

  it('retains user-confirmed roles across conflicting later statements without creating a shared pool', () => {
    const store = createMemorySession()
    const first = file('first', undefined, { role: 'unknown' })
    const review = reviewImportedCards(store, [first], store.getSnapshot().revision)
    commitImportedBatch(store, [first], store.getSnapshot().revision, review.map(card => ({ ...card, role: 'additional' })))
    const next = file('next', '2026-11-20', { role: 'primary' })
    expect(reviewImportedCards(store, [next], store.getSnapshot().revision)[0].role).toBe('additional')
    commitImportedBatch(store, [next], store.getSnapshot().revision)
    expect(store.getSnapshot().dataset.cards[0]).toMatchObject({ role: 'additional', roleSource: 'user' })
    expect(store.getSnapshot().dataset.cards[0].pool).toBeUndefined()
    expect(store.getSnapshot().dataset.cards[0].warnings).not.toContainEqual({ code: 'card.role-conflict' })
  })

  it('rejects stale or incomplete role choices before changing results', () => {
    const store = createMemorySession()
    const files = [file('first'), file('second', undefined, { id: 'card-b' })]
    const review = reviewImportedCards(store, files, store.getSnapshot().revision)
    const before = store.getSnapshot()
    for (const roles of [review.slice(1), [review[0], review[0]], [...review.slice(1), { ...review[0], cardId: 'stale-card' }], review.map(card => ({ ...card, role: null }))]) {
      expect(() => commitImportedBatch(store, files, before.revision, roles)).toThrow('import.invalid-card-roles')
      expect(store.getSnapshot()).toBe(before)
    }
    store.clear()
    expect(() => commitImportedBatch(store, files, before.revision, review)).toThrow('import.session-changed')
  })

  it('rejects a combined reward overflow before publishing and preserves the prior computable session', () => {
    const localFile = (id: string): Dataset => {
      const input = file(id)
      const amount = 120000000000000

      return {
        ...input,
        statements: input.statements.map((statement) => ({
          ...statement,
          accounts: statement.accounts.map((account) => ({
            ...account,
            currency: 'HKD',
            closingMinor: amount,
          })),
        })),
        transactions: input.transactions.map((row) => ({
          ...row,
          original: { currency: 'HKD', minor: amount },
          account: { currency: 'HKD', minor: amount },
          classification: { ...row.classification, region: 'HK' },
        })),
      }
    }

    const store = createMemorySession()
    commitImportedBatch(store, [localFile('a')], store.getSnapshot().revision)
    const previous = store.getSnapshot()

    expect(() =>
      commitImportedBatch(store, [localFile('b')], previous.revision),
    ).toThrow('money.out-of-range')
    expect(store.getSnapshot()).toBe(previous)
  })

  it('publishes a completed batch once, replacing demonstration FX without retaining its example rate', () => {
    const store = createMemorySession(),
      changed = vi.fn()
    store.replace(empty, 'demo', {
      source: 'demo',
      hkdToCnyPpm: 900000,
      stale: false,
    })
    store.subscribe(changed)
    const outcome = commitImportedBatch(
      store,
      [file(), file('b')],
      store.getSnapshot().revision,
    )

    expect(outcome).toEqual({ files: 2, transactions: 2 })
    expect(changed).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot().mode).toBe('real')
    expect(store.getSnapshot().fx.hkdToCnyPpm).toBeNull()
  })

  it('preserves prior data on revision changes, source conflicts and repeat-only batches', () => {
    const store = createMemorySession()
    store.replace(file(), 'real')
    const snapshot = store.getSnapshot(),
      changed = vi.fn()
    store.subscribe(changed)

    expect(() =>
      commitImportedBatch(store, [file('b')], snapshot.revision - 1),
    ).toThrow('import.session-changed')

    const invalid = file('b')

    expect(() =>
      commitImportedBatch(
        store,
        [
          {
            ...invalid,
            transactions: [{ ...invalid.transactions[0], sources: [] }],
          },
        ],
        snapshot.revision,
      ),
    ).toThrow('import.invalid-source-association')
    expect(store.getSnapshot()).toBe(snapshot)

    const foreignAccount = {
      ...invalid,
      statements: [
        {
          ...invalid.statements[0],
          accounts: [
            {
              id: 'unrelated-account',
              currency: 'CNY' as const,
              openingMinor: 0,
              closingMinor: 0,
            },
          ],
        },
      ],
    }

    expect(() =>
      commitImportedBatch(store, [foreignAccount], snapshot.revision),
    ).toThrow('import.invalid-source-association')
    expect(store.getSnapshot()).toBe(snapshot)
    expect(changed).not.toHaveBeenCalled()
    expect(commitImportedBatch(store, [file()], snapshot.revision)).toEqual({
      files: 0,
      transactions: 0,
    })
    expect(changed).not.toHaveBeenCalled()
  })
})
