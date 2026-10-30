import { useSyncExternalStore } from 'react'
import { workspace } from './runtime/workspace'

const { importer } = workspace

export function usePdfImport() {
  const batch = useSyncExternalStore(
    importer.subscribe,
    importer.getSnapshot,
    importer.getSnapshot,
  )
  return { batch, controller: importer }
}
