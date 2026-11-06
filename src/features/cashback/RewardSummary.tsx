import type { WorkspaceView } from '@/application/session/selectors'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/i18n/use-i18n'
import type { ReactNode } from 'react'
import { ResultReveal } from './ResultReveal'

export function RewardSummary({
  view,
  hasResults,
  statementCount,
  cardCount,
  range,
  period,
  revealKey,
  children,
}: {
  view: Pick<
    WorkspaceView,
    | 'totalRewardMicroRc'
    | 'knownRewardMicroRc'
    | 'totalRewardCnyMinor'
    | 'tierTotals'
    | 'expenseCount'
  >
  hasResults: boolean
  statementCount: number
  cardCount: number
  range: { from: string; to: string } | null
  period?: WorkspaceView['periods'][number]
  children?: ReactNode
  revealKey: string
}) {
  const { t, number, money, rcSummary, rewardNumber, date } = useI18n()
  const amount = view.totalRewardMicroRc ?? view.knownRewardMicroRc
  const formatted = rewardNumber(amount)
  const stats = [
    { label: 'cashback.statements', value: statementCount },
    { label: 'cashback.cards', value: cardCount },
    { label: 'cashback.purchases', value: view.expenseCount },
  ] as const

  return (
    <Card
      data-reward-summary
      className="@container/summary min-w-0 ring-primary/20"
    >
      <CardContent>
        <ResultReveal
          trigger={hasResults ? revealKey : null}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">
              {t(
                hasResults && view.totalRewardMicroRc === null
                  ? 'cashback.knownHeading'
                  : 'cashback.total',
              )}
            </h2>
            {period && (
              <Badge variant="secondary">
                {t(period.half === 1 ? 'period.h1' : 'period.h2', {
                  year: period.year,
                })}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <p
                data-reward-total
                className={`flex flex-wrap items-baseline gap-x-2 leading-none font-semibold tracking-tight text-primary tabular-nums ${formatted.length > 12 ? 'text-2xl sm:text-4xl' : 'text-5xl sm:text-6xl'}`}
              >
                <span className="whitespace-nowrap">
                  {hasResults ? formatted : '—'}
                </span>
                <span className="text-lg font-medium text-foreground">RC</span>
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-1 @lg/summary:items-end @lg/summary:text-right">
              <p className="text-xs text-muted-foreground">
                {t('cashback.reference')}
              </p>
              <p className="text-lg font-medium tabular-nums">
                {hasResults
                  ? view.totalRewardCnyMinor === null
                    ? t('rewards.fxMissing')
                    : money(view.totalRewardCnyMinor)
                  : '—'}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              hasResults
                ? view.totalRewardMicroRc === null
                  ? 'cashback.knownHint'
                  : 'cashback.totalHint'
                : 'cashback.emptyHint',
            )}
          </p>
          <dl
            className={
              hasResults
                ? 'grid grid-cols-1 gap-3 @lg/summary:grid-cols-3'
                : 'grid grid-cols-3 gap-3'
            }
          >
            {view.tierTotals.map(({ tier, microRc, knownMicroRc }) => (
              <div
                key={tier}
                className={
                  hasResults
                    ? 'flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 @lg/summary:flex-col @lg/summary:items-start @lg/summary:justify-start'
                    : 'flex min-w-0 flex-col gap-1'
                }
              >
                <dt className="text-xs text-muted-foreground">
                  {t(`rewards.${tier}`)}
                </dt>
                <dd className="text-base font-semibold whitespace-nowrap tabular-nums">
                  {hasResults ? rcSummary(microRc) : '— RC'}
                </dd>
                {hasResults && microRc === null && knownMicroRc > 0 && (
                  <dd className="w-full text-xs text-muted-foreground">
                    {t('rewards.knownPortion', {
                      amount: rcSummary(knownMicroRc),
                    })}
                  </dd>
                )}
              </div>
            ))}
          </dl>
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {stats.map(({ label, value }) => (
              <div key={label} className="flex gap-2">
                <dt className="text-muted-foreground">{t(label)}</dt>
                <dd className="font-medium tabular-nums">
                  {hasResults ? number(value, 0) : '—'}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            {t('period.range')} ·{' '}
            {range ? `${date(range.from)} — ${date(range.to)}` : '—'}
          </p>
          {hasResults && view.totalRewardMicroRc === null && (
            <Badge variant="outline">{t('cashback.pendingRewards')}</Badge>
          )}
          {children}
        </ResultReveal>
      </CardContent>
    </Card>
  )
}
