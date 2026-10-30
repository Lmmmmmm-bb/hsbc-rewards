import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessionStore } from '@/application/session/types'
import type { LocalPdfDocument, PdfSource } from '@/ports/pdf'
import { createMemorySession } from '@/store/memory-session'
import { pulsePage, purchase } from '@/tests/fixtures/pulse-statement'
import { deferred } from '@/tests/helpers/deferred'
import { createWorkspaceRuntime } from './create-workspace'

const reader = vi.hoisted(() => ({ read: vi.fn() }))
vi.mock('@/adapters/pdf/pdfjs-reader', () => ({ pdfjsReader: reader }))

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups.splice(0).reverse().forEach((cleanup) => cleanup())
  reader.read.mockReset()
  vi.unstubAllGlobals()
})

function sessionPort() {
  const memory = createMemorySession()
  // A separate contract object catches accidental use of a default store.
  const store: SessionStore = {
    ...memory,
    subscribe: vi.fn(memory.subscribe),
    replace: vi.fn(memory.replace),
    setFx: vi.fn(memory.setFx),
  }
  return store
}

function runtime(store = sessionPort()) {
  const workspace = createWorkspaceRuntime(store)
  cleanups.push(workspace.importer.cancel)
  return workspace
}

function pdf(): PdfSource {
  const bytes = new TextEncoder().encode('%PDF-SYNTHETIC-LOCAL-STATEMENT')
  return {
    name: 'synthetic.pdf',
    type: 'application/pdf',
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer,
  }
}

function document(): LocalPdfDocument {
  return {
    pages: [pulsePage({ closing: '10.00', ledger: [purchase('SYNTHETIC SHOP CN', '10.00')] })],
    dispose: vi.fn(async () => {}),
  }
}

describe('workspace runtime composition', () => {
  it('constructs without subscriptions, requests, cache access or PDF reads', () => {
    const request = vi.fn()
    const storage = vi.fn()
    vi.stubGlobal('fetch', request)
    vi.stubGlobal('window', { get localStorage() { return storage() } })
    const store = sessionPort()
    const before = store.getSnapshot()

    const workspace = runtime(store)

    expect(workspace.store).toBe(store)
    expect(store.getSnapshot()).toBe(before)
    expect(store.subscribe).not.toHaveBeenCalled()
    expect(request).not.toHaveBeenCalled()
    expect(storage).not.toHaveBeenCalled()
    expect(reader.read).not.toHaveBeenCalled()
  })

  it('commits, deduplicates and updates FX through the supplied store while another runtime stays isolated', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({
      base: 'HKD', quote: 'CNY', rate: 0.9, date: '2026-10-20',
    }), { headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', request)
    const extracted = document()
    reader.read.mockResolvedValue(extracted)
    const active = runtime()
    const idle = runtime()
    const idleBefore = idle.store.getSnapshot()
    const file = pdf()

    active.importer.start([file])
    await vi.waitFor(() => expect(active.importer.getSnapshot().outcome.status).toBe('committed'))
    expect(active.store.replace).toHaveBeenCalledOnce()
    expect(active.store.getSnapshot().dataset.transactions).toHaveLength(1)
    expect(extracted.dispose).toHaveBeenCalledOnce()
    expect(request).not.toHaveBeenCalled()

    active.importer.start([file])
    await vi.waitFor(() => expect(active.importer.getSnapshot().items[0]?.status).toBe('duplicate'))
    expect(reader.read).toHaveBeenCalledOnce()
    expect(active.store.replace).toHaveBeenCalledOnce()

    cleanups.push(active.fx.connect())
    await vi.waitFor(() => expect(active.fx.getSnapshot().status).toBe('ready'))
    expect(active.store.setFx).toHaveBeenCalledWith(expect.objectContaining({ source: 'live', hkdToCnyPpm: 900000 }))
    expect(active.store.getSnapshot().fx.source).toBe('live')
    expect(idle.store.getSnapshot()).toBe(idleBefore)
    expect(idle.importer.getSnapshot().items).toHaveLength(0)
    expect(idle.fx.getSnapshot().status).toBe('idle')
  })

  it('rejects a late import when the supplied session revision changes', async () => {
    const reading = deferred<LocalPdfDocument>()
    reader.read.mockReturnValue(reading.promise)
    const workspace = runtime()

    workspace.importer.start([pdf()])
    await vi.waitFor(() => expect(reader.read).toHaveBeenCalledOnce())
    workspace.store.clear()
    const cleared = workspace.store.getSnapshot()
    reading.resolve(document())

    await vi.waitFor(() => expect(workspace.importer.getSnapshot().outcome).toMatchObject({
      status: 'failed', problem: 'session-changed',
    }))
    expect(workspace.store.getSnapshot()).toBe(cleared)
    expect(workspace.store.replace).not.toHaveBeenCalled()
  })
})
