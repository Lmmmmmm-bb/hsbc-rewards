import type { ResultDetailsRequest } from '@/application/results/details'
import { Button } from '@/components/ui/button'
import { RiBankCardLine } from '@remixicon/react'
import type { WorkspaceView } from '@/application/session/selectors'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/i18n/use-i18n'
import { RewardQuality } from './RewardQuality'
import { RewardReasons } from './RewardReasons'
import { cardAssumptions } from '@/application/results/assumptions'
import { AssumptionNotes } from './AssumptionNotes'
import { RewardCaps } from './RewardCaps'

export function RewardCard({
  card,
  onDetails,
}: {
  card: WorkspaceView['rewardCards'][number]
  onDetails: (request: ResultDetailsRequest) => void
}) {
  const { t, money, number, rcSummary, rewardNumber } = useI18n()
  const amount = card.totalMicroRc ?? card.knownMicroRc


  return (
    <Card data-reward-card>
      <CardContent className="@container/reward space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <RiBankCardLine
                className="size-4 text-primary"
                aria-hidden="true"
              />
              {t('card.product')}
            </p>
            <h3 className="text-base font-semibold">
              {t(`card.${card.card.role}`)} · ·· {card.card.lastFour}
            </h3>
            <Badge variant="outline">{card.currencies.join(' / ')}</Badge>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-xs text-muted-foreground">
              {t(
                card.totalMicroRc === null
                  ? 'cashback.knownHeading'
                  : 'card.reward',
              )}
            </p>
            <p className="break-words text-3xl font-semibold tracking-tight text-primary tabular-nums">
              {rewardNumber(amount)}
              <span className="ml-1 text-sm font-medium">RC</span>
            </p>
            <p className="text-xs text-muted-foreground">
              ≈{' '}
              {card.cnyMinor === null
                ? t('rewards.fxMissing')
                : money(card.cnyMinor)}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-3">
          {card.tiers.map(
            ({ tier, rateBasisPoints, eligibleSpend, knownMicroRc }) => (
              <div key={tier} className="min-w-0 space-y-1">
                <dt className="text-xs text-muted-foreground">
                  {t(`rewards.${tier}`)}{' '}
                  <span className="whitespace-nowrap">
                    {number(rateBasisPoints / 100)}%
                  </span>
                </dt>
                <dd className="break-words text-base font-semibold tabular-nums">
                  {rcSummary(card[`${tier}MicroRc`])}
                </dd>
                {card[`${tier}MicroRc`] === null && knownMicroRc > 0 && (
                  <dd className="text-xs text-muted-foreground">
                    {t('rewards.knownPortion', { amount: rcSummary(knownMicroRc) })}
                  </dd>
                )}
                <dd className="text-xs text-muted-foreground">
                  {t('card.eligible')}
                  <ul>
                    {eligibleSpend.map((amount) => (
                      <li key={amount.currency} className="tabular-nums">
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
        <RewardCaps pools={card.pools} />
        <RewardQuality quality={card.quality} compact onDetails={(request) => onDetails({ ...request, cardId: card.cardId })} />
        <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          <span>
            {t('card.transactions', {
              count: card.transactionCount,
              purchases: card.purchaseCount,
            })}
          </span>
          {card.spend.map((amount) => (
            <span key={amount.currency}>
              {money(amount.minor, amount.currency)}
            </span>
          ))}
        </p>
        {card.transactionCount > 0 && (
          <RewardReasons tiers={card.tiers} onReason={(component, reason) => onDetails({ tab: 'transactions', cardId: card.cardId, component, reason })} />
        )}
        <Button variant="outline" size="sm" onClick={() => onDetails({ tab: 'transactions', cardId: card.cardId })} aria-haspopup="dialog">{t('details.card')}</Button>
        <AssumptionNotes items={cardAssumptions(card)} />
      </CardContent>
    </Card>
  )
}
