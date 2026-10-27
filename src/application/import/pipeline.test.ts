import { describe, expect, it, vi } from 'vitest'
import { DomainError } from '@/domain/model/errors'
import type { Dataset } from '@/domain/model/types'
import { parsePulseStatement } from '@/domain/parsing/pulse/parse'
import { pulsePage, purchase } from '@/test-support/pulse-statement'
import { createMemorySession } from '@/store/memory-session'
import { PdfReadError } from '@/ports/pdf'
import type { LocalPdfDocument, PdfReader, PdfSource } from '@/ports/pdf'
import type { StatementParser } from '@/ports/statements'
import { createPdfImportController } from './controller'
import { commitImportedBatch } from './commit'
import { IMPORT_LIMITS } from './limits'
import { deriveWorkspace } from '@/application/session/selectors'

const source = (
  name: string,
  body = `%PDF-${name}`,
  size?: number,
): PdfSource => ({
  name,
  type: 'application/pdf',
  size: size ?? body.length,
  arrayBuffer: async () => new TextEncoder().encode(body).buffer,
})
const document = (): LocalPdfDocument => ({
  pages: [
    pulsePage({
      closing: '10.00',
      ledger: [purchase('SYNTHETIC PRIVATE STORE CN', '10.00')],
    }),
  ],
  dispose: vi.fn(async () => {}),
})
const parser: StatementParser = {
  parse: async (pages, file) =>
    parsePulseStatement(
      pages,
      file,
      (kind, number) => `${kind}-${number.slice(-4)}`,
    ),
}
function setup(
  reader: PdfReader = { read: async () => document() },
  processor = parser,
) {
  const store = createMemorySession()
  const commit = vi.fn((files: readonly Dataset[], revision: number) =>
    commitImportedBatch(store, files, revision),
  )
  const controller = createPdfImportController({
    reader,
    parser: processor,
    commit,
    fingerprint: async (bytes) => new TextDecoder().decode(bytes),
    now: () => 1000,
    existing: () => {
      const current = store.getSnapshot()
      return {
        revision: current.revision,
        files: current.dataset.statements.length,
        hashes: current.dataset.statements.map(
          (statement) => statement.fileHash,
        ),
        bytes: current.dataset.statements.reduce(
          (sum, statement) => sum + (statement.fileSizeBytes ?? 0),
          0,
        ),
      }
    },
  })
  return { store, controller, commit }
}

