import { describe, expect, it } from 'vitest'
import { deriveWorkspace } from '../session/selectors'
import type { SessionState } from '../session/types'
import { statement, testCard, transaction } from '@/tests/fixtures/dataset'
import { selectResultScope } from './scope'
import {
  componentExplanation,
  selectTransactions,
  transactionPage,
} from './transactions'
import { statementTransactions } from './statements'

function setup(rows: SessionState['dataset']['transactions']) {
  const session: SessionState = {
    dataset: {
      cards: [testCard],
      statements: [statement()],
      transactions: rows,
    },
    revision: 1,
    mode: 'demo',
    fx: { source: 'demo', stale: false, hkdToCnyPpm: 900000 },
  }
  const workspace = deriveWorkspace(session)
  return { session, workspace, scope: selectResultScope(session, workspace) }
}

describe('result detail queries', () => {
  it('matches a reason and flag within the same component', () => {
    const { scope } = setup([
      transaction({
        id: 'standard',
        classification: {
          ...transaction().classification,
          paymentMethod: 'standard',
        },
      }),
      transaction({ id: 'qr' }),
    ])
    expect(
      selectTransactions(scope, {
        component: 'pulse',
        reason: 'reward.payment-excluded',
      }).map(({ row }) => row.id),
    ).toEqual(['standard'])
    expect(
      selectTransactions(scope, { component: 'basic', flags: ['excluded'] }),
    ).toEqual([])
    expect(
      selectTransactions(scope, { component: 'pulse', flags: ['excluded'] })[0]
        .matchedComponents,
    ).toEqual(['pulse'])
  })
  it('pages stable engine order and clears out-of-range pages after narrowing', () => {
    const { scope } = setup(
      Array.from({ length: 25 }, (_, index) =>
        transaction({ id: `tx-${String(index).padStart(2, '0')}` }),
      ),
    )
    expect(transactionPage(scope, {}, null, 0).entries).toHaveLength(20)
    expect(transactionPage(scope, {}, null, 1).entries).toHaveLength(5)
    expect(
      transactionPage(
        scope,
        { component: 'basic', flags: ['excluded'] },
        null,
        1,
      ),
    ).toMatchObject({ count: 0, current: 0, pages: 1 })
    expect(transactionPage(scope, {}, 'removed-card', 0).count).toBe(0)
  })
  it('identifies both a partially capped transaction and later exhausted-cap transactions', () => {
    const { scope } = setup([
      transaction({
        id: 'crossing',
        account: { currency: 'CNY', minor: 9_000_000 },
      }),
      transaction({ id: 'after', transactionDate: '2026-10-20' }),
    ])
    const pulse = selectTransactions(scope).map(
      ({ reward }) => reward.tiers.find((tier) => tier.tier === 'pulse')!,
    )
    expect(componentExplanation(pulse[0])).toBe('partial')
    expect(pulse[0].microRc).toBeGreaterThan(0)
    expect(componentExplanation(pulse[1])).toBe('full')
    expect(pulse[1].microRc).toBe(0)
  })
  it('returns complete source transactions when inspecting a half-year source', () => {
    const { session, workspace } = setup([
      transaction({ id: 'june', transactionDate: '2026-06-30' }),
      transaction({ id: 'july', transactionDate: '2026-07-01' }),
    ])
    const scope = selectResultScope(session, workspace, { periodId: '2026-H1' })
    expect(scope.rows).toHaveLength(1)
    expect(
      statementTransactions(session, workspace, scope, 'statement-a').map(
        ({ row }) => row.id,
      ),
    ).toEqual(['june', 'july'])
  })
})
