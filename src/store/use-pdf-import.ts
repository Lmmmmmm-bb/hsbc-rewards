import { useSyncExternalStore } from 'react'
import { pdfImport } from '@/application/import/runtime'

export function usePdfImport() {
  const batch = useSyncExternalStore(
    pdfImport.subscribe,
    pdfImport.getSnapshot,
    pdfImport.getSnapshot,
  )
  return { batch, controller: pdfImport }
}
