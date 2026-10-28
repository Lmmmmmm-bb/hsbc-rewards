import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemorySession } from '@/store/memory-session'
import { createTranslator } from '@/i18n/messages'
import { importedFile } from '@/tests/fixtures/imported-file'
import { PdfReadError } from '@/ports/pdf'
import { LATEST_RULES } from '@/domain/rewards/rules'
import { createPdfImportController } from '../import/controller'
import { createAgentAccess } from './access'
import { createAgentService } from './service'
import { commitImportedBatch } from '../import/commit'

const disposers: Array<() => void> = []
afterEach(() => disposers.splice(0).forEach((dispose) => dispose()))

function setup() {
  const store = createMemorySession()
  store.replace(importedFile(), 'real')
  const importer = createPdfImportController({ reader: { read: async () => { throw new PdfReadError('password-required') } },
    fingerprint: async (bytes) => new TextDecoder().decode(bytes), now: () => 1000,
    existing: () => ({ hashes: [], files: 1, bytes: 1000, revision: store.getSnapshot().revision }) })
  const access = createAgentAccess(store)
  access.connect()
  const ui = { requestAccess: vi.fn(), openImport: vi.fn(), cancelImport: vi.fn(() => importer.cancel()) }
  let id = 0
  const service = createAgentService({ store, importer, access, ui, nextId: () => `synthetic-${++id}`, now: () => 1000,
    translate: () => createTranslator('en-US') })
  disposers.push(() => { service.dispose(); access.dispose(); importer.cancel() })
  return { store, importer, access, ui, service }
}

function source(name: string) {
  return { name, type: 'application/pdf', size: 100, arrayBuffer: async () => new TextEncoder().encode(`%PDF-${name}`).buffer }
}

