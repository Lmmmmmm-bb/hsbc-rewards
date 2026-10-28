import { PdfReadError } from '@/ports/pdf'
import type { PdfSource, PdfTextPage } from '@/ports/pdf'
import type { Dataset } from '@/domain/model/types'
import { DomainError } from '@/domain/model/errors'
import { validateSessionDataset } from '@/application/session/validate'
import {
  EMPTY_GATE,
  hasPdfHeader,
  IMPORT_LIMITS,
  passwordWaitSeconds,
  recordPasswordFailure,
  validatePdfSource,
} from './limits'
import type {
  ImportDependencies,
  ImportItem,
  ImportSnapshot,
  PdfImportController,
} from './types'

interface PendingFile {
  size: number
  reserved?: boolean
  file?: PdfSource
  hash?: string
  pages?: readonly PdfTextPage[]
  dataset?: Dataset
  abort?: AbortController
  running: boolean
}

const EMPTY_OUTCOME = { status: 'idle' as const, files: 0, transactions: 0 }

/** Owns provisional work; the injected commit use case publishes all successful files once. */
export function createPdfImportController(
  dependencies: ImportDependencies,
): PdfImportController {
  if (Boolean(dependencies.parser) !== Boolean(dependencies.commit))
    throw new Error('import.incomplete-pipeline')

  let snapshot: ImportSnapshot = {
    batch: 0,
    active: false,
    items: [],
    rejected: null,
    outcome: EMPTY_OUTCOME,
  }
  let baselineRevision = 0
  const listeners = new Set<() => void>()
  const pending = new Map<string, PendingFile>()

  const publish = (
    items: readonly ImportItem[],
    rejected: ImportSnapshot['rejected'] = null,
  ) => {
    snapshot = {
      ...snapshot,
      items,
      rejected,
      active: items.some((item) =>
        ['queued', 'reading', 'locked', 'parsing'].includes(item.status),
      ),
    }
    listeners.forEach((listener) => listener())
  }

  const update = (id: string, patch: Partial<ImportItem>) => {
    publish(
      snapshot.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    )
  }

  const release = (entry: PendingFile) => {
    entry.abort?.abort()
    entry.pages = undefined
    entry.dataset = undefined
    entry.file = undefined
    entry.reserved = false
  }

  const current = (batch: number, id: string, entry: PendingFile) =>
    snapshot.batch === batch &&
    pending.get(id) === entry &&
    !entry.abort?.signal.aborted

  const run = async (id: string, password?: string) => {
    const entry = pending.get(id)
    if (!entry || !entry.file || entry.running) return

    entry.running = true
    entry.abort = new AbortController()
    const batch = snapshot.batch
    let parsing = false
    update(id, { status: 'reading', problem: null, completedPages: 0 })

    try {
      const bytes = await entry.file.arrayBuffer()
      if (!current(batch, id, entry)) return
      if (!hasPdfHeader(bytes)) throw new PdfReadError('invalid-pdf')

      const hash = entry.hash ?? (await dependencies.fingerprint(bytes))
      if (!current(batch, id, entry)) return

      if (
        dependencies.existing().hashes.includes(hash) ||
        [...pending.entries()].some(
          ([otherId, other]) => otherId !== id && other.hash === hash,
        )
      ) {
        update(id, { status: 'duplicate', problem: 'duplicate' })
        pending.delete(id)
        return
      }

      entry.hash = hash

      if (!entry.reserved) {
        const existing = dependencies.existing()
        const reserved = [...pending.values()].filter(
          (candidate) => candidate !== entry && candidate.reserved,
        )
        const problem = validatePdfSource(entry.file, {
          files: existing.files + reserved.length,
          bytes:
            existing.bytes +
            reserved.reduce((sum, candidate) => sum + candidate.size, 0),
        })
        if (problem) throw new DomainError('import.session-limit')

        entry.reserved = true
      }

      const reading = dependencies.reader.read(bytes, {
        signal: entry.abort.signal,
        password,
        maxPages: IMPORT_LIMITS.pages,
        onProgress: (completedPages, totalPages) => {
          if (current(batch, id, entry))
            update(id, { completedPages, totalPages })
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

      if (dependencies.parser) {
        parsing = true
        update(id, {
          status: 'parsing',
          totalPages: pages.length,
          completedPages: pages.length,
          gate: EMPTY_GATE,
        })
        const item = snapshot.items.find((item) => item.id === id)!
        const dataset = await dependencies.parser.parse(
          pages,
          {
            id: `statement-${hash}`,
            fileHash: hash,
            fileName: item.name,
            size: item.size,
          },
          entry.abort.signal,
        )
        await dependencies.yieldTask?.()
        if (!current(batch, id, entry)) return
        validateSessionDataset(dataset)
        await dependencies.yieldTask?.()
        if (!current(batch, id, entry)) return

        entry.dataset = dataset
        entry.pages = undefined
        update(id, {
          status: 'parsed',
          transactions: dataset.transactions.length,
          textRows: 0,
        })
        return
      }

      update(id, {
        status: 'extracted',
        totalPages: pages.length,
        completedPages: pages.length,
        textRows: pages.reduce((sum, page) => sum + page.rows.length, 0),
        gate: EMPTY_GATE,
      })
    } catch (error) {
      if (!current(batch, id, entry)) return

      entry.pages = undefined
      const problem =
        error instanceof DomainError && error.code === 'import.session-limit'
          ? 'session-limit'
          : parsing
            ? error instanceof DomainError &&
              error.code === 'parse.unsupported-template'
              ? 'unsupported-statement'
              : 'invalid-statement'
            : error instanceof PdfReadError
              ? error.code
              : 'read-failed'
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
      } else {
        entry.reserved = false
        update(id, { status: 'error', problem })
      }
    } finally {
      entry.running = false
      pump()
    }
  }

  function pump() {
    const capacity = Math.max(
      0,
      2 - [...pending.values()].filter((entry) => entry.running).length,
    )
    for (const item of snapshot.items
      .filter((item) => item.status === 'queued')
      .slice(0, capacity))
      void run(item.id)

    finish()
  }

  function finish() {
    if (
      !dependencies.commit ||
      snapshot.outcome.status !== 'idle' ||
      snapshot.active ||
      snapshot.items.length === 0 ||
      [...pending.values()].some((entry) => entry.running)
    )
      return

    const batch = snapshot.batch
    const files = snapshot.items
      .filter((item) => item.status === 'parsed')
      .map((item) => pending.get(item.id)?.dataset)
      .filter((dataset): dataset is Dataset => Boolean(dataset))
    if (files.length === 0) {
      snapshot = { ...snapshot, outcome: { ...EMPTY_OUTCOME, status: 'empty' } }
      publish(snapshot.items)
      return
    }

    try {
      const outcome = dependencies.commit(files, baselineRevision)
      if (snapshot.batch !== batch) return

      pending.forEach(release)
      pending.clear()
      snapshot = { ...snapshot, outcome: { status: 'committed', ...outcome } }
      publish(
        snapshot.items.map((item) =>
          item.status === 'parsed' ? { ...item, status: 'imported' } : item,
        ),
      )
    } catch (error) {
      pending.forEach(release)
      pending.clear()
      snapshot = {
        ...snapshot,
        outcome: {
          ...EMPTY_OUTCOME,
          status: 'failed',
          problem:
            error instanceof DomainError &&
            error.code === 'import.session-changed'
              ? 'session-changed'
              : 'commit-failed',
        },
      }
      publish(snapshot.items)
    }
  }

  const cancel = () => {
    snapshot = {
      ...snapshot,
      batch: snapshot.batch + 1,
      outcome: EMPTY_OUTCOME,
    }
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
      const existing = dependencies.existing()
      baselineRevision = existing.revision ?? 0
      const items = files.map((file, index): ImportItem => {
        const id = `${snapshot.batch}-${index}`
        // Fingerprint duplicates do not consume the remaining session allowance.
        const problem = validatePdfSource(file, { files: 0, bytes: 0 })
        if (!problem) {
          pending.set(id, { file, size: file.size, running: false })
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
          transactions: 0,
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
      if (
        snapshot.outcome.status === 'committed' ||
        snapshot.outcome.status === 'failed'
      )
        return
      if (
        snapshot.items.find((item) => item.id === id)?.status !== 'error' ||
        !pending.has(id)
      )
        return

      snapshot = { ...snapshot, outcome: EMPTY_OUTCOME }
      update(id, { status: 'queued' })
      pump()
    },

    remove(id) {
      if (
        snapshot.outcome.status === 'committed' ||
        snapshot.outcome.status === 'failed'
      )
        return

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
