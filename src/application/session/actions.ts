import { createDemoDataset } from '../demo/dataset'
import type { SessionStore } from './types'

export function loadDemoSession(store: SessionStore): void {
  store.replace(createDemoDataset(), 'demo', { hkdToCnyPpm: 900000, source: 'demo', stale: false })
}
