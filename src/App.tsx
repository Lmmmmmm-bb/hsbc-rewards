import { useState } from 'react'
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

function App() {
  const { session, view, loadDemo, clear } = useSession(),
    { t } = useI18n(),
    { batch } = usePdfImport()
  const [dialog, setDialog] = useState<
    'privacy' | 'clear' | 'rules' | 'files' | null
  >(null)
  const fx = useFx()
  const restart = () => {
    pdfImport.cancel()
    clear()
    setDialog(null)
  }
  const importFiles = (files: readonly File[]) => {
    if (!files.length) return
    if (!pdfImport.getSnapshot().active) {
      if (session.mode === 'demo') clear()
      setDialog(null)
    }
    pdfImport.start(files)
    if (pdfImport.getSnapshot().items.length) setDialog('files')
  }
  return (
    <PageFileDrop onFiles={importFiles} busy={batch.active}>
      <CashbackPage
        key={session.mode}
        session={session}
        view={view}
        fxRequest={fx.request}
        hasPendingFiles={batch.items.length > 0}
        onDemo={() => {
          if (session.mode === 'real') return
          pdfImport.cancel()
          loadDemo()
        }}
        onFiles={importFiles}
        onRules={() => setDialog('rules')}
        onFileStatus={() => setDialog('files')}
        onClear={() => setDialog('clear')}
        onPrivacy={() => setDialog('privacy')}
      />
      {dialog === 'rules' && (
        <RulesDialog rules={view.rules} onClose={() => setDialog(null)} />
      )}
      {dialog === 'privacy' && (
        <PrivacyDialog onClose={() => setDialog(null)} />
      )}
      {dialog === 'files' && (
        <FileStatusDialog
          onClose={() => setDialog(null)}
          onCancel={() => {
            pdfImport.cancel()
            setDialog(null)
          }}
        />
      )}
      {dialog === 'clear' && (
        <Dialog
          title={t('clear.title')}
          onClose={() => setDialog(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setDialog(null)}>
                {t('action.cancel')}
              </Button>
              <Button onClick={restart}>{t('action.confirmClear')}</Button>
            </>
          }
        >
          <p>{t('clear.body')}</p>
        </Dialog>
      )}
    </PageFileDrop>
  )
}
export default App
