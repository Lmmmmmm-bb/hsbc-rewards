import type { CachedFxQuote } from '@/ports/fx'

const DAY = 24 * 60 * 60 * 1000
const HONG_KONG_OFFSET = 8 * 60 * 60 * 1000

/** A calendar day in Hong Kong; publication dates can be older on weekends. */
export const fxDay = (timestamp: number) =>
  new Date(timestamp + HONG_KONG_OFFSET).toISOString().slice(0, 10)
export const msUntilNextFxDay = (now: number) =>
  DAY - ((now + HONG_KONG_OFFSET) % DAY)
export const isDailyFx = (quote: CachedFxQuote, now: number) =>
  quote.retrievedAt <= now && fxDay(quote.retrievedAt) === fxDay(now)
export const isFxStale = (quote: CachedFxQuote, now: number) =>
  !isDailyFx(quote, now) ||
  now - Date.parse(`${quote.rateDate}T00:00:00Z`) >= 7 * DAY
