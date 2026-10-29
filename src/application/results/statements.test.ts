import { expect, it } from 'vitest'
import { statement, testCard, transaction } from '@/tests/fixtures/dataset'
import { deriveWorkspace } from '../session/selectors'
import type { SessionState } from '../session/types'
import { selectResultScope } from './scope'
import { statementSummaries } from './statements'

function scopeWithClosing(hkdClosing: number | null) {
  const state: SessionState = {
    dataset: {
      cards: [testCard],
      statements: [
        statement({
          accounts: [
            ...statement().accounts,
            {
              id: 'account-hkd',
              currency: 'HKD',
              openingMinor: 0,
              closingMinor: hkdClosing,
            },
          ],
        }),
      ],
      transactions: [transaction()],
    },
    revision: 1,
    mode: 'demo',
    fx: { source: 'demo', stale: false, hkdToCnyPpm: 900000 },
  }
  return selectResultScope(state, deriveWorkspace(state))
}

it('does not label a mixed matched and unverified statement as matched', () => {
  const scope = scopeWithClosing(null)
  const [summary] = statementSummaries(scope)
  expect(summary.currencies).toEqual(['CNY', 'HKD'])
  expect(summary.status).toBe('unverified')
  expect(statementSummaries(scope, 'unverified')).toHaveLength(1)
  expect(statementSummaries(scope, 'mismatch')).toEqual([])
})

it('prioritizes a mismatch and derives status only from scoped accounts', () => {
  const scope = scopeWithClosing(100)
  expect(statementSummaries(scope)[0].status).toBe('mismatch')
  expect(statementSummaries(scope, 'mismatch')).toHaveLength(1)
  const scoped = {
    ...scope,
    reconciliations: scope.reconciliations.filter(
      ({ account }) => account.currency === 'CNY',
    ),
  }
  expect(statementSummaries(scoped)[0]).toMatchObject({
    status: 'matched',
    currencies: ['CNY'],
  })
  expect(statementSummaries(scoped, 'mismatch')).toEqual([])
})
