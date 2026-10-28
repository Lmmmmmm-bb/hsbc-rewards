export interface FxQuote {
  readonly hkdToCnyPpm: number
  readonly rateDate: string
}

export interface FxProvider {
  latest(signal: AbortSignal): Promise<FxQuote>
}

export interface CachedFxQuote extends FxQuote {
  readonly retrievedAt: number
}

export interface FxCache {
  read(): CachedFxQuote | null
  write(quote: CachedFxQuote): void
}

export type FxProblem =
  | 'network'
  | 'http'
  | 'timeout'
  | 'invalid-response'
  | 'aborted'
  | 'calculation'

export class FxError extends Error {
  readonly code: FxProblem
  constructor(code: FxProblem) {
    super(`fx.${code}`)
    this.name = 'FxError'
    this.code = code
  }
}
