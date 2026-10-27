import { useState } from 'react'
import { navigate, useRoute } from '@/app/routes'
import { AppShell } from '@/components/workspace/AppShell'
import { ActionButton } from '@/components/workspace/ActionButton'
import { Dialog } from '@/components/workspace/Dialog'
import { PrivacyDialog } from '@/components/workspace/PrivacyDialog'
import { ImportPage } from '@/features/import/ImportPage'
import { LedgerPage } from '@/features/ledger/LedgerPage'
import { RewardsPage } from '@/features/rewards/RewardsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { useI18n } from '@/i18n/use-i18n'
import { useSession } from '@/store/use-session'

function App() {
  const page = useRoute(),
    { session, view, loadDemo, clear } = useSession(),
    { t } = useI18n()
  const [dialog, setDialog] = useState<'privacy' | 'clear' | null>(null)
  const onDemo = () => {
    if (session.mode === 'real') return
    loadDemo()
    navigate('ledger')
  }
  const onClear = () => setDialog('clear'),
    onPrivacy = () => setDialog('privacy')
  return (
    <AppShell page={page} session={session} onDemo={onDemo} onClear={onClear} onPrivacy={onPrivacy}>
      {page === 'import' && <ImportPage session={session} view={view} onDemo={onDemo} />}
      {page === 'ledger' && <LedgerPage session={session} view={view} onDemo={onDemo} />}
      {page === 'rewards' && <RewardsPage session={session} view={view} onDemo={onDemo} />}
      {page === 'settings' && (
        <SettingsPage session={session} onClear={onClear} onPrivacy={onPrivacy} />
      )}
      {dialog === 'privacy' && <PrivacyDialog onClose={() => setDialog(null)} />}
      {dialog === 'clear' && (
        <Dialog
          title={t('clear.title')}
          onClose={() => setDialog(null)}
          footer={
            <>
              <ActionButton variant="outline" onClick={() => setDialog(null)}>
                {t('action.cancel')}
              </ActionButton>
              <ActionButton
                onClick={() => {
                  clear()
                  setDialog(null)
                  navigate('import')
                }}
              >
                {t('action.confirmClear')}
              </ActionButton>
            </>
          }
        >
          <p>
            {t('clear.body', {
              files: session.dataset.statements.length,
              transactions: session.dataset.transactions.length,
            })}
          </p>
        </Dialog>
      )}
    </AppShell>
  )
}

export default App
