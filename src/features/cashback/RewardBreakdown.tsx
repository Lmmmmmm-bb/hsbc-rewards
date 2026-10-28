import type { WorkspaceView } from '@/application/session/selectors'
import { Card, CardContent } from '@/components/ui/card'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import { useI18n } from '@/i18n/use-i18n'
import { RewardCard } from './RewardCard'
import { ResultReveal } from './ResultReveal'
import { StatementIllustration } from './StatementIllustration'

export function RewardBreakdown({
  cards,
  period,
  revealKey,
}: {
  cards: WorkspaceView['rewardCards']
  period?: WorkspaceView['periods'][number]
  revealKey: string
}) {
  const { t, rc } = useI18n()
  return (
    <section
      data-reward-breakdown
      data-period={period?.id}
      className="space-y-3"
      aria-label={
        period
          ? t(period.half === 1 ? 'period.h1' : 'period.h2', {
              year: period.year,
            })
          : t('cashback.breakdown')
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {period
            ? `${t(period.half === 1 ? 'period.h1' : 'period.h2', { year: period.year })} · ${t('cashback.breakdown')}`
            : t('cashback.breakdown')}
        </h2>
        {period && (
          <p className="text-sm font-semibold tabular-nums">
            {rc(period.totalRewardMicroRc)}
          </p>
        )}
      </div>
      {cards.length === 0 ? (
        <Card>
          <CardContent>
            <Empty className="py-4">
              <EmptyHeader>
                <EmptyMedia>
                  <StatementIllustration />
                </EmptyMedia>
                <EmptyTitle>{t('card.empty')}</EmptyTitle>
                <EmptyDescription>{t('card.emptyBody')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            cards.length === 1
              ? 'grid items-start gap-4'
              : 'grid items-start gap-4 xl:grid-cols-2'
          }
        >
          {cards.map((card, index) => (
            <ResultReveal
              key={card.cardId}
              trigger={revealKey}
              delay={Math.min(index, 4) * 0.04}
              className="min-w-0"
            >
              <RewardCard card={card} />
            </ResultReveal>
          ))}
        </div>
      )}
    </section>
  )
}
