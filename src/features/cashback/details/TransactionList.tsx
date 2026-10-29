import type { ResultScope } from '@/application/results/scope'
import {
  transactionPage,
  type TransactionFilter,
  type TransactionFlag,
} from '@/application/results/transactions'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'
import { reasonMessage } from '../reason-messages'

export function TransactionList({
  scope,
  cardId,
  filter,
  page,
  onFilter,
  onCard,
  onPage,
  onSelect,
}: {
  scope: ResultScope
  cardId: string | null
  filter: TransactionFilter
  page: number
  onFilter: (filter: TransactionFilter) => void
  onCard: (id: string | null) => void
  onPage: (page: number) => void
  onSelect: (id: string) => void
}) {
  const { t, date, money, rcSummary, number } = useI18n()
  const { entries, count, pages, current } = transactionPage(
    scope,
    filter,
    cardId,
    page,
  )
  const flags: readonly TransactionFlag[] = [
    'pending',
    'uncertain',
    'excluded',
    'capped',
  ]
  return (
    <div className="space-y-4" data-detail-transactions>
      <div className="space-y-2">
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label={t('cashback.cards')}
        >
          <Button
            size="sm"
            variant="outline"
            className="aria-pressed:border-primary aria-pressed:bg-primary/5 aria-pressed:text-primary"
            aria-pressed={!cardId}
            onClick={() => onCard(null)}
          >
            {t('details.allCards')}
          </Button>
          {scope.cards.map(({ card }) => (
            <Button
              key={card.id}
              size="sm"
              variant="outline"
              className="aria-pressed:border-primary aria-pressed:bg-primary/5 aria-pressed:text-primary"
              aria-pressed={cardId === card.id}
              onClick={() => onCard(card.id)}
            >
              {t(`card.${card.role}`)} · {card.lastFour}
            </Button>
          ))}
        </div>
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label={t('details.component')}
        >
          <Button
            size="sm"
            variant="outline"
            className="aria-pressed:border-primary aria-pressed:bg-primary/5 aria-pressed:text-primary"
            aria-pressed={!filter.component}
            onClick={() => onFilter({ ...filter, component: undefined })}
          >
            {t('details.allComponents')}
          </Button>
          {(['basic', 'abroad', 'pulse'] as const).map((component) => (
            <Button
              key={component}
              size="sm"
              variant="outline"
              className="aria-pressed:border-primary aria-pressed:bg-primary/5 aria-pressed:text-primary"
              aria-pressed={filter.component === component}
              onClick={() => onFilter({ ...filter, component })}
            >
              {t(`rewards.${component}`)}
            </Button>
          ))}
        </div>
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label={t('details.status')}
        >
          <Button
            size="sm"
            variant="outline"
            className="aria-pressed:border-primary aria-pressed:bg-primary/5 aria-pressed:text-primary"
            aria-pressed={!filter.flags?.length}
            onClick={() => onFilter({ ...filter, flags: undefined })}
          >
            {t('details.allStatuses')}
          </Button>
          {flags.map((flag) => (
            <Button
              key={flag}
              size="sm"
              variant="outline"
              className="aria-pressed:border-primary aria-pressed:bg-primary/5 aria-pressed:text-primary"
              aria-pressed={filter.flags?.includes(flag) ?? false}
              onClick={() => onFilter({ ...filter, flags: [flag] })}
            >
              {t(`details.flag.${flag}`)}
            </Button>
          ))}
        </div>
        {(filter.reason || filter.warning || filter.poolKey) && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span>
              {filter.reason
                ? t(reasonMessage(filter.reason))
                : t(
                    filter.poolKey
                      ? 'details.poolFilter'
                      : 'details.issueFilter',
                  )}
            </span>
            <Button
              variant="link"
              size="sm"
              onClick={() =>
                onFilter({
                  ...filter,
                  reason: undefined,
                  warning: undefined,
                  poolKey: undefined,
                })
              }
            >
              {t('details.clearReason')}
            </Button>
          </div>
        )}
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {t('details.page', { page: current + 1, pages, count })}
      </p>
      {!count && <p>{t('details.empty')}</p>}
      <ul className="divide-y">
        {entries.map(({ row, reward }) => (
          <li key={row.id}>
            <Button
              variant="ghost"
              className="h-auto w-full items-start justify-between gap-3 py-3 text-left whitespace-normal"
              data-transaction-id={row.id}
              onClick={() => onSelect(row.id)}
            >
              <span className="min-w-0 space-y-1">
                <span className="block text-xs text-muted-foreground">
                  {date(row.transactionDate)} ·{' '}
                  {
                    scope.cards.find((card) => card.cardId === row.cardId)?.card
                      .lastFour
                  }
                </span>
                <span className="block break-all">{row.description}</span>
                <span className="block text-xs">
                  {money(row.account.minor, row.account.currency)}
                </span>
              </span>
              <span className="shrink-0 text-right tabular-nums">
                <span className="block">{rcSummary(reward.microRc)}</span>
                {reward.microRc === null && (
                  <span className="block text-xs">
                    {t('rewards.knownPortion', {
                      amount: rcSummary(reward.knownMicroRc),
                    })}
                  </span>
                )}
              </span>
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={current === 0}
          onClick={() => onPage(current - 1)}
        >
          {t('details.previous')}
        </Button>
        <span className="text-xs tabular-nums">
          {number(current + 1, 0)} / {number(pages, 0)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={current + 1 >= pages}
          onClick={() => onPage(current + 1)}
        >
          {t('details.next')}
        </Button>
      </div>
    </div>
  )
}
