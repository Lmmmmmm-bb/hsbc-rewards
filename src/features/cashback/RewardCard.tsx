import type { ResultDetailsRequest } from '@/application/results/details'
import { Button } from '@/components/ui/button'
import { RiBankCardLine } from '@remixicon/react'
import type { WorkspaceView } from '@/application/session/selectors'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/i18n/use-i18n'
import { RewardQuality } from './RewardQuality'
import { RewardReasons } from './RewardReasons'
import { cn } from '@/lib/utils'

export function RewardCard({
  card,
  onDetails,
}: {
  card: WorkspaceView['rewardCards'][number]
  onDetails: (request: ResultDetailsRequest) => void
}) {
  const { t, money, number, rcSummary, rewardNumber } = useI18n()
  const amount = card.totalMicroRc ?? card.knownMicroRc
  const capNotices = card.pools.filter(
    (pool) => pool.remainingMinor === 0 || pool.remainingMinor === null,
  )

  return (
    <Card data-reward-card className="@container/reward min-w-0">
      <CardHeader className="grid min-w-0 gap-3 @md/reward:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col items-start gap-2">
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <RiBankCardLine
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            {t('card.product')}
          </p>
          <h3 className="text-base font-semibold">
            {t(`card.${card.card.role}`)} · {card.card.lastFour}
          </h3>
          <Badge variant="outline">{card.currencies.join(' / ')}</Badge>
        </div>
        <div className="flex min-w-0 flex-col gap-1 @md/reward:items-end @md/reward:text-right">
          <p className="text-xs text-muted-foreground">
            {t(
              card.totalMicroRc === null
                ? 'cashback.knownHeading'
                : 'card.reward',
            )}
          </p>
          <p
            className={cn(
              'flex max-w-full flex-wrap items-baseline gap-x-2 font-semibold tracking-tight text-primary tabular-nums',
              rewardNumber(amount).length > 12
                ? 'text-xl @md/reward:text-2xl'
                : 'text-3xl',
            )}
          >
            <span className="whitespace-nowrap">{rewardNumber(amount)}</span>
            <span className="text-sm font-medium">RC</span>
          </p>
          <p className="text-xs text-muted-foreground">
            ≈{' '}
            {card.cnyMinor === null
              ? t('rewards.fxMissing')
              : money(card.cnyMinor)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        <dl className="grid grid-cols-1 gap-4 @lg/reward:grid-cols-3">
          {card.tiers.map(
            ({ tier, rateBasisPoints, eligibleSpend, knownMicroRc }) => (
              <div
                key={tier}
                className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-2 @lg/reward:flex-col @lg/reward:items-start @lg/reward:justify-start"
              >
                <dt className="text-xs text-muted-foreground">
                  {t(`rewards.${tier}`)}{' '}
                  <span className="whitespace-nowrap">
                    {number(rateBasisPoints / 100)}%
                  </span>
                </dt>
                <dd className="text-base font-semibold whitespace-nowrap tabular-nums">
                  {rcSummary(card[`${tier}MicroRc`])}
                </dd>
                {card[`${tier}MicroRc`] === null && knownMicroRc > 0 && (
                  <dd className="w-full text-xs text-muted-foreground">
                    {t('rewards.knownPortion', {
                      amount: rcSummary(knownMicroRc),
                    })}
                  </dd>
                )}
                <dd className="flex w-full flex-col gap-1 text-xs text-muted-foreground">
                  {t('card.eligible')}
                  <ul className="flex flex-wrap gap-x-3 gap-y-1 @lg/reward:flex-col">
                    {eligibleSpend.map((amount) => (
                      <li
                        key={amount.currency}
                        className="whitespace-nowrap tabular-nums"
                      >
                        {amount.minor === null
                          ? `${amount.currency} · ${t('rewards.pending')}`
                          : money(amount.minor, amount.currency)}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ),
          )}
        </dl>
        <div className="flex flex-col gap-2">
          {capNotices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {capNotices.map((pool) => (
                <Badge key={pool.key} variant="outline">
                  {t(`rewards.${pool.tier}`)} ·{' '}
                  {t(
                    pool.remainingMinor === null
                      ? 'caps.pending'
                      : 'caps.exhausted',
                  )}
                </Badge>
              ))}
            </div>
          )}
          <RewardQuality quality={card.quality} compact />
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {t('card.transactions', {
                count: card.transactionCount,
                purchases: card.purchaseCount,
              })}
            </span>
            {card.spend.map((amount) => (
              <span
                key={amount.currency}
                className="whitespace-nowrap tabular-nums"
              >
                {money(amount.minor, amount.currency)}
              </span>
            ))}
          </p>
        </div>
        {card.transactionCount > 0 && (
          <RewardReasons
            tiers={card.tiers}
            onReason={(component, reason) =>
              onDetails({
                cardId: card.cardId,
                component,
                reason,
              })
            }
          />
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDetails({ cardId: card.cardId })}
          aria-haspopup="dialog"
        >
          {t('details.card')}
        </Button>
      </CardFooter>
    </Card>
  )
}
