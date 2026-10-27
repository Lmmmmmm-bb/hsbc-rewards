import type { Dataset } from '@/domain/model/types'
import type { FxSnapshot } from './types'
import { deriveWorkspace } from './selectors'

/** Preflight the exact read model before publishing; individually safe money can still overflow aggregates or RC. */
export function validateSessionDataset(
  dataset: Dataset,
  fx: FxSnapshot = { source: 'unavailable', hkdToCnyPpm: null, stale: false },
): void {
  deriveWorkspace({ dataset, fx, mode: 'real', revision: 0 })
}
