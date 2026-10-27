import { RiBankCardLine } from '@remixicon/react'
import type { WorkspaceView } from '@/application/session/selectors'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/i18n/use-i18n'

export function RewardBreakdown({
  cards,
}: {
  cards: WorkspaceView['rewardCards']
}) {
  const { t, money, number, rc, date } = useI18n()
  return (
    <section
      data-reward-breakdown
      className="space-y-4"
      aria-labelledby="card-rewards-title"
    >
      <div className="space-y-1">
        <h2
          id="card-rewards-title"
          className="text-xl font-semibold tracking-tight"
        >
          {t('cashback.breakdown')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('cashback.breakdownHint')}
        </p>
      </div>
      {cards.length === 0 ? (
        <Card>
          <CardContent>
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RiBankCardLine aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>{t('card.empty')}</EmptyTitle>
                <EmptyDescription>{t('card.emptyBody')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-2">
          {cards.map((card) => (
            <Card key={card.cardId} data-reward-card>
              <CardHeader className="border-b">
                <CardDescription>{t('card.product')}</CardDescription>
                <CardTitle>
                  <h3 className="flex flex-wrap items-center gap-2 text-lg">
                    <span>
                      {t(`card.${card.card.role}`)} · ·· {card.card.lastFour}
                    </span>
                    <Badge variant="outline">
                      {card.currencies.join(' / ')}
                    </Badge>
                  </h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-2xl font-semibold tabular-nums">
                    {rc(card.totalMicroRc)}
                  </p>
                  <p className="text-muted-foreground">
                    {t('cashback.reference')}{' '}
                    <span className="font-medium text-foreground tabular-nums">
                      {card.cnyMinor === null
                        ? t('rewards.fxMissing')
                        : money(card.cnyMinor)}
                    </span>
                  </p>
                </div>
                <div className="space-y-1 text-muted-foreground">
                  {card.coverage && (
                    <p>
                      {t('card.coverage', {
                        count: card.statementCount,
                        from: date(card.coverage.from),
                        to: date(card.coverage.to),
                      })}
                    </p>
                  )}
                  <p>
                    {t('card.transactions', {
                      count: card.transactionCount,
                      purchases: card.purchaseCount,
                    })}
                  </p>
                </div>
                <dl className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-4">
                  <dt className="text-muted-foreground">{t('card.spend')}</dt>
                  <dd className="flex flex-wrap gap-x-4 gap-y-1 font-mono tabular-nums">
                    {card.spend.map((amount) => (
                      <span key={amount.currency}>
                        {money(amount.minor, amount.currency)}
                      </span>
                    ))}
                  </dd>
                </dl>
                <div className="grid gap-5 sm:grid-cols-3">
                  {card.tiers.map(
                    ({ tier, rateBasisPoints, eligibleSpend }) => (
                      <section
                        key={tier}
                        className="grid grid-cols-2 items-start gap-x-3 gap-y-2 border-b pb-4 last:border-b-0 sm:block sm:space-y-2 sm:border-0 sm:pb-0"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-medium">
                            {t(`rewards.${tier}`)}
                          </h4>
                          <Badge variant="secondary">
                            {number(rateBasisPoints / 100)}%
                          </Badge>
                        </div>
                        <p className="text-right font-mono text-base font-medium tabular-nums sm:text-left">
                          {rc(card[`${tier}MicroRc`])}
                        </p>
                        <p className="text-muted-foreground">
                          {t('card.eligible')}
                        </p>
                        <ul className="space-y-1 text-right font-mono text-muted-foreground tabular-nums sm:text-left">
                          {eligibleSpend.map((amount) => (
                            <li key={amount.currency}>
                              {money(amount.minor, amount.currency)}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ),
                  )}
                </div>
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">{t('card.caps')}</h4>
                  {card.pools.length === 0 && (
                    <p className="text-muted-foreground">
                      {t('rewards.noPool')}
                    </p>
                  )}
                  {card.pools.some((pool) => pool.shared) && (
                    <p className="text-muted-foreground">
                      {t('card.sharedPool')}
                    </p>
                  )}
                  {card.pools.map((pool) => (
                    <section key={pool.key} className="space-y-2">
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-medium">
                          {t(`rewards.${pool.tier}`)}
                        </p>
                        <p className="text-muted-foreground">
                          {t(
                            pool.tier === 'abroad'
                              ? 'rewards.annual'
                              : 'rewards.half',
                            { period: pool.period },
                          )}
                        </p>
                      </div>
                      <Progress
                        value={
                          pool.usedMinor === null
                            ? null
                            : (pool.usedMinor / pool.capMinor) * 100
                        }
                        aria-label={
                          t(`rewards.${pool.tier}`) + ' ' + pool.period
                        }
                      />
                      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 tabular-nums">
                        <p>
                          {t('rewards.used', {
                            used:
                              pool.usedMinor === null
                                ? t('rewards.pending')
                                : number(pool.usedMinor / 100),
                            cap: number(pool.capMinor / 100),
                          })}
                        </p>
                        <p>
                          {t('rewards.remaining')}{' '}
                          {pool.remainingMinor === null
                            ? t('rewards.pending')
                            : number(pool.remainingMinor / 100)}
                        </p>
                      </div>
                      <p className="text-muted-foreground">
                        {t(
                          pool.tier === 'abroad'
                            ? 'card.capAbroad'
                            : 'card.capPulse',
                        )}
                      </p>
                    </section>
                  ))}
                </div>
                <div className="space-y-1 text-muted-foreground">
                  {card.totalMicroRc === null && (
                    <p>
                      {t('cashback.known', { amount: rc(card.knownMicroRc) })}
                    </p>
                  )}
                  {card.assumptions.includes(
                    'assumption.abroad-five-times',
                  ) && <p>{t('card.enrollmentAssumed')}</p>}
                  {card.assumptions.includes('assumption.pool-unconfirmed') && (
                    <p>{t('rewards.poolUnconfirmed')}</p>
                  )}
                  {card.assumptions.includes('assumption.cap-reference-fx') && (
                    <p>{t('card.fxAssumed')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
