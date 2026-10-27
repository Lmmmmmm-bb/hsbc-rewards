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
import { useI18n } from '@/i18n/use-i18n'
import { RewardQuality } from './RewardQuality'
import { RewardReasons } from './RewardReasons'
import { RewardCaps } from './RewardCaps'

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
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          {cards.map((card) => (
            <Card
              key={card.cardId}
              data-reward-card
              className={cards.length === 1 ? 'xl:col-span-2' : undefined}
            >
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
              <CardContent className="@container/reward space-y-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    {card.totalMicroRc === null && (
                      <p className="text-muted-foreground">
                        {t('cashback.knownHeading')}
                      </p>
                    )}
                    <p className="break-words font-mono text-2xl font-semibold tabular-nums">
                      {rc(card.totalMicroRc ?? card.knownMicroRc)}
                    </p>
                  </div>
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
                  {card.assumptions.includes(
                    'assumption.enrollment-period-ignored',
                  ) && <p>{t('rewards.enrollmentPeriodIgnored')}</p>}
                  {card.assumptions.includes('card.role-conflict') && (
                    <p>{t('rewards.roleConflict')}</p>
                  )}
                  {card.assumptions.includes('card.pool-conflict') && (
                    <p>{t('rewards.poolConflict')}</p>
                  )}
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
                <RewardQuality quality={card.quality} />
                <div className="grid gap-5 sm:grid-cols-3">
                  {card.tiers.map(
                    ({
                      tier,
                      rateBasisPoints,
                      eligibleSpend,
                      knownMicroRc,
                    }) => (
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
                        {card[`${tier}MicroRc`] === null &&
                          knownMicroRc > 0 && (
                            <p className="col-span-2 text-muted-foreground">
                              {t('rewards.knownPortion', {
                                amount: rc(knownMicroRc),
                              })}
                            </p>
                          )}
                        <p className="text-muted-foreground">
                          {t('card.eligible')}
                        </p>
                        <ul className="space-y-1 text-right font-mono text-muted-foreground tabular-nums sm:text-left">
                          {eligibleSpend.map((amount) => (
                            <li key={amount.currency}>
                              {amount.minor === null
                                ? `${amount.currency} · ${t('rewards.pending')}`
                                : money(amount.minor, amount.currency)}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ),
                  )}
                </div>
                <RewardCaps pools={card.pools} />
                {card.transactionCount > 0 && (
                  <RewardReasons tiers={card.tiers} />
                )}
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
