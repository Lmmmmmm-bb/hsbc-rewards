import { RiExternalLinkLine } from '@remixicon/react'
import type { WorkspaceView } from '@/application/session/selectors'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
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
    <Card data-reward-rules>
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl font-semibold tracking-tight">
            {t('rules.title')}
          </h2>
        </CardTitle>
        <CardDescription>{t('rules.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map(({ tier, rate }) => (
            <section key={tier} className="space-y-3">
              <h3 className="font-medium">{t(`rewards.${tier}`)}</h3>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {t(tier === 'basic' ? 'rules.base' : 'rules.extra', {
                  rate: number(rate / 100),
                })}
              </p>
              <p className="text-muted-foreground">{t(`rules.${tier}.body`)}</p>
              <p className="font-medium">{t(`rules.${tier}.cap`)}</p>
            </section>
          ))}
        </div>
        <div className="space-y-2 border-t pt-5">
          <p className="font-medium">{t('rules.formula')}</p>
          <p className="text-muted-foreground">{t('rules.exclusions')}</p>
        </div>
        <Accordion>
          <AccordionItem value="rules">
            <AccordionTrigger>{t('rules.details')}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="break-all text-muted-foreground">
                  {t('rewards.readonly', { version: rules.id })} ·{' '}
                  {t('rewards.date', { date: rules.verifiedAt })}
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  {(['latest', 'imported', 'enrollment'] as const).map(
                    (key) => (
                      <li key={key}>{t(`rewards.${key}`)}</li>
                    ),
                  )}
                  <li>{t('rewards.fxEffect')}</li>
                  <li>{t('rewards.enrollmentPeriodIgnored')}</li>
                  <li>{t('rewards.poolUnconfirmed')}</li>
                </ul>
                <div className="flex flex-wrap gap-2">
                  {rules.sources.map((url, index) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({
                        variant: 'outline',
                        size: 'sm',
                      })}
                    >
                      {t(`rules.source.${index as 0 | 1 | 2 | 3}`)}
                      <RiExternalLinkLine aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
