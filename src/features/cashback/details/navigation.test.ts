import { describe, expect, it } from 'vitest'
import type { SessionState } from '@/application/session/types'
import { createDemoDataset } from '@/application/demo/dataset'
import { initialNavigation, synchronizeNavigation } from './navigation'

describe('detail result changes', () => {
  const session: SessionState = {
    dataset: createDemoDataset(),
    revision: 1,
    mode: 'demo',
    fx: { source: 'demo', stale: false, hkdToCnyPpm: 900000 },
  }
  it('retains filters and selections while resetting pages on data changes', () => {
    const state = {
      ...initialNavigation(
        { tab: 'transactions', component: 'pulse', flags: ['capped'] },
        session,
      ),
      page: 2,
      transactionId: 'selected',
    }
    expect(synchronizeNavigation(state, session)).toBe(state)
    const updated = synchronizeNavigation(state, {
      ...session,
      dataset: { ...session.dataset },
    })
    expect(updated).toMatchObject({
      page: 0,
      transactionId: 'selected',
      updated: true,
      filter: { component: 'pulse', flags: ['capped'] },
    })
  })
  it('treats quote provenance as a result change without changing the numeric rate', () => {
    const state = {
      ...initialNavigation({ tab: 'calculation' }, session),
      page: 2,
    }
    const updated = synchronizeNavigation(state, {
      ...session,
      fx: {
        source: 'cache',
        hkdToCnyPpm: 900000,
        stale: false,
        rateDate: '2026-10-28',
        retrievedAt: 1,
      },
    })
    expect(updated.page).toBe(0)
    expect(updated.updated).toBe(true)
  })
})
