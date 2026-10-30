import type { SessionStore } from '@/application/session/types'
import { createPdfImportRuntime } from './pdf-import'
import { createFxRuntime } from './fx'

/** Construction has no subscriptions or I/O; the page owns connection lifecycles. */
export function createWorkspaceRuntime(store: SessionStore) {
  return {
    store,
    importer: createPdfImportRuntime(store),
    fx: createFxRuntime(store),
  }
}
