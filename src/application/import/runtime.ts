import { sessionStore } from '@/store/memory-session'
import { createPdfImportController } from './controller'

// Composition root: concrete PDF implementation is lazy and never imported by a feature component.
export const pdfImport = createPdfImportController({
  reader: {
    async read(bytes, options) {
      const { pdfjsReader } = await import('@/adapters/pdf/pdfjs-reader')
      if (options.signal.aborted) throw new DOMException('Cancelled', 'AbortError')
      return pdfjsReader.read(bytes, options)
    },
  },
  async fingerprint(bytes) {
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
  },
  now: () => Date.now(),
  existing: () => {
    const session = sessionStore.getSnapshot()
    return {
      hashes:
        session.mode === 'real'
          ? session.dataset.statements.map((statement) => statement.fileHash)
          : [],
      files: session.mode === 'real' ? session.dataset.statements.length : 0,
      bytes: 0,
    }
  },
})
