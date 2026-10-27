import { useI18n } from '@/i18n/use-i18n'
import { Dialog } from './Dialog'

export function PrivacyDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  return (
    <Dialog title={t('privacy.title')} onClose={onClose}>
      <div className="space-y-6">
        {(['local', 'network', 'independent'] as const).map((section) => (
          <section className="space-y-2" key={section}>
            <h3 className="font-medium">{t(`privacy.${section}Title`)}</h3>
            <p className="text-muted-foreground">{t(`privacy.${section}Body`)}</p>
          </section>
        ))}
      </div>
    </Dialog>
  )
}
