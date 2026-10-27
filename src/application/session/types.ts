import type { Dataset } from '@/domain/model/types'

export interface FxSnapshot {
  readonly hkdToCnyPpm: number | null
  readonly source: 'unavailable' | 'demo' | 'live' | 'cache'
  readonly stale: boolean
}

export interface SessionState {
  readonly revision: number
  readonly mode: 'empty' | 'demo' | 'real'
  readonly dataset: Dataset
  readonly fx: FxSnapshot
}

export interface SessionStore {
  getSnapshot(): SessionState
  subscribe(listener: () => void): () => void
  replace(dataset: Dataset, mode: 'demo' | 'real', fx?: FxSnapshot): void
  clear(): void
}
