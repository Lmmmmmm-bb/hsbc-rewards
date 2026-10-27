import { RiExternalLinkLine } from '@remixicon/react'
import type { WorkspaceView } from '@/application/session/selectors'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'

export function RewardRules({ rules }: { rules: WorkspaceView['rules'] }) {
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
    <div data-reward-rules className="space-y-5 pr-1">
      <p className="text-muted-foreground">{t('rules.subtitle')}</p>
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map(({ tier, rate }) => (
          <section key={tier} className="space-y-2">
            <h3 className="font-semibold">{t(`rewards.${tier}`)}</h3>
            <p className="text-2xl font-semibold text-primary tabular-nums">
              {t(tier === 'basic' ? 'rules.base' : 'rules.extra', {
                rate: number(rate / 100),
              })}
            </p>
            <p>{t(`rules.${tier}.body`)}</p>
            <p className="text-xs text-muted-foreground">
              {t(`rules.${tier}.cap`)}
            </p>
          </section>
        ))}
      </div>
      <section className="space-y-2">
        <h3 className="font-semibold">{t('rules.exampleTitle')}</h3>
        <p className="font-mono text-lg font-semibold tabular-nums">
          1 RC + 5 RC + 5 RC = 11 RC
        </p>
        <p>{t('rules.exampleBody')}</p>
        <p className="text-xs text-muted-foreground">
          {t('cashback.fxReference')}
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">{t('precision.title')}</h3>
        <ul className="list-disc space-y-2 pl-5">
          {(
            [
              'precision.compute',
              'precision.display',
              'precision.example',
              'precision.bank',
            ] as const
          ).map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">{t('period.rulesTitle')}</h3>
        <p>{t('period.rulesBody')}</p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">{t('rules.assumptionsTitle')}</h3>
        <ul className="list-disc space-y-2 pl-5">
          {(
            [
              'rewards.latest',
              'rewards.imported',
              'rewards.enrollment',
              'rewards.enrollmentPeriodIgnored',
              'rewards.poolUnconfirmed',
              'rules.exclusions',
              'rewards.fxEffect',
            ] as const
          ).map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold">{t('rules.sourcesTitle')}</h3>
        <div className="flex flex-wrap gap-2">
          {rules.sources.map((url, index) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {t(`rules.source.${index as 0 | 1 | 2 | 3}`)}
              <RiExternalLinkLine aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{rules.id}</Badge>
          {t('rewards.date', { date: rules.verifiedAt })}
        </p>
      </section>
    </div>
  )
}
