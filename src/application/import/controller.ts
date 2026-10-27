import { PdfReadError } from '@/ports/pdf'
import type { PdfSource, PdfTextPage } from '@/ports/pdf'
import {
  EMPTY_GATE,
  hasPdfHeader,
  IMPORT_LIMITS,
  passwordWaitSeconds,
  recordPasswordFailure,
  validatePdfSource,
} from './limits'
import type { ImportDependencies, ImportItem, ImportSnapshot, PdfImportController } from './types'

interface PendingFile {
  file?: PdfSource
  hash?: string
  pages?: readonly PdfTextPage[]
  abort?: AbortController
  running: boolean
}

/** Owns only the provisional batch. Session writes belong to the later commit use case. */
export function createPdfImportController(dependencies: ImportDependencies): PdfImportController {
  let snapshot: ImportSnapshot = { batch: 0, active: false, items: [], rejected: null }
  const listeners = new Set<() => void>()
  const pending = new Map<string, PendingFile>()
  const publish = (items: readonly ImportItem[], rejected: ImportSnapshot['rejected'] = null) => {
    snapshot = {
      ...snapshot,
      items,
      rejected,
      active: items.some(
        (item) => item.status === 'queued' || item.status === 'reading' || item.status === 'locked',
      ),
    }
    listeners.forEach((listener) => listener())
  }
  const update = (id: string, patch: Partial<ImportItem>) => {
    publish(snapshot.items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }
  const release = (entry: PendingFile) => {
    entry.abort?.abort()
    entry.pages = undefined
    entry.file = undefined
  }
  const current = (batch: number, id: string, entry: PendingFile) =>
    snapshot.batch === batch && pending.get(id) === entry && !entry.abort?.signal.aborted

  const run = async (id: string, password?: string) => {
    const entry = pending.get(id)
    if (!entry || !entry.file || entry.running) return
    entry.running = true
    entry.abort = new AbortController()
    const batch = snapshot.batch
    update(id, { status: 'reading', problem: null, completedPages: 0 })
    try {
      const bytes = await entry.file.arrayBuffer()
      if (!current(batch, id, entry)) return
      if (!hasPdfHeader(bytes)) throw new PdfReadError('invalid-pdf')
      const hash = entry.hash ?? (await dependencies.fingerprint(bytes))
      if (!current(batch, id, entry)) return
      if (
        dependencies.existing().hashes.includes(hash) ||
        [...pending.entries()].some(([otherId, other]) => otherId !== id && other.hash === hash)
      ) {
        update(id, { status: 'duplicate', problem: 'duplicate' })
        pending.delete(id)
        return
      }
      entry.hash = hash
      const reading = dependencies.reader.read(bytes, {
        signal: entry.abort.signal,
        password,
        maxPages: IMPORT_LIMITS.pages,
        onProgress: (completedPages, totalPages) => {
          if (current(batch, id, entry)) update(id, { completedPages, totalPages })
        },
      })
      password = undefined
      const document = await reading
      if (!current(batch, id, entry)) {
        await document.dispose()
        return
      }
      // The original document and Worker are not retained after extraction.
      const pages = document.pages
      await document.dispose()
      if (!current(batch, id, entry)) return
      entry.pages = pages
      entry.file = undefined
      update(id, {
        status: 'extracted',
        totalPages: pages.length,
        completedPages: pages.length,
        textRows: pages.reduce((sum, page) => sum + page.rows.length, 0),
        gate: EMPTY_GATE,
      })
    } catch (error) {
      if (!current(batch, id, entry)) return
      const problem = error instanceof PdfReadError ? error.code : 'read-failed'
      const item = snapshot.items.find((item) => item.id === id)!
      if (problem === 'password-required' || problem === 'password-incorrect') {
        update(id, {
          status: 'locked',
          problem,
          gate:
            problem === 'password-incorrect'
              ? recordPasswordFailure(item.gate, dependencies.now())
              : item.gate,
        })
      } else update(id, { status: 'error', problem })
    } finally {
      entry.running = false
      pump()
    }
  }
  function pump() {
    const capacity = Math.max(0, 2 - [...pending.values()].filter((entry) => entry.running).length)
    for (const item of snapshot.items.filter((item) => item.status === 'queued').slice(0, capacity))
      void run(item.id)
  }
  const cancel = () => {
    snapshot = { ...snapshot, batch: snapshot.batch + 1 }
    pending.forEach(release)
    pending.clear()
    publish([])
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    start(files) {
      if (!files.length) return
      if (snapshot.active) {
        publish(snapshot.items, 'batch-busy')
        return
      }
      cancel()
      const used = { files: dependencies.existing().files, bytes: dependencies.existing().bytes }
      const items = files.map((file, index): ImportItem => {
        const id = `${snapshot.batch}-${index}`
        const problem = validatePdfSource(file, used)
        if (!problem) {
          used.files++
          used.bytes += file.size
          pending.set(id, { file, running: false })
        }
        return {
          id,
          name: file.name,
          size: file.size,
          status: problem ? 'error' : 'queued',
          problem,
          completedPages: 0,
          totalPages: null,
          textRows: 0,
          gate: EMPTY_GATE,
        }
      })
      publish(items)
      pump()
    },
    unlock(id, password) {
      const item = snapshot.items.find((item) => item.id === id)
      if (
        item?.status !== 'locked' ||
        passwordWaitSeconds(item.gate, dependencies.now()) ||
        !password
      )
        return
      void run(id, password)
    },
    retry(id) {
      if (snapshot.items.find((item) => item.id === id)?.status !== 'error' || !pending.has(id))
        return
      update(id, { status: 'queued' })
      pump()
    },
    remove(id) {
      const entry = pending.get(id)
      if (entry) release(entry)
      pending.delete(id)
      update(id, { status: 'removed', problem: null })
      pump()
    },
    cancel,
    preview: (id) => pending.get(id)?.pages ?? null,
  }
}