describe('parsed PDF batch pipeline', () => {
  it('rejects an individually parseable but uncomputable amount without blocking other files', async () => {
    const { store, controller } = setup({
      async read(bytes) {
        const overflow = new TextDecoder().decode(bytes).includes('overflow')
        return {
          pages: [
            pulsePage({
              closing: overflow ? '9000000000000.00' : '10.00',
              ledger: [
                purchase(
                  'SYNTHETIC STORE CN',
                  overflow ? '9000000000000.00' : '10.00',
                ),
              ],
            }),
          ],
          dispose: async () => {},
        }
      },
    })
    controller.start([source('overflow.pdf'), source('valid.pdf')])
    await vi.waitFor(() => expect(controller.getSnapshot().active).toBe(false))
    expect(controller.getSnapshot().items.map((item) => item.status)).toEqual([
      'error',
      'imported',
    ])
    expect(controller.getSnapshot().items[0].problem).toBe('invalid-statement')
    expect(store.getSnapshot().dataset.statements).toHaveLength(1)
    expect(deriveWorkspace(store.getSnapshot()).expenseCount).toBe(1)
  })
  it('imports structurally valid balance mismatches and keeps the warning in the rewards view', async () => {
    const { store, controller } = setup({
      read: async () => ({
        pages: [
          pulsePage({
            closing: '20.00',
            ledger: [purchase('SYNTHETIC STORE CN', '10.00')],
          }),
        ],
        dispose: async () => {},
      }),
    })
    controller.start([source('mismatch.pdf')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().outcome.status).toBe('committed'),
    )
    expect(deriveWorkspace(store.getSnapshot())).toMatchObject({
      mismatchCount: 1,
      expenseCount: 1,
    })
  })
  it('waits for a locked file and publishes all successful files exactly once', async () => {
    const documents: LocalPdfDocument[] = []
    const { store, controller, commit } = setup({
      async read(bytes, options) {
        if (
          new TextDecoder().decode(bytes).includes('locked') &&
          !options.password
        )
          throw new PdfReadError('password-required')
        const result = document()
        documents.push(result)
        return result
      },
    })
    const changed = vi.fn()
    store.subscribe(changed)
    controller.start([source('normal.pdf'), source('locked.pdf')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().items.map((item) => item.status)).toEqual(
        ['parsed', 'locked'],
      ),
    )
    expect(commit).not.toHaveBeenCalled()
    expect(store.getSnapshot().dataset.statements).toHaveLength(0)
    expect(documents[0].dispose).toHaveBeenCalledTimes(1)
    expect(controller.preview(controller.getSnapshot().items[0].id)).toBeNull()
    expect(JSON.stringify(controller.getSnapshot())).not.toContain(
      'PRIVATE STORE',
    )
    controller.unlock(
      controller.getSnapshot().items[1].id,
      'synthetic-password',
    )
    await vi.waitFor(() =>
      expect(controller.getSnapshot().outcome.status).toBe('committed'),
    )
    expect(changed).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot().dataset.statements).toHaveLength(2)
    expect(store.getSnapshot().dataset.cards).toHaveLength(1)
    expect(controller.getSnapshot().items.map((item) => item.status)).toEqual([
      'imported',
      'imported',
    ])
    expect(
      documents.every(
        (result) => vi.mocked(result.dispose).mock.calls.length === 1,
      ),
    ).toBe(true)
    controller.cancel()
    expect(store.getSnapshot().dataset.statements).toHaveLength(2)
  })

  it('discards parsed and late work on cancel while preserving previously imported data', async () => {
    let resolveLate: (dataset: Dataset) => void = () => {}
    let lateDataset: Dataset | undefined
    const processor: StatementParser = {
      async parse(pages, file, signal) {
        const dataset = await parser.parse(pages, file, signal)
        if (file.fileName !== 'late.pdf') return dataset
        lateDataset = dataset
        return new Promise((resolve) => {
          resolveLate = resolve
        })
      },
    }
    const { store, controller, commit } = setup(undefined, processor)
    controller.start([source('previous.pdf')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().outcome.status).toBe('committed'),
    )
    const previous = store.getSnapshot()
    controller.start([source('ready.pdf'), source('late.pdf')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().items.map((item) => item.status)).toEqual(
        ['parsed', 'parsing'],
      ),
    )
    controller.cancel()
    expect(store.getSnapshot()).toBe(previous)
    resolveLate(lateDataset!)
    controller.start([source('fresh.pdf')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().outcome.status).toBe('committed'),
    )
    expect(
      store
        .getSnapshot()
        .dataset.statements.map((statement) => statement.fileName)
        .sort(),
    ).toEqual(['fresh.pdf', 'previous.pdf'])
    expect(commit).toHaveBeenCalledTimes(2)
  })

  it('commits valid files when other files have unsupported templates or invalid fields', async () => {
    const processor: StatementParser = {
      async parse(pages, file, signal) {
        if (file.fileName === 'other.pdf')
          throw new DomainError('parse.unsupported-template')
        if (file.fileName === 'broken.pdf')
          throw new DomainError('parse.conflicting-balances')
        return parser.parse(pages, file, signal)
      },
    }
    const { store, controller } = setup(undefined, processor)
    controller.start([
      source('valid.pdf'),
      source('other.pdf'),
      source('broken.pdf'),
    ])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().outcome.status).toBe('committed'),
    )
    expect(controller.getSnapshot().items.map((item) => item.problem)).toEqual([
      null,
      'unsupported-statement',
      'invalid-statement',
    ])
    expect(store.getSnapshot().dataset.statements).toHaveLength(1)
    expect(controller.getSnapshot().outcome).toMatchObject({
      files: 1,
      transactions: 1,
    })
  })

  it('does not publish duplicate-only or invalid-only batches', async () => {
    const read = vi.fn<PdfReader['read']>(async () => document())
    const { store, controller, commit } = setup({ read })
    controller.start([source('one.pdf')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().outcome.status).toBe('committed'),
    )
    const previous = store.getSnapshot()
    controller.start([source('same.pdf', '%PDF-one.pdf')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().outcome.status).toBe('empty'),
    )
    expect(controller.getSnapshot().items[0].status).toBe('duplicate')
    controller.start([source('not.pdf', 'invalid')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().outcome.status).toBe('empty'),
    )
    expect(store.getSnapshot()).toBe(previous)
    expect(read).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledTimes(1)
  })

  it('settles after removing a locked file but cannot remove already imported transactions', async () => {
    const { store, controller } = setup({
      async read(bytes) {
        if (new TextDecoder().decode(bytes).includes('locked'))
          throw new PdfReadError('password-required')
        return document()
      },
    })
    controller.start([source('valid.pdf'), source('locked.pdf')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().items.map((item) => item.status)).toEqual(
        ['parsed', 'locked'],
      ),
    )
    controller.remove(controller.getSnapshot().items[1].id)
    expect(controller.getSnapshot().outcome.status).toBe('committed')
    const id = controller.getSnapshot().items[0].id
    controller.remove(id)
    expect(controller.getSnapshot().items[0].status).toBe('imported')
    expect(store.getSnapshot().dataset.transactions).toHaveLength(1)
  })

  it('reports a changed session without overwriting it or pretending that parsed files were imported', async () => {
    let finish: () => void = () => {}
    const processor: StatementParser = {
      async parse(pages, file, signal) {
        await new Promise<void>((resolve) => {
          finish = resolve
        })
        return parser.parse(pages, file, signal)
      },
    }
    const { store, controller } = setup(undefined, processor)
    controller.start([source('valid.pdf')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().items[0].status).toBe('parsing'),
    )
    store.clear()
    const current = store.getSnapshot()
    finish()
    await vi.waitFor(() =>
      expect(controller.getSnapshot().outcome.status).toBe('failed'),
    )
    expect(controller.getSnapshot().outcome.problem).toBe('session-changed')
    expect(store.getSnapshot()).toBe(current)
    expect(controller.getSnapshot().items[0].status).toBe('parsed')
  })

  it('enforces cumulative bytes from previously imported files', async () => {
    const { store, controller } = setup()
    const prior: Dataset = {
      cards: [],
      transactions: [],
      statements: [
        {
          id: 'prior',
          fileHash: 'prior',
          fileName: 'prior.pdf',
          date: '2026-10-20',
          period: { from: '2026-09-21', to: '2026-10-20' },
          pageCount: 1,
          templateVersion: 'synthetic',
          accounts: [],
          warnings: [],
          fileSizeBytes: IMPORT_LIMITS.sessionBytes - 1,
        },
      ],
    }
    store.replace(prior, 'real')
    controller.start([source('valid.pdf', '%PDF-valid', 2)])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().items[0].problem).toBe('session-limit'),
    )
    expect(store.getSnapshot().dataset).toBe(prior)
  })

  it('skips an existing duplicate at a full session limit before attempting PDF parsing', async () => {
    const read = vi.fn<PdfReader['read']>(async () => document())
    const commit = vi.fn(() => ({ files: 0, transactions: 0 }))
    const controller = createPdfImportController({
      reader: { read },
      parser,
      commit,
      now: () => 0,
      fingerprint: async (bytes) => new TextDecoder().decode(bytes),
      existing: () => ({
        files: 20,
        bytes: IMPORT_LIMITS.sessionBytes,
        hashes: ['%PDF-duplicate'],
      }),
    })
    controller.start([source('duplicate.pdf', '%PDF-duplicate')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().outcome.status).toBe('empty'),
    )
    expect(controller.getSnapshot().items[0].status).toBe('duplicate')
    expect(read).not.toHaveBeenCalled()
    expect(commit).not.toHaveBeenCalled()
  })

  it('does not let a duplicate consume the last remaining session slot', async () => {
    const commit = vi.fn((files: readonly Dataset[]) => ({
      files: files.length,
      transactions: files.flatMap((file) => file.transactions).length,
    }))
    const controller = createPdfImportController({
      reader: { read: async () => document() },
      parser,
      commit,
      now: () => 0,
      fingerprint: async (bytes) => new TextDecoder().decode(bytes),
      existing: () => ({ files: 19, bytes: 0, hashes: ['%PDF-duplicate'] }),
    })
    controller.start([
      source('duplicate.pdf', '%PDF-duplicate'),
      source('valid.pdf'),
    ])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().outcome.status).toBe('committed'),
    )
    expect(controller.getSnapshot().items.map((item) => item.status)).toEqual([
      'duplicate',
      'imported',
    ])
    expect(commit).toHaveBeenCalledTimes(1)
    expect(controller.getSnapshot().outcome.files).toBe(1)
  })
})
