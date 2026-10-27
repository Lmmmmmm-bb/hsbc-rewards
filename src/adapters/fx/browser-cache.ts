import { isIsoDate } from '@/domain/normalization/dates'
import type { CachedFxQuote, FxCache } from '@/ports/fx'

export const FX_CACHE_KEY = 'pulse.fx.daily.v1'
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>

/** Public reference quote only. No PDF, password or session data is accepted by this port. */
export function createBrowserFxCache(
  storage: () => StoragePort | undefined = () =>
    typeof window === 'undefined' ? undefined : window.localStorage,
): FxCache {
  let memory: CachedFxQuote | null = null
  return {
    read() {
      try {
        const raw = storage()?.getItem(FX_CACHE_KEY)
        if (!raw) return memory
        const row = JSON.parse(raw) as Record<string, unknown>
        if (
          row === null ||
          row.version !== 1 ||
          row.provider !== 'frankfurter-ecb' ||
          typeof row.rateDate !== 'string' ||
          !isIsoDate(row.rateDate) ||
          !Number.isSafeInteger(row.hkdToCnyPpm) ||
          Number(row.hkdToCnyPpm) <= 0 ||
          !Number.isSafeInteger(row.retrievedAt) ||
          Number(row.retrievedAt) <= 0
        )
          return memory
        memory = {
          rateDate: row.rateDate,
          hkdToCnyPpm: Number(row.hkdToCnyPpm),
          retrievedAt: Number(row.retrievedAt),
        }
      } catch {
        /* Blocked or damaged storage falls back to this page's public quote. */
      }
      return memory
    },
    write(quote) {
      memory = {
        rateDate: quote.rateDate,
        hkdToCnyPpm: quote.hkdToCnyPpm,
        retrievedAt: quote.retrievedAt,
      }
      try {
        storage()?.setItem(
          FX_CACHE_KEY,
          JSON.stringify({
            version: 1,
            provider: 'frankfurter-ecb',
            ...memory,
          }),
        )
      } catch {
        /* Private browsing may deny storage; the quote remains available in memory. */
      }
    },
  }
}
