import type { ResultScope } from '@/application/results/scope'
import {
  transactionPage,
  type TransactionFilter,
  type TransactionFlag,
} from '@/application/results/transactions'
import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { RiArrowDownSLine, RiFilter3Line } from '@remixicon/react'
import { TransactionRow } from './TransactionRow'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/use-i18n'
import { DetailPagination } from './DetailPagination'
import { reasonMessage } from '../reason-messages'

function FilterGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-start">
      <p className="text-xs font-medium text-muted-foreground sm:pt-1">
        {label}
      </p>
      <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  )
}

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
  const { t } = useI18n()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersId = useId()
  const hasFilters = Boolean(
    cardId ||
      filter.component ||
      filter.flags?.length ||
      filter.reason ||
      filter.warning,
  )
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
      <div className="border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2 sm:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-2 p-0"
            aria-expanded={filtersOpen}
            aria-controls={filtersId}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <RiFilter3Line aria-hidden="true" />
            {t('details.filters')}
            <RiArrowDownSLine
              aria-hidden="true"
              className={filtersOpen ? 'rotate-180' : ''}
            />
          </Button>
          {hasFilters && (
            <Badge variant="outline">{t('details.filtersApplied')}</Badge>
          )}
        </div>
        <div
          id={filtersId}
          className={cn(
            'space-y-3',
            filtersOpen ? 'pt-3 sm:pt-0' : 'hidden sm:block',
          )}
        >
          <FilterGroup label={t('cashback.cards')}>
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
          </FilterGroup>
          <FilterGroup label={t('details.component')}>
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
          </FilterGroup>
          <FilterGroup label={t('details.status')}>
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
          </FilterGroup>
          {(filter.reason || filter.warning) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span>
                {filter.reason
                  ? t(reasonMessage(filter.reason))
                  : t('details.issueFilter')}
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={() =>
                  onFilter({
                    ...filter,
                    reason: undefined,
                    warning: undefined,
                  })
                }
              >
                {t('details.clearReason')}
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-primary">
          {t('details.transactionRecords')}
        </h3>
        <p role="status" className="text-xs text-muted-foreground">
          {t('details.page', { page: current + 1, pages, count })}
        </p>
      </div>
      {!count && <p>{t('details.empty')}</p>}
      <ul className="divide-y border-y">
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
      <DetailPagination current={current} pages={pages} onPage={onPage} />
    </div>
  )
}
