import type { ResultPool } from '@/application/results/pools'
import type { ResultDetailsRequest } from '@/application/results/details'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/i18n/use-i18n'

export function RewardCaps({
  pools,
  onDetails,
}: {
  pools: readonly ResultPool[]
  onDetails: (request: ResultDetailsRequest) => void
}) {
  const { t, number, date } = useI18n()
  return (
    <section className="space-y-3" aria-label={t('card.caps')} data-period-caps>
      <h3 className="font-semibold">{t('card.caps')}</h3>
      <p className="text-xs text-muted-foreground">{t('rewards.imported')}</p>
      {!pools.length && (
        <p className="text-muted-foreground">{t('rewards.noPool')}</p>
      )}
      <div className="grid items-start gap-3 md:grid-cols-2">
        {pools.map((pool) => (
          <Card
            key={pool.key}
            size="sm"
            data-cap-key={pool.key}
            tabIndex={-1}
            className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CardContent className="space-y-3 text-xs">
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
              <p>
                {pool.relatedCards
                  .map((card) => `${t(`card.${card.role}`)} · ${card.lastFour}`)
                  .join(' / ')}{' '}
                · {t(pool.shared ? 'caps.shared' : 'caps.independent')}
              </p>
              <p className="text-muted-foreground">
                {t(pool.tier === 'abroad' ? 'rewards.annual' : 'rewards.half', {
                  period: pool.period,
                })}{' '}
                · {t('caps.asOf', { date: date(pool.asOf) })}
              </p>
              <Progress
                value={
                  pool.usedMinor === null
                    ? null
                    : (pool.usedMinor / pool.capMinor) * 100
                }
                aria-label={`${t(`rewards.${pool.tier}`)} ${pool.period}`}
              />
              <dl className="grid gap-2 tabular-nums sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{t('caps.used')}</dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {pool.usedMinor === null
                      ? t('rewards.pending')
                      : number(pool.usedMinor / 100)}{' '}
                    / {number(pool.capMinor / 100)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t('rewards.remaining')}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {pool.remainingMinor === null
                      ? t('rewards.pending')
                      : number(pool.remainingMinor / 100)}
                  </dd>
                </div>
              </dl>
              <p className="text-muted-foreground">
                {t(pool.tier === 'abroad' ? 'card.capAbroad' : 'card.capPulse')}
              </p>
              <p className="text-muted-foreground">
                {t(pool.referenceFx ? 'card.fxAssumed' : 'caps.bankBasis')}
              </p>
              <p className="text-muted-foreground">
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
              {!pool.observedThrough && (
                <p className="text-muted-foreground">
                  {t('caps.noTransactions')}
                </p>
              )}
              <Button
                variant="link"
                className="h-auto max-w-full p-0 text-left whitespace-normal"
                onClick={() =>
                  onDetails({
                    tab: 'transactions',
                    component: pool.tier,
                    poolKey: pool.key,
                  })
                }
                aria-haspopup="dialog"
              >
                {t('caps.transactions')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
