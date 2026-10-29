import type { ResultScope } from '@/application/results/scope'
import { resultAssumptions } from '@/application/results/assumptions'
import { useI18n } from '@/i18n/use-i18n'
import { AssumptionNotes } from '../AssumptionNotes'

export function CalculationDetails({ scope }: { scope: ResultScope }) {
  const { t, rc, date } = useI18n()
  return (
    <div className="space-y-4" data-calculation-details>
      <dl className="space-y-2 tabular-nums">
        <div className="flex flex-wrap justify-between gap-2 font-medium">
          <dt>
            {t(
              scope.totals.totalRewardMicroRc === null
                ? 'cashback.knownHeading'
                : 'cashback.total',
            )}
          </dt>
          <dd>
            {rc(
              scope.totals.totalRewardMicroRc ??
                scope.totals.knownRewardMicroRc,
            )}
          </dd>
        </div>
        {scope.totals.tierTotals.map((tier) => (
          <div key={tier.tier} className="flex flex-wrap justify-between gap-2">
            <dt>{t(`rewards.${tier.tier}`)}</dt>
            <dd>
              {rc(tier.microRc)}
              {tier.microRc === null && (
                <span className="ml-2">
                  {t('rewards.knownPortion', { amount: rc(tier.knownMicroRc) })}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p>{t('precision.display')}</p>
      <AssumptionNotes items={resultAssumptions(scope.cards)} />
      <div className="space-y-2 text-muted-foreground">
        <p>
          {t('rewards.readonly', { version: scope.rules.id })} ·{' '}
          {t('rewards.date', { date: date(scope.rules.verifiedAt) })}
        </p>
        <p>{t('rewards.latest')}</p>
        <p>{t('rewards.imported')}</p>
        <p>{t('rules.exclusions')}</p>
      </div>
    </div>
  )
}
