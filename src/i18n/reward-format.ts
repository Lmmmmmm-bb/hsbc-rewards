import { safeInteger } from '@/domain/money/money'
import type { Locale } from './locale'

/** Integer rounding keeps all six microRC digits, including at the safe-integer boundary. */
export function formatRewardNumber(microRc: number, locale: Locale, precision: 'summary' | 'exact' = 'summary') {
  safeInteger(microRc)
  const value = BigInt(microRc)
  const negative = value < 0n
  const absolute = negative ? -value : value
  if (precision === 'summary' && absolute > 0n && absolute < 5_000n) return '<0.01'
  const scaled = precision === 'summary' ? (absolute + 5_000n) / 10_000n : absolute
  const scale = precision === 'summary' ? 100n : 1_000_000n
  const whole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(scaled / scale)
  const fraction = String(scaled % scale).padStart(precision === 'summary' ? 2 : 6, '0')
  const decimal = precision === 'exact' ? fraction.replace(/0+$/, '').padEnd(2, '0') : fraction
  return `${negative ? '-' : ''}${whole}.${decimal}`
}
