import { describe, expect, it } from 'vitest'
import { createBrowserFxCache, FX_CACHE_KEY } from './browser-cache'

const quote = {
  hkdToCnyPpm: 850000,
  rateDate: '2026-10-26',
  retrievedAt: Date.parse('2026-10-27T10:00:00Z'),
}

function storage() {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,

    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

describe('public reference cache', () => {
  it('persists only the explicit public quote fields and can be read by a new page instance', () => {
    const target = storage()
    const first = createBrowserFxCache(() => target)
    first.write({
      ...quote,
      ...{ pdf: 'SYNTHETIC PRIVATE CONTENT', merchant: 'SYNTHETIC STORE' },
    })
    const raw = target.getItem(FX_CACHE_KEY)!

    expect(JSON.parse(raw)).toEqual({
      version: 1,
      provider: 'frankfurter-ecb',
      ...quote,
    })
    expect(raw).not.toContain('PRIVATE')
    expect(createBrowserFxCache(() => target).read()).toEqual(quote)
  })

  it('ignores corrupt entries, other providers, unsupported versions and invalid numeric/date fields', () => {
    const target = storage()
    const valid = { version: 1, provider: 'frankfurter-ecb', ...quote }
    for (const raw of [
      'not-json',
      'null',
      '[]',
      ...[
        { ...valid, version: 2 },
        { ...valid, provider: 'other' },
        { ...valid, rateDate: '2026-02-30' },
        { ...valid, hkdToCnyPpm: 0 },
        { ...valid, hkdToCnyPpm: '850000' },
        { ...valid, retrievedAt: null },
      ].map((row) => JSON.stringify(row)),
    ]) {
      target.setItem(FX_CACHE_KEY, raw)
      expect(createBrowserFxCache(() => target).read()).toBeNull()
    }
  })

  it('retains a public memory quote if browser storage is denied', () => {
    const cache = createBrowserFxCache(() => {
      throw new Error('storage blocked')
    })
    cache.write(quote)

    expect(cache.read()).toEqual(quote)
  })
})
