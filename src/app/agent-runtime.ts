import type { SessionStore } from '@/application/session/types'
import type { PdfImportController } from '@/application/import/types'
import type { Translate } from '@/i18n/message-types'
import { createTranslator } from '@/i18n/messages'
import { createAgentAccess } from '@/application/agent/access'
import { nativeModelContext, registerAgentTools } from '@/adapters/webmcp/register'
import type { WorkspaceActions } from './workspace-actions'

export type AgentConnectionState = 'idle' | 'ready' | 'unavailable'

/** Construction is SSR-safe. Only connect performs browser registration and subscriptions. */
export function createAgentRuntime(store: SessionStore, importer: PdfImportController) {
  const access = createAgentAccess(store)
  let status: AgentConnectionState = 'idle'
  let generation = 0
  const listeners = new Set<() => void>()
  const publish = (next: AgentConnectionState) => {
    if (status === next) return
    status = next
    listeners.forEach((listener) => listener())
  }
  return {
    access,
    getSnapshot: () => status,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    connect(document: Document, ui: WorkspaceActions, translate: () => Translate) {
      const token = ++generation
      const lifetime = new AbortController()
      const disconnect = access.connect()
      const context = nativeModelContext(document)
      let disposeService: (() => void) | undefined
      if (context) {
        void import('@/application/agent/service').then(async ({ createAgentService }) => {
          if (token !== generation || lifetime.signal.aborted) return () => {}
          const service = createAgentService({ store, importer, access, ui, translate,
            nextId: () => crypto.randomUUID(), now: () => Date.now() })
          disposeService = service.dispose
          return registerAgentTools(context, service, createTranslator('en-US'), lifetime.signal)
        }).then(
          (dispose) => {
            if (token !== generation || lifetime.signal.aborted) dispose()
            else publish('ready')
          },
          () => {
            disposeService?.()
            if (token === generation && !lifetime.signal.aborted) publish('unavailable')
          },
        )
      } else publish('unavailable')
      return () => {
        lifetime.abort()
        disposeService?.()
        disconnect()
        if (token === generation) { generation++; publish('idle') }
      }
    },
  }
}
