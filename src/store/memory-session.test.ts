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
      expenseCount: 26,
      spendCnyMinor: 10203000,
      spendHkdMinor: 1399000,
      mismatchCount: 1,
      reviewCount: 1,
      totalRewardMicroRc: 4335280060,
    })
    expect(
      view.rewards.pools.find((pool) => pool.ownerId === 'demo-main' && pool.tier === 'abroad' && pool.period === '2026')
        ?.usedMinor,
    ).toBe(10000000)
    expect(view.periods.map((period) => period.id)).toEqual(['2026-H2', '2026-H1', '2025-H2'])
    expect(view.periods.reduce((total, period) => total + period.totalRewardMicroRc!, 0))
      .toBe(view.totalRewardMicroRc)

    const mainInHalf = (id: string) => view.periods.find((period) => period.id === id)!
      .rewardCards.find((card) => card.card.id === 'demo-main')!

    expect(mainInHalf('2026-H1').pools.find((pool) => pool.tier === 'pulse'))
      .toMatchObject({ usedMinor: 8000000, remainingMinor: 0 })
    expect(mainInHalf('2026-H2').pools.find((pool) => pool.tier === 'pulse'))
      .toMatchObject({ usedMinor: 110000, remainingMinor: 7890000 })
    expect(mainInHalf('2026-H2').abroadMicroRc).toBe(0)
  })
})
