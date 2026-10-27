import { describe, expect, it } from 'vitest'
import { addMinor, convertMinor, microRcForSpend, microRcToCnyMinor, parseMinor } from './money'

describe('integer money', () => {
  it.each([['1,234.56', 123456], ['0.01', 1], ['250', 25000], ['12.3', 1230], ['(123.45)', -12345], ['123.45CR', -12345], ['-123.45 CR', -12345], ['123.45 DR', 12345], ['-0.00', 0]])('parses %s without decimal arithmetic', (input, expected) => expect(parseMinor(input)).toBe(expected))
  it.each(['1,23.45', '1.234', 'NaN', '1e3', '+12CR', '-12DR', '(12', '12)', '', '9007199254740992'])('rejects ambiguous or unsafe input %s', input => expect(() => parseMinor(input)).toThrow())
  it('adds minor units exactly and rejects overflow', () => {
    expect(addMinor([parseMinor('0.10'), parseMinor('0.20')])).toBe(30)
    expect(() => addMinor([Number.MAX_SAFE_INTEGER, 1])).toThrow()
  })
  it('distinguishes an unavailable exchange rate from zero', () => {
    expect(convertMinor(10000, null)).toBeNull()
    expect(convertMinor(0, 900000)).toBe(0)
    expect(convertMinor(105, 900000)).toBe(95)
    expect(convertMinor(-105, 900000)).toBe(-95)
    expect(() => convertMinor(100, 0)).toThrow()
  })
  it('preserves fractional RC independently from reference CNY', () => {
    expect(microRcForSpend(1, 40)).toBe(40)
    expect(microRcForSpend(25000, 40)).toBe(1000000)
    expect(microRcToCnyMinor(11000000, 900000)).toBe(990)
    expect(microRcToCnyMinor(11000000, null)).toBeNull()
    expect(() => microRcForSpend(-100, 40)).toThrow()
  })
})
