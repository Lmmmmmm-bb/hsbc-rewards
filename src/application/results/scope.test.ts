import { describe, expect, it } from 'vitest'
import { createDemoDataset } from '../demo/dataset'
import { deriveWorkspace } from '../session/selectors'
import type { SessionState } from '../session/types'
import { statement, testCard, transaction } from '@/tests/fixtures/dataset'
import { selectResultScope } from './scope'
import { cardAssumptions } from './assumptions'

const session = (dataset: SessionState['dataset']): SessionState => ({
  dataset,
  mode: 'demo',
  revision: 1,
  fx: { source: 'demo', stale: false, hkdToCnyPpm: 900000 },
})

describe('shared result selection', () => {
  it('uses the period source set while retaining full-source balance checks', () => {
    const state = session({
      cards: [testCard],
      statements: [
        statement({ date: '2026-07-20' }),
        statement({ id: 'unrelated', date: '2025-12-20' }),
      ],
      transactions: [
        transaction({ id: 'june', transactionDate: '2026-06-30' }),
        transaction({ id: 'july', transactionDate: '2026-07-01' }),
      ],
    })
    const view = deriveWorkspace(state)
    const scope = selectResultScope(state, view, { periodId: '2026-H1' })
    expect(scope.rows.map((row) => row.id)).toEqual(['june'])
    expect([...scope.sourceIds]).toEqual(['statement-a'])
    expect(scope.reconciliations[0].account.transactionIds).toEqual([
      'june',
      'july',
    ])
    expect(scope.mismatchStatementCount).toBe(1)
    expect(scope.rewards[0]).toBe(view.rewards.byTransaction.get('june'))
  })
  it('keeps independently recognized allocation when only registration is missing', () => {
    const state = session({
      cards: [{ ...testCard, abroadMultiplier: 3 }],
      statements: [statement()],
      transactions: [transaction()],
    })
    const view = deriveWorkspace(state)
    expect(cardAssumptions(view.rewardCards[0])).toContain('registration')
    expect(cardAssumptions(view.rewardCards[0])).not.toContain('multiplier')
    expect(
      view.rewardCards[0].tiers.find((tier) => tier.tier === 'abroad')
        ?.rateBasisPoints,
    ).toBe(120)
  })
  it('preserves the verified demo amounts and isolates quality by half-year', () => {
    const state = session(createDemoDataset())
    const view = deriveWorkspace(state)
    expect(selectResultScope(state, view).totals.totalRewardMicroRc).toBe(
      4_335_280_060,
    )
    expect(
      selectResultScope(state, view, { periodId: '2026-H1' })
        .mismatchStatementCount,
    ).toBe(0)
    expect(
      selectResultScope(state, view, { periodId: '2026-H2' })
        .mismatchStatementCount,
    ).toBe(1)
    expect(() =>
      selectResultScope(state, view, { periodId: '2020-H1' }),
    ).toThrow('period_not_found')
  })
})
