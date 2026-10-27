import type { FxQuote } from '@/ports/fx'

export const FX_MAX_AGE_MS = 24 * 60 * 60 * 1000
const MAX_PUBLICATION_AGE_MS = 7 * 24 * 60 * 60 * 1000

export function isFxStale(
  quote: FxQuote & { readonly retrievedAt: number },
  now: number,
) {
  return (
    now - quote.retrievedAt >= FX_MAX_AGE_MS ||
    now - Date.parse(`${quote.rateDate}T00:00:00Z`) >= MAX_PUBLICATION_AGE_MS
  )
}
