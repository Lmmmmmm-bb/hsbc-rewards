import type { ResultScope } from '@/application/results/scope'
import {
  transactionPage,
  type TransactionFilter,
} from '@/application/results/transactions'
import { TransactionRow } from './TransactionRow'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useI18n } from '@/i18n/use-i18n'
import { DetailPagination } from './DetailPagination'
import { TransactionFilters } from './TransactionFilters'

export function TransactionList({
  scope,
  cardId,
  filter,
  page,
  onFilter,
  onCard,
  onPage,
  onSelect,
  resultVersion,
}: {
  scope: ResultScope
  cardId: string | null
  filter: TransactionFilter
  page: number
  onFilter: (filter: TransactionFilter) => void
  onCard: (id: string | null) => void
  onPage: (page: number) => void
  onSelect: (id: string) => void
  resultVersion: string
}) {
  const { t } = useI18n()
  const { entries, count, pages, current } = transactionPage(
    scope,
    filter,
    cardId,
    page,
  )
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-3 text-sm"
      data-detail-transactions
    >
      <TransactionFilters
        scope={scope}
        cardId={cardId}
        filter={filter}
        onCard={onCard}
        onFilter={onFilter}
      />
      <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-primary">
          {t('details.transactionRecords')}
        </h3>
        <p role="status" className="text-xs text-muted-foreground">
          {t('details.recordCount', { count })}
        </p>
      </div>
      <ScrollArea
        key={JSON.stringify([resultVersion, current, cardId, filter])}
        className="min-h-0 flex-1 border-y"
        data-details-scroll
        viewportProps={{
          role: 'region',
          'aria-label': t('details.transactionRecords'),
          tabIndex: 0,
          className: 'overscroll-y-contain',
        }}
      >
        <div className="pr-3">
          {!count && <p className="py-6">{t('details.empty')}</p>}
          <ul className="divide-y">
            {entries.map((entry) => (
              <li key={entry.row.id}>
                <TransactionRow
                  entry={entry}
                  cardLabel={
                    scope.cards.find((card) => card.cardId === entry.row.cardId)
                      ?.card.lastFour
                  }
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>
      <div className="shrink-0" data-detail-pagination>
        <DetailPagination current={current} pages={pages} onPage={onPage} />
      </div>
    </div>
  )
}
