import { useId } from 'react'
import { RiCheckLine } from '@remixicon/react'
import type { ResultScope } from '@/application/results/scope'
import type {
  TransactionFilter,
  TransactionFlag,
} from '@/application/results/transactions'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/use-i18n'
import { reasonMessage } from '../reason-messages'

type Choice = { value: string; label: string }
function FilterSelect({
  label,
  value,
  choices,
  onChange,
  className,
}: {
  label: string
  value: string
  choices: Choice[]
  onChange: (value: string) => void
  className?: string
}) {
  const id = useId()
  const selected = choices.find((choice) => choice.value === value)?.label
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={id} className="block text-xs text-muted-foreground">
        {label}
      </label>
      <Select
        value={value}
        items={choices}
        onValueChange={(value) => {
          if (value !== null) onChange(value)
        }}
      >
        <SelectTrigger
          id={id}
          aria-label={label}
          title={selected}
          className="w-full min-w-0"
        >
          <SelectValue className="min-w-0">
            <span className="truncate">{selected}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" className="min-w-52">
          <SelectGroup>
            {choices.map((choice) => (
              <SelectItem key={choice.value} value={choice.value}>
                {choice.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export function TransactionFilters({
  scope,
  cardId,
  filter,
  onCard,
  onFilter,
}: {
  scope: ResultScope
  cardId: string | null
  filter: TransactionFilter
  onCard: (id: string | null) => void
  onFilter: (filter: TransactionFilter) => void
}) {
  const { t } = useI18n()
  return (
    <div
      className="grid shrink-0 grid-cols-2 items-end gap-2 border bg-muted/30 p-2.5 @2xl/details:grid-cols-3"
      data-detail-filters
      role="group"
      aria-label={t('details.filters')}
    >
      <FilterSelect
        label={t('cashback.cards')}
        className="col-span-2 @2xl/details:col-span-1"
        value={cardId ?? 'all'}
        choices={[
          { value: 'all', label: t('details.allCards') },
          ...scope.cards.map(({ card }) => ({
            value: card.id,
            label: `${t(`card.${card.role}`)} · ${card.lastFour}`,
          })),
        ]}
        onChange={(value) => onCard(value === 'all' ? null : value)}
      />
      <FilterSelect
        label={t('details.component')}
        value={filter.component ?? 'all'}
        choices={[
          { value: 'all', label: t('details.allComponents') },
          ...(['basic', 'abroad', 'pulse'] as const).map((value) => ({
            value,
            label: t(`rewards.${value}`),
          })),
        ]}
        onChange={(value) =>
          onFilter({
            ...filter,
            component:
              value === 'all'
                ? undefined
                : (value as TransactionFilter['component']),
          })
        }
      />
      <FilterSelect
        label={t('details.status')}
        value={filter.flags?.[0] ?? 'all'}
        choices={[
          { value: 'all', label: t('details.allStatuses') },
          ...(['pending', 'uncertain', 'excluded', 'capped'] as const).map(
            (value) => ({ value, label: t(`details.flag.${value}`) }),
          ),
        ]}
        onChange={(value) =>
          onFilter({
            ...filter,
            flags: value === 'all' ? undefined : [value as TransactionFlag],
          })
        }
      />
      <div className="col-span-full">
        <Button
          variant="outline"
          size="sm"
          aria-pressed={!!filter.hideRefundsAndRepayments}
          className="h-auto min-h-8 whitespace-normal aria-pressed:bg-muted"
          onClick={() => onFilter({
            ...filter,
            hideRefundsAndRepayments: !filter.hideRefundsAndRepayments,
          })}
        >
          {filter.hideRefundsAndRepayments && <RiCheckLine data-icon="inline-start" aria-hidden="true" />}
          {t('details.hideRefundsAndRepayments')}
        </Button>
      </div>
      {(filter.reason || filter.warning || filter.reconciliation) && (
        <div className="col-span-full flex flex-wrap items-center gap-x-2 text-xs">
          <span>
            {filter.reason
              ? t(reasonMessage(filter.reason))
              : filter.reconciliation
                ? t(`details.filter.${filter.reconciliation}`)
                : t('details.issueFilter')}
          </span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() =>
              onFilter({
                ...filter,
                reason: undefined,
                warning: undefined,
                reconciliation: undefined,
              })
            }
          >
            {t('details.clearReason')}
          </Button>
        </div>
      )}
    </div>
  )
}
