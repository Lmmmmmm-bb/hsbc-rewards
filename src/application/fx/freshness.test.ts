import { describe, expect, it } from 'vitest'
import { fxDay, isDailyFx, isFxStale, msUntilNextFxDay } from './freshness'

describe('Hong Kong daily reference policy', () => {
  it('expires at Hong Kong midnight rather than 24 hours after fetching', () => {
    const before = Date.parse('2026-10-27T15:59:59Z'),
      after = before + 1000
    const quote = {
      retrievedAt: before,
      rateDate: '2026-10-26',
      hkdToCnyPpm: 850000,
    }
    expect(fxDay(before)).toBe('2026-10-27')
    expect(fxDay(after)).toBe('2026-10-28')
    expect(msUntilNextFxDay(before)).toBe(1000)
    expect(isDailyFx(quote, before)).toBe(true)
    expect(isDailyFx(quote, after)).toBe(false)
  })
  it('rejects a future retrieval time and marks an old publication even when fetched today', () => {
    const now = Date.parse('2026-10-27T10:00:00Z')
    expect(
      isDailyFx(
        {
          retrievedAt: now + 1000,
          rateDate: '2026-10-26',
          hkdToCnyPpm: 850000,
        },
        now,
      ),
    ).toBe(false)
    expect(
      isFxStale(
        { retrievedAt: now, rateDate: '2026-10-10', hkdToCnyPpm: 850000 },
        now,
      ),
    ).toBe(true)
  })
})
