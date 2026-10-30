import { useMemo, useSyncExternalStore } from 'react'
import { loadDemoSession } from '@/application/session/actions'
import { deriveWorkspace } from '@/application/session/selectors'
import { workspace } from '@/app/runtime/workspace'

const { store: sessionStore } = workspace

export function useSession() {
  const session = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getSnapshot,
  )
  const view = useMemo(() => deriveWorkspace(session), [session])

  return {
    session,
    view,
    loadDemo: () => loadDemoSession(sessionStore),
    clear: () => sessionStore.clear(),
  }
}