describe('agent tool service', () => {
  it('keeps import references through the first commit and FX updates but rejects them after a new batch', async () => {
    const store = createMemorySession()
    const importer = createPdfImportController({
      reader: { read: async (_, options) => {
        if (!options.password) throw new PdfReadError('password-required')
        return { pages: [], dispose: async () => {} }
      } },
      parser: { parse: async () => importedFile() },
      commit: (files, revision) => commitImportedBatch(store, files, revision),
      fingerprint: async () => 'synthetic-first-commit', now: () => 1000,
      existing: () => ({ hashes: [], files: 0, bytes: 0, revision: store.getSnapshot().revision }),
    })
    const access = createAgentAccess(store)
    access.connect()
    access.grant()
    const ui = { requestAccess: vi.fn(), openImport: vi.fn(), cancelImport: () => importer.cancel() }
    let id = 0
    const service = createAgentService({ store, importer, access, ui, nextId: () => `first-${++id}`, now: () => 1000,
      translate: () => createTranslator('en-US') })
    disposers.push(() => { service.dispose(); access.dispose(); importer.cancel() })
    importer.start([source('synthetic-first.pdf')])
    await vi.waitFor(() => expect(importer.getSnapshot().items[0].status).toBe('locked'))
    const before = (await service.execute('reward_get_import_status')).data as { batchRef: string; files: { fileRef: string }[] }
    const batch = importer.getSnapshot().batch
    const itemId = importer.getSnapshot().items[0].id
    importer.unlock(itemId, 'synthetic-unlock')
    await vi.waitFor(() => expect(importer.getSnapshot().outcome.status).toBe('committed'))
    expect(importer.getSnapshot().batch).toBe(batch)
    expect(await service.execute('reward_get_import_status', { batchRef: before.batchRef })).toMatchObject({ status: 'ok', data: {
      batchRef: before.batchRef, files: [{ fileRef: before.files[0].fileRef, status: 'imported' }],
    } })
    store.setFx({ hkdToCnyPpm: 900000, source: 'live', stale: false, rateDate: '2026-10-27', retrievedAt: 1000 })
    expect(await service.execute('reward_open_import', { fileRef: before.files[0].fileRef })).toMatchObject({ status: 'ok' })
    expect(ui.openImport).toHaveBeenLastCalledWith(itemId)
    importer.start([source('synthetic-next.pdf')])
    expect(await service.execute('reward_get_import_status', { batchRef: before.batchRef })).toMatchObject({ error: { code: 'agent.batch_changed' } })
    expect(await service.execute('reward_open_import', { fileRef: before.files[0].fileRef })).toMatchObject({ error: { code: 'agent.file_not_found' } })
    expect(await service.execute('reward_cancel_import', { batchRef: before.batchRef })).toMatchObject({ error: { code: 'agent.batch_changed' } })
  })

  it('exposes public capabilities without leaking results and never grants access by opening the dialog', async () => {
    const { service, access, ui } = setup()
    const context = await service.execute('reward_get_context')
    expect(context.status).toBe('ok')
    expect(context.data).toMatchObject({ sharingEnabled: false, documents: { overview: '/llms.txt', guide: '/webmcp.txt' } })
    expect(JSON.stringify(context)).not.toContain('hash-a')
    const denied = await service.execute('reward_get_summary')
    expect(denied).toMatchObject({ status: 'needs_user_action', error: { code: 'agent.access_required' } })
    expect(denied.data).toBeUndefined()
    expect(await service.execute('reward_request_access')).toMatchObject({ status: 'needs_user_action' })
    expect(ui.requestAccess).toHaveBeenCalledOnce()
    expect(access.allowed()).toBe(false)
    access.grant()
    expect(await service.execute('reward_get_summary')).toMatchObject({ status: 'ok', data: { statementCount: 1 } })
  })

  it.each([
    ['reward_cancel_import', {}], ['reward_cancel_import', { batchRef: 1 }],
    ['reward_get_card_rewards', { cardRef: 'card_x' }],
    ['reward_get_summary', { limit: 0 }], ['reward_get_summary', { limit: 21 }],
    ['reward_get_summary', { limit: 1.5 }], ['reward_get_summary', { periodId: '2026-Q2' }],
    ['reward_get_summary', { cursor: 'cursor_x' }],
    ['reward_list_transactions', { resultToken: 'result_x', includeDescription: 'true' }],
    ['reward_list_transactions', { resultToken: 'result_x', flags: ['pending', 'pending'] }],
    ['reward_list_transactions', { resultToken: 'result_x', flags: ['unverified'] }],
    ['reward_open_import', { url: 'https://example.test/private.pdf' }],
  ] as const)('validates %s arguments before taking action: %j', async (name, input) => {
    const { service, ui } = setup()
    expect(await service.execute(name, input)).toMatchObject({ status: 'error', error: { code: 'agent.invalid_arguments' } })
    expect(ui.openImport).not.toHaveBeenCalled()
    expect(ui.cancelImport).not.toHaveBeenCalled()
  })

  it('checks sharing and result versions again after execution yields', async () => {
    const { service, access, store } = setup()
    access.grant()
    const pending = service.execute('reward_get_summary')
    access.revoke()
    const denied = await pending
    expect(denied.error?.code).toBe('agent.access_required')
    expect(denied.data).toBeUndefined()
    access.grant()
    const changing = service.execute('reward_get_summary')
    store.setFx({ hkdToCnyPpm: 900000, source: 'live', stale: false, rateDate: '2026-10-27', retrievedAt: 1000 })
    const changed = await changing
    expect(changed.error?.code).toBe('agent.result_changed')
    expect(changed.data).toBeUndefined()
  })

  it('keeps cancel scoped to the current batch and never cancels imports when a query is aborted', async () => {
    const { service, access, importer, ui, store } = setup()
    access.grant()
    importer.start([source('SYNTHETIC_PRIVATE_ONE.pdf')])
    await vi.waitFor(() => expect(importer.getSnapshot().items[0].status).toBe('locked'))
    const first = await service.execute('reward_get_import_status')
    const oldBatch = (first.data as { batchRef: string }).batchRef
    expect(first.data).toMatchObject({ nextAction: 'user_unlock' })
    expect(await service.execute('reward_get_summary')).toMatchObject({
      meta: { latestImport: { active: true, uncommittedFiles: 1, outcome: { status: 'idle' } } },
      data: { statementCount: 1 },
    })
    expect(JSON.stringify(first)).not.toContain('SYNTHETIC_PRIVATE')
    importer.cancel()
    importer.start([source('SYNTHETIC_PRIVATE_TWO.pdf')])
    await vi.waitFor(() => expect(importer.getSnapshot().items[0].status).toBe('locked'))
    expect(await service.execute('reward_cancel_import', { batchRef: oldBatch })).toMatchObject({ error: { code: 'agent.batch_changed' } })
    const signal = new AbortController()
    const aborted = service.execute('reward_get_import_status', {}, signal.signal)
    signal.abort()
    expect((await aborted).error?.code).toBe('agent.cancelled')
    expect(importer.getSnapshot().active).toBe(true)
    expect(ui.cancelImport).not.toHaveBeenCalled()
    const current = await service.execute('reward_get_import_status')
    const before = store.getSnapshot()
    expect(await service.execute('reward_cancel_import', { batchRef: (current.data as { batchRef: string }).batchRef })).toMatchObject({ status: 'ok' })
    expect(ui.cancelImport).toHaveBeenCalledOnce()
    expect(importer.getSnapshot().active).toBe(false)
    expect(store.getSnapshot()).toBe(before)
  })

  it('returns source-backed rule explanations without fetching live terms', async () => {
    const { service } = setup()
    const rules = await service.execute('reward_get_rules', { topic: 'eligibility' })
    expect(rules.data).toMatchObject({ id: LATEST_RULES.id, topic: 'eligibility', components: expect.arrayContaining([
      expect.objectContaining({ component: 'pulse', eligibility: expect.stringContaining('mainland China') }),
    ]) })
  })

  it('retains page sharing across append and FX updates but resets it on restart and demo transitions', () => {
    const { store, access } = setup()
    access.grant()
    store.replace(importedFile('next'), 'real')
    expect(access.allowed()).toBe(true)
    store.clear()
    expect(access.allowed()).toBe(false)
    store.replace(importedFile(), 'demo')
    expect(access.allowed()).toBe(true)
    store.replace(importedFile(), 'real')
    expect(access.allowed()).toBe(false)
    store.clear()
    access.grant()
    store.replace(importedFile(), 'real')
    expect(access.allowed()).toBe(true)
  })
})
