import type { SessionStore } from '@/application/session/types'
import type { PdfImportController } from '@/application/import/types'
import type { Translate } from '@/i18n/message-types'
import { createTranslator } from '@/i18n/messages'
import { createAgentAccess } from '@/application/agent/access'
import { nativeModelContext, registerAgentTools } from '@/adapters/webmcp/register'
import type { WorkspaceActions } from './workspace-actions'

export type AgentConnectionState = 'idle' | 'ready' | 'unavailable' | 'error'
type ServiceModule = typeof import('@/application/agent/service')

/** Construction is SSR-safe. Only connect performs browser registration and subscriptions. */
export function createAgentRuntime(store: SessionStore, importer: PdfImportController,
  loadService: () => Promise<ServiceModule> = () => import('@/application/agent/service')) {
  const access = createAgentAccess(store)
  let status: AgentConnectionState = 'idle'
  let generation = 0
  let retryCurrent: (() => void) | undefined
  const listeners = new Set<() => void>()
  const publish = (next: AgentConnectionState) => {
    if (status === next) return
    status = next
    listeners.forEach((listener) => listener())
  }
  return {
    access,
    retry: () => retryCurrent?.(),
    getSnapshot: () => status,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    connect(document: Document, ui: WorkspaceActions, translate: () => Translate) {
      const token = ++generation
      const disconnect = access.connect()
      let attempt = 0
      let stopAttempt = () => {}
      const start = () => {
        if (token !== generation) return
        stopAttempt()
        const epoch = ++attempt
        const scope = new AbortController()
        const current = () => token === generation && epoch === attempt && !scope.signal.aborted
        let disposeService: (() => void) | undefined
        let unregister: (() => void) | undefined
        stopAttempt = () => { scope.abort(); unregister?.(); disposeService?.() }
        publish('idle')
        void (async () => {
          try {
            const context = nativeModelContext(document)
            if (!context) { if (current()) publish('unavailable'); return }
            const { createAgentService } = await loadService()
            if (!current()) return
            const service = createAgentService({ store, importer, access, ui, translate,
              nextId: () => crypto.randomUUID(), now: () => Date.now() })
            disposeService = service.dispose
            const dispose = await registerAgentTools(context, service, createTranslator('en-US'), scope.signal)
            if (!current()) { dispose(); return }
            unregister = dispose
            publish('ready')
          } catch {
            disposeService?.()
            if (current()) publish('error')
          }
        })()
      }
      const retry = () => { if (status === 'error') start() }
      retryCurrent = retry
      start()
      return () => {
        stopAttempt()
        disconnect()
        if (retryCurrent === retry) retryCurrent = undefined
        if (token === generation) { generation++; publish('idle') }
      }
    },
  }
}
