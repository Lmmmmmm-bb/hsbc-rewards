import { describe, expect, it } from 'vitest'
import { isIsoDate, resolveDateToken, rewardPeriod } from './dates'

describe('statement dates', () => {
  it('infers the preceding December in a January statement', () => {
    const result = resolveDateToken('31 DEC', { from: '2025-12-21', to: '2026-01-20' })

    expect(result.date).toBe('2025-12-31')
    expect(result.warningCodes).toContain('date.cross-year-inferred')
  })

  it('does not silently roll invalid calendar dates', () => {
    expect(isIsoDate('2026-02-29')).toBe(false)
    expect(isIsoDate('2024-02-29')).toBe(true)
    expect(() => resolveDateToken('31 FEB', { from: '2026-02-01', to: '2026-02-28' })).toThrow()
  })

  it('flags a transaction outside the statement interval', () => {
    const result = resolveDateToken('15/09', { from: '2026-09-21', to: '2026-10-20' })

    expect(result.date).toBe('2026-09-15')
    expect(result.confidence).toBeLessThan(.8)
  })

  it('separates June, July and historical years by transaction date', () => {
    expect(rewardPeriod('2025-06-30', 'half-year')).toBe('2025-H1')
    expect(rewardPeriod('2025-07-01', 'half-year')).toBe('2025-H2')
    expect(rewardPeriod('2024-12-31', 'year')).toBe('2024')
  })
})
