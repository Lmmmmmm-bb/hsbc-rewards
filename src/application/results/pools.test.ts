import { describe, expect, it } from 'vitest'
import type { SessionState } from '../session/types'
import { deriveWorkspace } from '../session/selectors'
import { statement, testCard, transaction } from '@/tests/fixtures/dataset'
import { selectResultScope } from './scope'
import { selectResultPools } from './pools'

function session(dataset: SessionState['dataset']): SessionState {
  return {
    dataset,
    revision: 1,
    mode: 'demo',
    fx: { source: 'demo', stale: false, hkdToCnyPpm: 900000 },
  }
}

describe('spending cap presentation', () => {
  it('deduplicates shared pools while retaining the half-year cumulative cutoff', () => {
    const pool = {
      id: 'confirmed-shared',
      evidence: 'statement-account' as const,
    }
    const state = session({
      cards: [
        { ...testCard, pool },
        { ...testCard, id: 'additional', pool },
      ],
      statements: [
        statement({
          date: '2026-07-20',
          period: { from: '2026-06-21', to: '2026-07-20' },
        }),
      ],
      transactions: [
        transaction({
          id: 'june',
          transactionDate: '2026-06-30',
          account: { currency: 'HKD', minor: 9_000_000 },
          original: { currency: 'MOP', minor: 9_000_000 },
        }),
        transaction({
          id: 'july',
          cardId: 'additional',
          transactionDate: '2026-07-01',
          account: { currency: 'HKD', minor: 3_000_000 },
          original: { currency: 'MOP', minor: 3_000_000 },
        }),
      ],
    })
    const view = deriveWorkspace(state)
    const first = selectResultPools(
      state,
      selectResultScope(state, view, { periodId: '2026-H1' }),
    )
    const second = selectResultPools(
      state,
      selectResultScope(state, view, { periodId: '2026-H2' }),
    )
    expect(first.filter((item) => item.tier === 'abroad')).toHaveLength(1)
    expect(second.filter((item) => item.tier === 'abroad')).toHaveLength(1)
    expect(first.find((item) => item.tier === 'abroad')).toMatchObject({
      usedMinor: 9_000_000,
      asOf: '2026-06-30',
      observedThrough: '2026-06-30',
      shared: true,
    })
    expect(second.find((item) => item.tier === 'abroad')).toMatchObject({
      usedMinor: 10_000_000,
      asOf: '2026-12-31',
      observedFrom: '2026-06-30',
      observedThrough: '2026-07-01',
    })
    expect(second[0].relatedCards).toHaveLength(2)
  })
  it('reports FX provenance per component instead of spreading a transaction-wide assumption', () => {
    const state = session({
      cards: [testCard],
      statements: [statement()],
      transactions: [transaction()],
    })
    const pools = selectResultPools(
      state,
      selectResultScope(state, deriveWorkspace(state)),
    )
    expect(pools.find((pool) => pool.tier === 'abroad')?.referenceFx).toBe(true)
    expect(pools.find((pool) => pool.tier === 'pulse')?.referenceFx).toBe(false)
    const missing: SessionState = {
      ...state,
      fx: { source: 'unavailable', stale: false, hkdToCnyPpm: null },
    }
    const pending = selectResultPools(
      missing,
      selectResultScope(missing, deriveWorkspace(missing)),
    )
    expect(pending.find((pool) => pool.tier === 'abroad')).toMatchObject({
      usedMinor: null,
      remainingMinor: null,
      referenceFx: true,
    })
    expect(pending.find((pool) => pool.tier === 'pulse')).toMatchObject({
      usedMinor: 25_000,
      referenceFx: false,
    })
  })
})
