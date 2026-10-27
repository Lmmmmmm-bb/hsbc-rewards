import type { Dataset } from '@/domain/model/types'
import type { FxQuote } from '@/ports/fx'

export type FxSnapshot =
  | {
      readonly hkdToCnyPpm: null
      readonly source: 'unavailable'
      readonly stale: false
    }
  | {
      readonly hkdToCnyPpm: number
      readonly source: 'demo'
      readonly stale: false
    }
  | (FxQuote & {
      readonly source: 'live' | 'cache'
      readonly stale: boolean
      readonly retrievedAt: number
    })

export interface SessionState {
  /** Dataset revision: quote-only updates must not invalidate a pending import. */
  readonly revision: number
  readonly mode: 'empty' | 'demo' | 'real'
  readonly dataset: Dataset
  readonly fx: FxSnapshot
}

export interface SessionStore {
  getSnapshot(): SessionState
  subscribe(listener: () => void): () => void
  replace(dataset: Dataset, mode: 'demo' | 'real', fx?: FxSnapshot): void
  setFx(fx: FxSnapshot): void
  clear(): void
}
