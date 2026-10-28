import { describe, expect, it } from 'vitest'
import { FX_CACHE_TTL_MS, isFxFresh, isFxStale, msUntilFxExpiry } from './freshness'

describe('six-hour reference policy', () => {
  it('expires exactly six hours after retrieval', () => {
    const retrievedAt = Date.parse('2026-10-27T10:00:00Z')
    const quote = {
      retrievedAt,
      rateDate: '2026-10-26',
      hkdToCnyPpm: 850000,
    }
    const expiresAt = Date.parse('2026-10-27T16:00:00Z')
    expect(msUntilFxExpiry(quote, retrievedAt)).toBe(6 * 60 * 60 * 1000)
    expect(msUntilFxExpiry(quote, expiresAt - 1)).toBe(1)
    expect(isFxFresh(quote, expiresAt - 1)).toBe(true)
    expect(isFxStale(quote, expiresAt - 1)).toBe(false)
    expect(msUntilFxExpiry(quote, expiresAt)).toBe(0)
    expect(isFxFresh(quote, expiresAt)).toBe(false)
    expect(isFxStale(quote, expiresAt)).toBe(true)
    expect(msUntilFxExpiry(quote, expiresAt + 1000)).toBe(0)
  })
  it('keeps a recent quote valid across Hong Kong midnight', () => {
    const retrievedAt = Date.parse('2026-10-27T15:59:59Z')
    const quote = { retrievedAt, rateDate: '2026-10-26', hkdToCnyPpm: 850000 }
    const midnight = Date.parse('2026-10-27T16:00:00Z')
    expect(isFxFresh(quote, midnight)).toBe(true)
    expect(msUntilFxExpiry(quote, midnight)).toBe(FX_CACHE_TTL_MS - 1000)
  })
  it('rejects future retrieval times and flags old publications within the reuse window', () => {
    const now = Date.parse('2026-10-27T10:00:00Z')
    expect(
      isFxFresh(
        {
          retrievedAt: now + 1000,
          rateDate: '2026-10-26',
          hkdToCnyPpm: 850000,
        },
        now,
      ),
    ).toBe(false)
    expect(
      msUntilFxExpiry(
        { retrievedAt: now + 1000, rateDate: '2026-10-26', hkdToCnyPpm: 850000 },
        now,
      ),
    ).toBe(0)
    expect(
      isFxStale(
        { retrievedAt: now, rateDate: '2026-10-10', hkdToCnyPpm: 850000 },
        now,
      ),
    ).toBe(true)
  })
})
