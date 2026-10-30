import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { workspace } from './runtime/workspace'
import { useI18n } from '@/i18n/use-i18n'
import { createAgentRuntime } from './agent-runtime'
import type { WorkspaceActions } from './workspace-actions'

export function useAgentRuntime(actions: WorkspaceActions) {
  const { t } = useI18n()
  const translate = useRef(t)
  const [runtime] = useState(() => createAgentRuntime(workspace.store, workspace.importer))
  const status = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getSnapshot)
  const shared = useSyncExternalStore(runtime.access.subscribe, runtime.access.getSnapshot, runtime.access.getSnapshot)

  useEffect(() => { translate.current = t }, [t])

  useEffect(() => runtime.connect(document, actions, () => translate.current), [runtime, actions])

  return { status, shared, grant: runtime.access.grant, revoke: runtime.access.revoke, retry: runtime.retry }
}
