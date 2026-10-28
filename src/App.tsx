import { useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/workspace/Dialog'
import { PrivacyDialog } from '@/components/workspace/PrivacyDialog'
import { CashbackPage } from '@/features/cashback/CashbackPage'
import { useI18n } from '@/i18n/use-i18n'
import { useSession } from '@/store/use-session'
import { pdfImport } from '@/application/import/runtime'
import { usePdfImport } from '@/store/use-pdf-import'
import { useFx } from '@/store/use-fx'
import { PageFileDrop } from '@/features/import/components/PageFileDrop'
import { RulesDialog } from '@/features/cashback/RulesDialog'
import { FileStatusDialog } from '@/features/import/components/FileStatusDialog'
import { sessionStore } from '@/store/memory-session'
import { createWorkspaceActions } from '@/app/workspace-actions'
import { useAgentRuntime } from '@/app/use-agent-runtime'
import { AgentDialog } from '@/features/agent/AgentDialog'

function App() {
  const { session, view } = useSession(),
    { t } = useI18n(),
    { batch } = usePdfImport()
  const [actions] = useState(() => createWorkspaceActions(sessionStore, pdfImport))
  const { dialog, focusItemId } = useSyncExternalStore(actions.subscribe, actions.getSnapshot, actions.getSnapshot)
  const agent = useAgentRuntime(actions)
  const fx = useFx()

  return (
    <PageFileDrop onFiles={actions.importFiles} busy={batch.active}>
      <CashbackPage
        key={session.mode}
        session={session}
        view={view}
        fxRequest={fx.request}
        hasPendingFiles={batch.items.length > 0}
        onDemo={actions.loadDemo}
        onFiles={actions.importFiles}
        onRules={() => actions.show('rules')}
        onFileStatus={() => actions.show('files')}
        onClear={() => actions.show('clear')}
        onPrivacy={() => actions.show('privacy')}
        onAgent={() => actions.show('agent')}
      />
      {dialog === 'rules' && (
        <RulesDialog rules={view.rules} onClose={actions.close} />
      )}
      {dialog === 'privacy' && (
        <PrivacyDialog onClose={actions.close} />
      )}
      {dialog === 'files' && (
        <FileStatusDialog
          onFiles={actions.importFiles}
          onClose={actions.close}
          onCancel={actions.cancelImport}
          focusItemId={focusItemId}
        />
      )}
      {dialog === 'clear' && (
        <Dialog
          title={t('clear.title')}
          onClose={actions.close}
          footer={
            <>
              <Button variant="outline" onClick={actions.close}>
                {t('action.cancel')}
              </Button>
              <Button onClick={actions.restart}>{t('action.confirmClear')}</Button>
            </>
          }
        >
          <p>{t('clear.body')}</p>
        </Dialog>
      )}
      {dialog === 'agent' && <AgentDialog status={agent.status} shared={agent.shared}
        onGrant={agent.grant} onRevoke={agent.revoke} onRetry={agent.retry} onClose={actions.close} />}
    </PageFileDrop>
  )
}

export default App
