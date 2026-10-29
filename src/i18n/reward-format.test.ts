import { describe, expect, it } from 'vitest'
import { formatRewardNumber } from './reward-format'

describe('integer RC display', () => {
  it.each(['zh-CN', 'en-US'] as const)('separates zero, tiny values and integer rounding in %s', (locale) => {
    expect(formatRewardNumber(0, locale)).toBe('0.00')
    expect(formatRewardNumber(1, locale)).toBe('<0.01')
    expect(formatRewardNumber(4_999, locale)).toBe('<0.01')
    expect(formatRewardNumber(5_000, locale)).toBe('0.01')
    expect(formatRewardNumber(999_999, locale)).toBe('1.00')
    expect(formatRewardNumber(4_335_280_060, locale)).toBe('4,335.28')
    expect(formatRewardNumber(4_335_280_060, locale, 'exact')).toBe('4,335.28006')
    expect(formatRewardNumber(Number.MAX_SAFE_INTEGER, locale, 'exact')).toBe('9,007,199,254.740991')
    expect(formatRewardNumber(Number.MAX_SAFE_INTEGER, locale)).toBe('9,007,199,254.74')
  })
  it('rejects unsafe or fractional microRC', () => {
    expect(() => formatRewardNumber(0.1, 'en-US')).toThrow()
    expect(() => formatRewardNumber(Number.MAX_SAFE_INTEGER + 1, 'en-US')).toThrow()
  })
})
