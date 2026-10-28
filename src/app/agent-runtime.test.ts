import { describe, expect, it, vi } from 'vitest'
import { createMemorySession } from '@/store/memory-session'
import { createPdfImportController } from '@/application/import/controller'
import { createTranslator } from '@/i18n/messages'
import { importedFile } from '@/tests/fixtures/imported-file'
import { PdfReadError } from '@/ports/pdf'
import type { NativeModelContext } from '@/adapters/webmcp/register'
import { createAgentRuntime } from './agent-runtime'
import { createWorkspaceActions } from './workspace-actions'
import { deferred } from '@/tests/helpers/deferred'

function setup() {
  const store = createMemorySession()
  const importer = createPdfImportController({ reader: { read: async () => { throw new PdfReadError('password-required') } },
    fingerprint: async () => 'synthetic-file', now: () => 1000,
    existing: () => ({ hashes: [], files: 0, bytes: 0, revision: store.getSnapshot().revision }) })
  const actions = createWorkspaceActions(store, importer)
  const runtime = createAgentRuntime(store, importer)

  return { store, importer, actions, runtime }
}

describe('page-local agent composition', () => {
  it('constructs without SSR subscriptions and handles unavailable browsers without altering the session', () => {
    const { store, importer } = setup()
    const subscribe = vi.spyOn(store, 'subscribe')
    const loadService = vi.fn(() => import('@/application/agent/service'))
    const runtime = createAgentRuntime(store, importer, loadService)

    expect(subscribe).not.toHaveBeenCalled()

    const actions = createWorkspaceActions(store, importer)
    const before = store.getSnapshot()
    const stop = runtime.connect({} as Document, actions, () => createTranslator('en-US'))

    expect(runtime.getSnapshot()).toBe('unavailable')
    expect(loadService).not.toHaveBeenCalled()
    expect(store.getSnapshot()).toBe(before)

    stop()
    runtime.access.dispose()
  })

  it('survives mount-cleanup-remount and reads current language without registering tools again', async () => {
    const { store, importer, actions, runtime } = setup()
    const tools = new Map<string, Parameters<NativeModelContext['registerTool']>[0]>()
    let registrations = 0
    const context: NativeModelContext = { async registerTool(tool, { signal }) {
      if (tools.has(tool.name)) throw new Error('Duplicate native tool')

      registrations++
      tools.set(tool.name, tool)
      signal.addEventListener('abort', () => tools.delete(tool.name), { once: true })
    } }
    const document = { modelContext: context } as unknown as Document
    let locale: 'zh-CN' | 'en-US' = 'en-US'
    runtime.connect(document, actions, () => createTranslator(locale))()
    const stop = runtime.connect(document, actions, () => createTranslator(locale))
    await vi.waitFor(() => expect(runtime.getSnapshot()).toBe('ready'))

    expect(tools.size).toBe(10)
    expect(registrations).toBe(10)

    const summary = tools.get('reward_get_summary')!

    expect(await summary.execute({})).toMatchObject({ error: { message: createTranslator('en-US')('agent.error.no_results') } })

    locale = 'zh-CN'

    expect(await summary.execute({})).toMatchObject({ error: { message: createTranslator('zh-CN')('agent.error.no_results') } })
    expect(registrations).toBe(10)

    store.replace(importedFile(), 'real')
    runtime.access.grant()
    const before = store.getSnapshot()
    stop()

    expect(tools.size).toBe(0)
    expect(store.getSnapshot()).toBe(before)
    expect(importer.getSnapshot().active).toBe(false)

    runtime.access.dispose()
  })

  it('shares import actions with UI, keeps dialog focus requests idempotent, and does not steal other dialogs', async () => {
    const { store, importer, actions, runtime } = setup()
    const stop = runtime.access.connect()
    actions.loadDemo()

    expect(store.getSnapshot().mode).toBe('demo')

    actions.show('rules')

    expect(() => actions.requestAccess()).toThrow('agent.ui_busy')
    expect(actions.getSnapshot().dialog).toBe('rules')

    actions.close()
    actions.openImport()
    const same = actions.getSnapshot()
    actions.openImport()

    expect(actions.getSnapshot()).toBe(same)

    actions.importFiles([{ name: 'synthetic.pdf', size: 20, type: 'application/pdf', arrayBuffer: async () => new TextEncoder().encode('%PDF-synthetic').buffer }])
    await vi.waitFor(() => expect(importer.getSnapshot().items[0].status).toBe('locked'))

    expect(store.getSnapshot().mode).toBe('empty')

    const itemId = importer.getSnapshot().items[0].id
    actions.openImport(itemId)

    expect(actions.getSnapshot()).toMatchObject({ dialog: 'files', focusItemId: itemId })

    actions.close()

    expect(importer.getSnapshot().active).toBe(true)

    actions.show('agent')
    actions.cancelImport()

    expect(actions.getSnapshot().dialog).toBe('agent')
    expect(importer.getSnapshot().active).toBe(false)

    runtime.access.grant()
    actions.restart()

    expect(runtime.access.getSnapshot()).toBe(false)
    expect(actions.getSnapshot().dialog).toBeNull()

    stop()
    runtime.access.dispose()
  })

  it('recovers partial registration without resetting a real session, locked batch, sharing, or language', async () => {
    const { store, importer, actions, runtime } = setup()
    store.replace(importedFile(), 'real')
    importer.start([{ name: 'synthetic-locked.pdf', size: 20, type: 'application/pdf',
      arrayBuffer: async () => new TextEncoder().encode('%PDF-synthetic').buffer }])
    await vi.waitFor(() => expect(importer.getSnapshot().items[0].status).toBe('locked'))
    const active = new Map<string, Parameters<NativeModelContext['registerTool']>[0]>()
    let calls = 0
    const context: NativeModelContext = { async registerTool(tool, { signal }) {
      if (calls++ === 2) throw new Error('Synthetic transient registration failure')
      if (active.has(tool.name)) throw new Error('Duplicate registration')
      active.set(tool.name, tool)
      signal.addEventListener('abort', () => active.delete(tool.name), { once: true })
    } }
    let locale: 'en-US' | 'zh-CN' = 'en-US'
    actions.show('agent')
    const stop = runtime.connect({ modelContext: context } as unknown as Document, actions, () => createTranslator(locale))
    runtime.access.grant()
    const before = store.getSnapshot(), beforeBatch = importer.getSnapshot(), beforeDialog = actions.getSnapshot()
    await vi.waitFor(() => expect(runtime.getSnapshot()).toBe('error'))
    expect(active.size).toBe(0)
    locale = 'zh-CN'
    runtime.retry()
    runtime.retry()
    await vi.waitFor(() => expect(runtime.getSnapshot()).toBe('ready'))
    expect(calls).toBe(13)
    expect(active.size).toBe(10)
    expect(store.getSnapshot()).toBe(before)
    expect(importer.getSnapshot()).toBe(beforeBatch)
    expect(actions.getSnapshot()).toBe(beforeDialog)
    expect(runtime.access.allowed()).toBe(true)
    expect(await active.get('reward_get_summary')!.execute({})).toMatchObject({ status: 'ok', data: { statementCount: 1 },
      meta: { latestImport: { active: true, uncommittedFiles: 1 } } })
    expect(await active.get('reward_get_summary')!.execute({ limit: 0 })).toMatchObject({
      error: { message: createTranslator('zh-CN')('agent.error.invalid_arguments') },
    })
    stop()
    runtime.retry()
    expect(active.size).toBe(0)
    expect(calls).toBe(13)
    importer.cancel()
    runtime.access.dispose()
  })

  it('retries a failed module load and ignores an abandoned retry after a remount succeeds', async () => {
    const { store, importer, actions } = setup()
    const module = await import('@/application/agent/service')
    const pending = deferred<typeof module>()
    const loadService = vi.fn<() => Promise<typeof module>>()
      .mockRejectedValueOnce(new Error('Synthetic chunk load failure'))
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(module)
    const runtime = createAgentRuntime(store, importer, loadService)
    let registrations = 0
    const active = new Set<string>()
    const context: NativeModelContext = { async registerTool(tool, { signal }) {
      registrations++
      active.add(tool.name)
      signal.addEventListener('abort', () => active.delete(tool.name), { once: true })
    } }
    const document = { modelContext: context } as unknown as Document
    const stop = runtime.connect(document, actions, () => createTranslator('en-US'))
    await vi.waitFor(() => expect(runtime.getSnapshot()).toBe('error'))
    runtime.retry()
    expect(runtime.getSnapshot()).toBe('idle')
    expect(loadService).toHaveBeenCalledTimes(2)
    stop()
    const stopCurrent = runtime.connect(document, actions, () => createTranslator('en-US'))
    await vi.waitFor(() => expect(runtime.getSnapshot()).toBe('ready'))
    pending.resolve(module)
    await pending.promise
    await Promise.resolve()
    expect(runtime.getSnapshot()).toBe('ready')
    expect(active.size).toBe(10)
    expect(registrations).toBe(10)
    stopCurrent()
    expect(active.size).toBe(0)
    runtime.access.dispose()
  })
})
