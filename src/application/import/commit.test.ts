import { describe, expect, it, vi } from 'vitest'
import type { Dataset } from '@/domain/model/types'
import { importedFile as file } from '@/tests/fixtures/imported-file'
import { createMemorySession } from '@/store/memory-session'
import { commitImportedBatch } from './commit'

const empty: Dataset = { cards: [], statements: [], transactions: [] }

describe('atomic batch publication', () => {
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
