import { isIsoDate } from '@/domain/normalization/dates'
import { FxError, type FxQuote } from '@/ports/fx'

/** Accept only the fixed pair and integer-millionth rate; never use API error text as UI content. */
export function decodeFxQuote(data: unknown, now: number): FxQuote {
  if (typeof data !== 'object' || data === null || Array.isArray(data))
    throw new FxError('invalid-response')
  const row = data as Record<string, unknown>
  if (
    row.base !== 'HKD' ||
    row.quote !== 'CNY' ||
    typeof row.rate !== 'number' ||
    !Number.isFinite(row.rate) ||
    row.rate <= 0 ||
    typeof row.date !== 'string' ||
    !isIsoDate(row.date) ||
    row.date > new Date(now).toISOString().slice(0, 10)
  )
    throw new FxError('invalid-response')
  const hkdToCnyPpm = Math.round(row.rate * 1_000_000)
  if (!Number.isSafeInteger(hkdToCnyPpm) || hkdToCnyPpm <= 0)
    throw new FxError('invalid-response')
  return { hkdToCnyPpm, rateDate: row.date }
}
