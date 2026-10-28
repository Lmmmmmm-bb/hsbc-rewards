import { FxError, type FxProvider } from '@/ports/fx'
import { decodeFxQuote } from './decode-quote'

export const FX_ENDPOINT =
  'https://api.frankfurter.dev/v2/providers/ecb/rate/hkd/cny'
export const FX_TIMEOUT_MS = 8000

/** No request parameters can be derived from statements, transactions or user input. */
export function createFrankfurterProvider(
  request: typeof fetch = fetch,
  now = Date.now,
): FxProvider {
  return {
    async latest(signal) {
      if (signal.aborted) throw new FxError('aborted')

      const timeout = new AbortController()
      const timer = setTimeout(() => timeout.abort(), FX_TIMEOUT_MS)
      try {
        const response = await request(FX_ENDPOINT, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          redirect: 'error',
          cache: 'no-store',
          signal: AbortSignal.any([signal, timeout.signal]),
        })
        if (!response.ok) throw new FxError('http')

        let data: unknown
        try {
          data = await response.json()
        } catch {
          throw new FxError('invalid-response')
        }

        if (signal.aborted) throw new FxError('aborted')
        if (timeout.signal.aborted) throw new FxError('timeout')
        return decodeFxQuote(data, now())
      } catch (error) {
        if (signal.aborted) throw new FxError('aborted')
        if (timeout.signal.aborted) throw new FxError('timeout')
        throw error instanceof FxError ? error : new FxError('network')
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
