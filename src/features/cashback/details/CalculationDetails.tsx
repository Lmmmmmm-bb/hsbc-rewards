import type { ResultScope } from '@/application/results/scope'
import { resultAssumptions } from '@/application/results/assumptions'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/i18n/use-i18n'
import { AssumptionNotes } from '../AssumptionNotes'

export function CalculationDetails({ scope }: { scope: ResultScope }) {
  const { t, rc, date } = useI18n()
  const assumptions = resultAssumptions(scope.cards)
  return (
    <div className="space-y-6" data-calculation-details>
      <section className="space-y-5 border bg-muted/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <h3 className="text-sm font-medium">
              {t(
                scope.totals.totalRewardMicroRc === null
                  ? 'cashback.knownHeading'
                  : 'cashback.total',
              )}
            </h3>
            <p className="break-words text-2xl font-semibold tracking-tight text-primary tabular-nums sm:text-3xl">
              {rc(
                scope.totals.totalRewardMicroRc ??
                  scope.totals.knownRewardMicroRc,
              )}
            </p>
          </div>
          {scope.totals.totalRewardMicroRc === null && (
            <Badge variant="outline">{t('cashback.pendingRewards')}</Badge>
          )}
        </div>
        <dl className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          {scope.totals.tierTotals.map((tier) => (
            <div
              key={tier.tier}
              className="flex flex-wrap items-baseline justify-between gap-2 border bg-background p-3 sm:block sm:space-y-2"
            >
              <dt className="text-sm">{t(`rewards.${tier.tier}`)}</dt>
              <dd className="break-words text-base font-semibold tabular-nums sm:text-lg">
                {rc(tier.microRc)}
              </dd>
              {tier.microRc === null && (
                <dd className="text-xs text-muted-foreground">
                  {t('rewards.knownPortion', { amount: rc(tier.knownMicroRc) })}
                </dd>
              )}
            </div>
          ))}
        </dl>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-primary">
          {t('details.assumptions')}
        </h3>
        {assumptions.length ? (
          <AssumptionNotes items={assumptions} emphasis />
        ) : (
          <p>{t('details.assumptionsNone')}</p>
        )}
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-primary">
          {t('details.rulesUsed')}
        </h3>
        <dl className="grid gap-4 border-t pt-3 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">
              {t('details.ruleVersion')}
            </dt>
            <dd className="break-all text-sm font-medium">{scope.rules.id}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">
              {t('details.ruleDate')}
            </dt>
            <dd className="text-sm font-medium">
              {date(scope.rules.verifiedAt)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
