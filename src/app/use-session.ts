import { useMemo, useSyncExternalStore } from 'react'
import { deriveWorkspace } from '@/application/session/selectors'
import { workspace } from './runtime/workspace'

const { store } = workspace

export function useSession() {
  const session = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )
  const view = useMemo(() => deriveWorkspace(session), [session])

  return { session, view }
}
