import { useI18n } from '@/i18n/use-i18n'
import { Dialog } from './Dialog'
import { InfoSection } from './InfoSection'

export function PrivacyDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  return (
    <Dialog
      title={t('privacy.title')}
      description={t('privacy.subtitle')}
      onClose={onClose}
      className="sm:max-w-2xl"
    >
      <div className="space-y-4" data-privacy-details>
        <InfoSection title={t('privacy.localTitle')}>
          <dl className="space-y-3">
            {(['pdf', 'results', 'cache'] as const).map((kind) => (
              <div
                key={kind}
                className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4"
              >
                <dt className="font-medium">{t(`privacy.${kind}Label`)}</dt>
                <dd className="text-muted-foreground">
                  {t(`privacy.${kind}Value`)}
                </dd>
              </div>
            ))}
          </dl>
        </InfoSection>
        <InfoSection title={t('privacy.networkTitle')}>
          <p className="text-muted-foreground">{t('privacy.networkBody')}</p>
          <a
            className="text-sm underline underline-offset-4"
            href="https://frankfurter.dev/"
            target="_blank"
            rel="noreferrer"
          >
            Frankfurter / ECB
          </a>
        </InfoSection>
        <InfoSection title={t('privacy.independentTitle')}>
          <p className="text-muted-foreground">
            {t('privacy.independentBody')}
          </p>
        </InfoSection>
      </div>
    </Dialog>
  )
}
