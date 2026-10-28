import { useI18n } from '@/i18n/use-i18n'
import { Dialog } from './Dialog'
import { DeferredDialogContent } from './DeferredDialogContent'

export function PrivacyDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()

  return (
    <Dialog
      title={t('privacy.title')}
      description={t('privacy.subtitle')}
      onClose={onClose}
      className="sm:max-w-2xl"
    >
      <DeferredDialogContent>
        {({ PrivacyDetails }) => <PrivacyDetails />}
      </DeferredDialogContent>
    </Dialog>
  )
}
