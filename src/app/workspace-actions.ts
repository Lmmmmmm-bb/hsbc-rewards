import type { ResultDetailsRequest } from '@/application/results/details'
import type { SessionStore } from '@/application/session/types'
import type { PdfImportController } from '@/application/import/types'
import type { PdfSource } from '@/ports/pdf'
import { loadDemoSession } from '@/application/session/actions'
import { AgentError } from '@/application/agent/errors'

export type WorkspaceDialog = 'privacy' | 'rules' | 'files' | 'clear' | 'agent' | 'details' | null

/** UI and browser tools share these actions; provisional imports stay owned by their controller. */
export function createWorkspaceActions(store: SessionStore, importer: PdfImportController) {
  let snapshot: { dialog: WorkspaceDialog; focusItemId?: string; details?: ResultDetailsRequest } = { dialog: null }
  const listeners = new Set<() => void>()

  const show = (dialog: WorkspaceDialog, focusItemId?: string) => {
    if (snapshot.dialog === dialog && snapshot.focusItemId === focusItemId) return

    snapshot = { dialog, focusItemId }
    listeners.forEach((listener) => listener())
  }

  const openForAgent = (dialog: 'agent' | 'files', focusItemId?: string) => {
    if (snapshot.dialog && snapshot.dialog !== dialog) throw new AgentError('ui_busy')
    show(dialog, focusItemId)
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    close: () => show(null),
    show,
    openDetails(details: ResultDetailsRequest) {
      snapshot = { dialog: 'details', details }
      listeners.forEach((listener) => listener())
    },
    requestAccess: () => openForAgent('agent'),
    openImport: (itemId?: string) => openForAgent('files', itemId),

    cancelImport() {
      importer.cancel()
      if (snapshot.dialog === 'files') show(null)
    },

    importFiles(files: readonly PdfSource[]) {
      if (!files.length) return

      if (!importer.getSnapshot().active) {
        if (store.getSnapshot().mode === 'demo') store.clear()
        show(null)
      }

      importer.start(files)
      if (importer.getSnapshot().items.length) show('files')
    },

    restart() { importer.cancel(); store.clear(); show(null) },

    loadDemo() {
      if (store.getSnapshot().mode === 'real') return

      importer.cancel()
      loadDemoSession(store)
    },
  }
}

export type WorkspaceActions = ReturnType<typeof createWorkspaceActions>
