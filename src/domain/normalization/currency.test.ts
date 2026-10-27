import { describe, expect, it } from 'vitest'
import { normalizeAccountCurrency, normalizeCurrency } from './currency'

describe('currency contracts', () => {
  it('normalizes RMB aliases while retaining foreign original currencies', () => {
    expect(normalizeAccountCurrency(' rmb ')).toBe('CNY')
    expect(normalizeAccountCurrency('HK$')).toBe('HKD')
    expect(normalizeCurrency('mop')).toBe('MOP')
    expect(normalizeCurrency('JPY')).toBe('JPY')
  })
  it('rejects an unsupported account instead of guessing HKD', () => {
    expect(() => normalizeAccountCurrency('USD')).toThrow()
    expect(() => normalizeCurrency('dollar')).toThrow()
  })
})
