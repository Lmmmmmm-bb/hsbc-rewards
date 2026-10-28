import type { WorkspaceView } from '@/application/session/selectors'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { InfoSection } from '@/components/workspace/InfoSection'
import { useI18n } from '@/i18n/use-i18n'

export function RuleEligibility({ rules }: { rules: WorkspaceView['rules'] }) {
  const { t, number } = useI18n()
  const tiers = [
    { tier: 'basic', rate: rules.basicRateBasisPoints },
    {
      tier: 'abroad',
      rate: rules.basicRateBasisPoints * rules.maximumAbroadMultiplier,
    },
    { tier: 'pulse', rate: rules.pulse.rateBasisPoints },
  ] as const

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('rules.subtitle')}</p>
      <div className="grid gap-3 md:grid-cols-3">
        {tiers.map(({ tier, rate }) => (
          <Card key={tier} size="sm" className="border ring-0">
            <CardHeader className="gap-2">
              <CardTitle>
                <h3>{t(`rewards.${tier}`)}</h3>
              </CardTitle>
              <p className="text-2xl font-semibold text-primary tabular-nums">
                {t(
                  tier === 'basic'
                    ? 'rules.base'
                    : tier === 'abroad'
                      ? 'rules.maxExtra'
                      : 'rules.extra',
                  { rate: number(rate / 100) },
                )}
              </p>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="space-y-1">
                  <dt className="text-xs font-medium">
                    {t('rules.eligibilityLabel')}
                  </dt>
                  <dd className="text-muted-foreground">
                    {t(`rules.${tier}.body`)}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium">{t('rules.capLabel')}</dt>
                  <dd className="text-muted-foreground">
                    {t(`rules.${tier}.cap`)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
      <InfoSection title={t('rules.exampleTitle')}>
        <p className="text-xl font-semibold text-primary tabular-nums">
          1 RC + 5 RC + 5 RC = 11 RC
        </p>
        <p className="text-muted-foreground">{t('rules.exampleBody')}</p>
        <p className="text-xs text-muted-foreground">
          {t('cashback.fxReference')}
        </p>
      </InfoSection>
      <InfoSection title={t('rules.excludedTitle')}>
        <p className="text-muted-foreground">{t('rules.exclusions')}</p>
      </InfoSection>
    </div>
  )
}
