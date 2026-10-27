import { InfoSection } from '@/components/workspace/InfoSection'
import { useI18n } from '@/i18n/use-i18n'

export function CalculationDetails() {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <InfoSection title={t('rules.scopeTitle')}>
        <p className="text-muted-foreground">{t('rewards.latest')}</p>
        <p className="text-muted-foreground">{t('rewards.imported')}</p>
      </InfoSection>
      <InfoSection title={t('period.rulesTitle')}>
        <p className="text-muted-foreground">{t('period.rulesBody')}</p>
        <p className="text-muted-foreground">{t('rules.sharingBody')}</p>
      </InfoSection>
      <InfoSection title={t('precision.title')}>
        <dl className="space-y-3">
          {(['compute', 'display', 'bank'] as const).map((kind) => (
            <div key={kind} className="space-y-1">
              <dt className="font-medium">{t(`precision.${kind}Label`)}</dt>
              <dd className="text-muted-foreground">
                {t(`precision.${kind}`)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="bg-muted p-3 text-sm">{t('precision.example')}</p>
      </InfoSection>
      <InfoSection title={t('rules.enrollmentTitle')}>
        <p className="text-muted-foreground">{t('rewards.enrollment')}</p>
        <p className="text-muted-foreground">
          {t('rewards.enrollmentPeriodIgnored')}
        </p>
      </InfoSection>
      <InfoSection title={t('rules.fxTitle')}>
        <p className="text-muted-foreground">{t('rewards.fxEffect')}</p>
        <p className="text-muted-foreground">{t('fx.dailyPolicy')}</p>
        <p className="text-xs text-muted-foreground">
          {t('fx.publicationHint')}
        </p>
      </InfoSection>
    </div>
  )
}
