import { useI18n } from '@/i18n/use-i18n'
import { Dialog } from './Dialog'

export function PrivacyDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  return (
    <Dialog title={t('privacy.title')} onClose={onClose}>
      <div className="privacy-sections">
        {(['local', 'network', 'independent'] as const).map((section) => (
          <section key={section}>
            <h3>{t(`privacy.${section}Title`)}</h3>
            <p>{t(`privacy.${section}Body`)}</p>
          </section>
        ))}
      </div>
    </Dialog>
  )
}
