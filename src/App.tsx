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

function App() {
  const { session, view, loadDemo, clear } = useSession(),
    { t } = useI18n(),
    { batch } = usePdfImport()
  const [dialog, setDialog] = useState<'privacy' | 'clear' | null>(null)
  const fx = useFx()
  const restart = () => {
    pdfImport.cancel()
    clear()
    setDialog(null)
  }
  return (
    <>
      <CashbackPage
        session={session}
        view={view}
        fxRequest={fx.request}
        onRefreshFx={() => {
          void fx.refresh()
        }}
        hasPendingFiles={batch.items.length > 0}
        onDemo={() => {
          if (session.mode === 'real') return
          pdfImport.cancel()
          loadDemo()
        }}
        beforeRead={() => {
          if (session.mode === 'demo') clear()
        }}
        onClear={() => setDialog('clear')}
        onPrivacy={() => setDialog('privacy')}
      />
      {dialog === 'privacy' && (
        <PrivacyDialog onClose={() => setDialog(null)} />
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
    </>
  )
}
export default App
