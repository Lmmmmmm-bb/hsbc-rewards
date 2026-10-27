import { describe, expect, it, vi } from 'vitest'
import { loadDemoSession } from '@/application/session/actions'
import { deriveWorkspace } from '@/application/session/selectors'
import { createMemorySession } from './memory-session'

describe('isolated memory sessions', () => {
  it('starts empty and does not share another session’s imported business data', () => {
    const a = createMemorySession(),
      b = createMemorySession()
    loadDemoSession(a)
    expect(a.getSnapshot().mode).toBe('demo')
    expect(b.getSnapshot().dataset.transactions).toHaveLength(0)
    expect(b.getSnapshot().fx.hkdToCnyPpm).toBeNull()
  })
  it('publishes new snapshots and supports listener cleanup', () => {
    const store = createMemorySession(),
      listener = vi.fn(),
      before = store.getSnapshot()
    const unsubscribe = store.subscribe(listener)
    loadDemoSession(store)
    expect(before.dataset.transactions).toHaveLength(0)
    expect(store.getSnapshot().revision).toBe(1)
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    store.clear()
    expect(listener).toHaveBeenCalledTimes(1)
  })
  it('clears the dataset and the demonstration quote together', () => {
    const store = createMemorySession()
    loadDemoSession(store)
    store.clear()
    expect(store.getSnapshot()).toMatchObject({
      mode: 'empty',
      dataset: { cards: [], statements: [], transactions: [] },
      fx: { hkdToCnyPpm: null },
    })
  })
  it('derives verified balances and rewards from the same synthetic dataset', () => {
    const store = createMemorySession()
    loadDemoSession(store)
    const view = deriveWorkspace(store.getSnapshot())
    expect(view).toMatchObject({
      expenseCount: 7,
      spendCnyMinor: 300000,
      spendHkdMinor: 100000,
      mismatchCount: 1,
      reviewCount: 1,
      totalRewardMicroRc: 110000000,
    })
    expect(
      view.rewards.pools.find((pool) => pool.ownerId === 'demo-main' && pool.tier === 'abroad')
        ?.usedMinor,
    ).toBe(343333)
  })
})
