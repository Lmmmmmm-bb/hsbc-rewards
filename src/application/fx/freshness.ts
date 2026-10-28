import type { CachedFxQuote } from '@/ports/fx'

const DAY = 24 * 60 * 60 * 1000
export const FX_CACHE_TTL_MS = 6 * 60 * 60 * 1000

/** Retrieval time controls reuse; publication dates can be older on weekends. */
export const msUntilFxExpiry = (quote: CachedFxQuote, now: number) =>
  quote.retrievedAt > now
    ? 0
    : Math.max(0, FX_CACHE_TTL_MS - (now - quote.retrievedAt))
export const isFxFresh = (quote: CachedFxQuote, now: number) =>
  msUntilFxExpiry(quote, now) > 0
export const isFxStale = (quote: CachedFxQuote, now: number) =>
  !isFxFresh(quote, now) ||
  now - Date.parse(`${quote.rateDate}T00:00:00Z`) >= 7 * DAY
