import { safeInteger } from '@/domain/money/money'
import type { Locale } from './locale'

/** Floor only the displayed RC; calculations retain the original microRC value. */
export function formatRewardNumber(microRc: number, locale: Locale, precision: 'summary' | 'decimal' | 'exact' = 'summary') {
  safeInteger(microRc)
  const value = BigInt(microRc)
  if (precision !== 'summary') {
    const negative = value < 0n
    const absolute = negative ? -value : value
    if (precision === 'decimal' && absolute > 0n && absolute < 5_000n) return negative ? '>-0.01' : '<0.01'
    const scaled = precision === 'decimal' ? (absolute + 5_000n) / 10_000n : absolute
    const scale = precision === 'decimal' ? 100n : 1_000_000n
    const whole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(scaled / scale)
    const fraction = String(scaled % scale).padStart(precision === 'decimal' ? 2 : 6, '0')
    const decimal = precision === 'exact' ? fraction.replace(/0+$/, '').padEnd(2, '0') : fraction
    return `${negative ? '-' : ''}${whole}.${decimal}`
  }
  const whole = value / 1_000_000n - (value < 0n && value % 1_000_000n !== 0n ? 1n : 0n)
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(whole)
}
