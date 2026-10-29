import type { ResultScope } from '@/application/results/scope'
import {
  transactionPage,
  type TransactionFilter,
} from '@/application/results/transactions'
import { TransactionRow } from './TransactionRow'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card
        size="sm"
        className="min-h-0 flex-1 gap-0 border py-0 ring-0"
        data-transaction-panel
      >
        <CardHeader className="flex shrink-0 flex-row flex-wrap items-baseline justify-between gap-2 border-b px-3 py-2">
          <CardTitle>
            <h3>{t('details.transactionRecords')}</h3>
          </CardTitle>
          <p role="status" className="text-xs text-muted-foreground">
            {t('details.recordCount', { count })}
          </p>
        </CardHeader>
        <ScrollArea
          key={JSON.stringify([resultVersion, current, cardId, filter])}
          className="min-h-0 flex-1"
          data-details-scroll
          viewportProps={{
            role: 'region',
            'aria-label': t('details.transactionRecords'),
            tabIndex: 0,
            className: 'overscroll-y-contain',
          }}
        >
          <div className="p-2 pr-3">
            {!count && <p className="py-6">{t('details.empty')}</p>}
            <ul className="grid gap-2 sm:grid-cols-2" data-transaction-grid>
              {entries.map((entry) => (
                <li key={entry.row.id} className="min-w-0">
                  <TransactionRow
                    entry={entry}
                    cardLabel={
                      scope.cards.find(
                        (card) => card.cardId === entry.row.cardId,
                      )?.card.lastFour
                    }
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </Card>
      <div className="shrink-0" data-detail-pagination>
        <DetailPagination current={current} pages={pages} onPage={onPage} />
      </div>
    </div>
  )
}
