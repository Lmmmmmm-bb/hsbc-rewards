import { describe, expect, it } from 'vitest'
import { decodeFxQuote } from './decode-quote'

const now = () => Date.parse('2026-10-27T10:00:00Z')
const data = { base: 'HKD', quote: 'CNY', date: '2026-10-26', rate: 0.8501236 }

describe('public FX quote decoding', () => {
  it('normalizes the validated pair into integer millionths', () => {
    expect(decodeFxQuote(data, now())).toEqual({
      hkdToCnyPpm: 850124,
      rateDate: '2026-10-26',
    })
  })

  it('rejects malformed rates, dates, the inverse pair and future dates without accepting source text', () => {
    const invalid: unknown[] = [
      null,
      [],
      '0.85',
      { ...data, base: 'CNY' },
      { ...data, quote: 'USD' },
      { ...data, date: '2026-02-30' },
      { ...data, date: '2026-10-28' },
      { ...data, date: null },
      ...[
        0,
        -1,
        NaN,
        Infinity,
        Number.MAX_SAFE_INTEGER,
        0.00000001,
        '0.85',
      ].map((rate) => ({ ...data, rate })),
    ]
    for (const value of invalid)
      expect(() => decodeFxQuote(value, now())).toThrow('fx.invalid-response')
  })
})
