import type { ResultPool } from '@/application/results/pools'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/i18n/use-i18n'

export function RewardCaps({ pools }: { pools: readonly ResultPool[] }) {
  const { t, number, date } = useI18n()
  return (
    <section
      className="flex min-w-0 flex-col gap-3"
      aria-label={t('card.caps')}
      data-period-caps
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-medium">{t('card.caps')}</h3>
        <p className="text-xs text-muted-foreground">{t('rewards.imported')}</p>
      </div>
      {!pools.length && (
        <p className="text-muted-foreground">{t('rewards.noPool')}</p>
      )}
      <div className="grid items-start gap-3 md:grid-cols-2">
        {pools.map((pool) => (
          <Card
            key={pool.key}
            size="sm"
            data-cap-key={pool.key}
            className="@container/cap min-w-0"
          >
            <CardHeader className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium">
                  {t(`rewards.${pool.tier}`)}
                </h4>
                <Badge variant="outline">
                  {t(
                    pool.remainingMinor === null
                      ? 'caps.pending'
                      : pool.remainingMinor === 0
                        ? 'caps.exhausted'
                        : 'caps.remaining',
                  )}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <p>
                  {pool.relatedCards
                    .map(
                      (card) => `${t(`card.${card.role}`)} · ${card.lastFour}`,
                    )
                    .join(' / ')}{' '}
                  · {t(pool.shared ? 'caps.shared' : 'caps.independent')}
                </p>
                <p className="text-muted-foreground">
                  {t(
                    pool.tier === 'abroad' ? 'rewards.annual' : 'rewards.half',
                    {
                      period: pool.period,
                    },
                  )}{' '}
                  · {t('caps.asOf', { date: date(pool.asOf) })}
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex min-w-0 flex-col gap-3 text-xs">
              <Progress
                value={
                  pool.usedMinor === null
                    ? null
                    : (pool.usedMinor / pool.capMinor) * 100
                }
                aria-label={`${t(`rewards.${pool.tier}`)} ${pool.period}`}
              />
              <dl className="grid gap-x-4 gap-y-3 tabular-nums @sm/cap:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="flex min-w-0 flex-col gap-1">
                  <dt className="text-muted-foreground">{t('caps.used')}</dt>
                  <dd className="flex flex-wrap gap-x-1 text-sm font-semibold">
                    <span className="whitespace-nowrap">
                      {pool.usedMinor === null
                        ? t('rewards.pending')
                        : number(pool.usedMinor / 100)}
                    </span>
                    <span className="whitespace-nowrap">
                      / {number(pool.capMinor / 100)}
                    </span>
                  </dd>
                </div>
                <div className="flex min-w-0 flex-col gap-1 @sm/cap:text-right">
                  <dt className="text-muted-foreground">
                    {t('rewards.remaining')}
                  </dt>
                  <dd className="text-sm font-semibold">
                    {pool.remainingMinor === null
                      ? t('rewards.pending')
                      : number(pool.remainingMinor / 100)}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-col gap-1 text-muted-foreground">
                <p>
                  {t(
                    pool.tier === 'abroad' ? 'card.capAbroad' : 'card.capPulse',
                  )}
                </p>
                <p>
                  {t(pool.referenceFx ? 'card.fxAssumed' : 'caps.bankBasis')}
                </p>
                <p>
                  {t('caps.sources', { count: pool.statements.length })}
                  {pool.observedThrough && (
                    <>
                      {' '}
                      ·{' '}
                      {t('caps.observed', {
                        from: date(pool.observedFrom!),
                        to: date(pool.observedThrough),
                      })}
                    </>
                  )}
                </p>
                {!pool.observedThrough && <p>{t('caps.noTransactions')}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
