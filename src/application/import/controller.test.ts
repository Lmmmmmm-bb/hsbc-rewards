import { describe, expect, it, vi } from 'vitest'
import { PdfReadError } from '@/ports/pdf'
import type { LocalPdfDocument, PdfReader } from '@/ports/pdf'
import { deferred } from '@/test-support/helpers/deferred'
import { createPdfImportController } from './controller'

const source = (name = 'synthetic.pdf', body = '%PDF-synthetic') => {
  const bytes = new TextEncoder().encode(body)
  return {
    name,
    size: bytes.length,
    type: 'application/pdf',
    arrayBuffer: async () => bytes.slice().buffer,
  }
}
const document = (): LocalPdfDocument => ({
  pages: [
    {
      page: 1,
      width: 595,
      height: 842,
      rows: [
        { row: 1, text: 'SYNTHETIC', bounds: { x: 10, y: 10, width: 50, height: 10 }, spans: [] },
      ],
    },
  ],
  dispose: vi.fn(async () => {}),
})
function setup(reader: PdfReader, hashes: string[] = []) {
  let now = 1000
  const controller = createPdfImportController({
    reader,
    fingerprint: async (bytes) => new TextDecoder().decode(bytes),
    now: () => now,
    existing: () => ({ hashes, files: hashes.length, bytes: 0 }),
  })
  return {
    controller,
    setNow: (value: number) => {
      now = value
    },
  }
}

describe('provisional PDF batch', () => {
  it('releases the PDF document immediately after extraction, retaining only temporary text', async () => {
    const extracted = document()
    const { controller } = setup({ read: async () => extracted })
    controller.start([source()])
    await vi.waitFor(() => expect(controller.getSnapshot().items[0].status).toBe('extracted'))
    expect(extracted.dispose).toHaveBeenCalledTimes(1)
    const id = controller.getSnapshot().items[0].id
    expect(controller.preview(id)).toEqual(extracted.pages)
    controller.cancel()
    expect(controller.preview(id)).toBeNull()
    expect(extracted.dispose).toHaveBeenCalledTimes(1)
  })
  it('finishes other files while one is locked, then unlocks without retaining the password in snapshots', async () => {
    const read = vi.fn<PdfReader['read']>(async (bytes, options) => {
      if (
        new TextDecoder().decode(bytes).includes('locked') &&
        options.password !== 'synthetic-password'
      )
        throw new PdfReadError('password-required')
      options.onProgress(1, 1)
      return document()
    })
    const { controller } = setup({ read })
    controller.start([
      source('a.pdf', '%PDF-locked'),
      source('b.pdf', '%PDF-normal'),
      source('c.pdf', '%PDF-third'),
    ])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().items.map((item) => item.status)).toEqual([
        'locked',
        'extracted',
        'extracted',
      ]),
    )
    const id = controller.getSnapshot().items[0].id
    controller.unlock(id, 'synthetic-password')
    await vi.waitFor(() => expect(controller.getSnapshot().active).toBe(false))
    expect(controller.preview(id)?.[0].rows[0].text).toBe('SYNTHETIC')
    expect(JSON.stringify(controller.getSnapshot())).not.toContain('synthetic-password')
  })
  it('enforces a per-file password freeze and accepts a correct retry after expiry', async () => {
    const read = vi.fn<PdfReader['read']>(async (_, options) => {
      if (!options.password) throw new PdfReadError('password-required')
      if (options.password !== 'correct') throw new PdfReadError('password-incorrect')
      return document()
    })
    const { controller, setNow } = setup({ read })
    controller.start([source()])
    await vi.waitFor(() => expect(controller.getSnapshot().items[0].status).toBe('locked'))
    const id = controller.getSnapshot().items[0].id
    for (let i = 0; i < 5; i++) {
      controller.unlock(id, 'wrong')
      await vi.waitFor(() => expect(controller.getSnapshot().items[0].gate.failures).toBe(i + 1))
    }
    controller.unlock(id, 'correct')
    expect(read).toHaveBeenCalledTimes(6)
    setNow(61_000)
    controller.unlock(id, 'correct')
    await vi.waitFor(() => expect(controller.getSnapshot().items[0].status).toBe('extracted'))
    expect(controller.getSnapshot().items[0].gate.failures).toBe(0)
  })
  it('skips fingerprint duplicates both within a batch and against prior imports', async () => {
    const read = vi.fn<PdfReader['read']>(async () => document())
    const { controller } = setup({ read }, ['%PDF-prior'])
    controller.start([source('a.pdf'), source('copy.pdf'), source('prior.pdf', '%PDF-prior')])
    await vi.waitFor(() => expect(controller.getSnapshot().active).toBe(false))
    expect(controller.getSnapshot().items.map((item) => item.status)).toEqual([
      'extracted',
      'duplicate',
      'duplicate',
    ])
    expect(read).toHaveBeenCalledTimes(1)
  })
  it('cancel disposes successful documents and rejects late results from abandoned work', async () => {
    const first = document(),
      late = document()
    const pending = deferred<LocalPdfDocument>()
    const read = vi
      .fn<PdfReader['read']>()
      .mockResolvedValueOnce(first)
      .mockReturnValueOnce(pending.promise)
    const { controller } = setup({ read })
    controller.start([source('a.pdf', '%PDF-first'), source('b.pdf', '%PDF-second')])
    await vi.waitFor(() => expect(controller.getSnapshot().items[0].status).toBe('extracted'))
    controller.cancel()
    pending.resolve(late)
    await vi.waitFor(() => expect(late.dispose).toHaveBeenCalledTimes(1))
    expect(first.dispose).toHaveBeenCalledTimes(1)
    expect(controller.getSnapshot().items).toEqual([])
  })
  it('removes a locked file without affecting a successful file and rejects a new batch while locked', async () => {
    const reader: PdfReader = {
      async read(bytes) {
        if (new TextDecoder().decode(bytes).includes('locked'))
          throw new PdfReadError('password-required')
        return document()
      },
    }
    const { controller } = setup(reader)
    controller.start([source('locked.pdf', '%PDF-locked'), source('normal.pdf', '%PDF-normal')])
    await vi.waitFor(() =>
      expect(controller.getSnapshot().items.map((item) => item.status)).toEqual([
        'locked',
        'extracted',
      ]),
    )
    controller.start([source('replacement.pdf')])
    expect(controller.getSnapshot().rejected).toBe('batch-busy')
    controller.remove(controller.getSnapshot().items[0].id)
    expect(controller.getSnapshot().active).toBe(false)
    expect(controller.getSnapshot().items[1].status).toBe('extracted')
  })
  it('reports invalid file bytes before PDF reading, and retries recoverable reader failures', async () => {
    const read = vi
      .fn<PdfReader['read']>()
      .mockRejectedValueOnce(new PdfReadError('read-failed'))
      .mockResolvedValueOnce(document())
    const { controller } = setup({ read })
    controller.start([source('invalid.pdf', 'not-pdf'), source('retry.pdf', '%PDF-retry')])
    await vi.waitFor(() => expect(controller.getSnapshot().active).toBe(false))
    expect(controller.getSnapshot().items.map((item) => item.problem)).toEqual([
      'invalid-pdf',
      'read-failed',
    ])
    expect(read).toHaveBeenCalledTimes(1)
    controller.retry(controller.getSnapshot().items[1].id)
    await vi.waitFor(() => expect(controller.getSnapshot().items[1].status).toBe('extracted'))
  })
})
