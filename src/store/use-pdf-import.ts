import { useSyncExternalStore } from 'react'
import { workspace } from '@/app/runtime/workspace'

const { importer: pdfImport } = workspace

export function usePdfImport() {
  const batch = useSyncExternalStore(
    pdfImport.subscribe,
    pdfImport.getSnapshot,
    pdfImport.getSnapshot,
  )
  return { batch, controller: pdfImport }
}
