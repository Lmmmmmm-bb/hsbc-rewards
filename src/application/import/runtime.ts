import { sessionStore } from '@/store/memory-session'
import { createPdfImportController } from './controller'
import { sha256 } from '@/adapters/crypto/sha256'
import { commitImportedBatch } from './commit'
import { addMinor } from '@/domain/money/money'

// Composition root: concrete PDF implementation is lazy and never imported by a feature component.
export const pdfImport = createPdfImportController({
  reader: {
    async read(bytes, options) {
      const { pdfjsReader } = await import('@/adapters/pdf/pdfjs-reader')
      if (options.signal.aborted)
        throw new DOMException('Cancelled', 'AbortError')
      return pdfjsReader.read(bytes, options)
    },
  },
  fingerprint: sha256,
  parser: {
    async parse(pages, source, signal) {
      const { pulseStatementParser } =
        await import('@/adapters/statements/pulse-parser')
      return pulseStatementParser.parse(pages, source, signal)
    },
  },
  commit: (files, revision) =>
    commitImportedBatch(sessionStore, files, revision),
  now: () => Date.now(),
  yieldTask: () => new Promise((resolve) => setTimeout(resolve, 0)),
  existing: () => {
    const session = sessionStore.getSnapshot()
    return {
      hashes:
        session.mode === 'real'
          ? session.dataset.statements.map((statement) => statement.fileHash)
          : [],
      files: session.mode === 'real' ? session.dataset.statements.length : 0,
      bytes:
        session.mode === 'real'
          ? addMinor(
              session.dataset.statements.map(
                (statement) => statement.fileSizeBytes ?? 0,
              ),
            )
          : 0,
      revision: session.revision,
    }
  },
})
