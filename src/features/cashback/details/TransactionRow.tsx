import { RiArrowRightSLine } from '@remixicon/react'
import type { ResultTransaction } from '@/application/results/transactions'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'

export function TransactionRow({
  entry,
  cardLabel,
  onSelect,
}: {
  entry: Pick<ResultTransaction, 'row' | 'reward'>
  cardLabel?: string
  onSelect: (id: string) => void
}) {
  const { t, date, money, rcSummary } = useI18n()
  const { row, reward } = entry
  return (
    <Button
      variant="ghost"
      className="h-full w-full flex-col items-stretch justify-start gap-1.5 border border-border bg-background p-2.5 text-left whitespace-normal"
      data-transaction-id={row.id}
      onClick={() => onSelect(row.id)}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-xs font-normal text-muted-foreground">
          {date(row.transactionDate)}
          {cardLabel && ` · ${cardLabel}`}
        </span>
        <RiArrowRightSLine
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </span>
      <span className="min-w-0 break-words text-sm font-medium">
        {row.description}
      </span>
      <span className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="min-w-0 text-xs font-normal text-muted-foreground">
          <span className="sr-only">{t('details.account')} · </span>
          <span className="break-words tabular-nums">
            {money(row.account.minor, row.account.currency)}
          </span>
        </span>
        <span className="max-w-36 text-right tabular-nums">
          <span className="sr-only">{t('details.transactionReward')}</span>
          <span className="block text-sm font-semibold">
            {rcSummary(reward.microRc)}
          </span>
          {reward.microRc === null && (
            <span className="mt-1 block text-xs font-normal">
              {t('rewards.knownPortion', {
                amount: rcSummary(reward.knownMicroRc),
              })}
            </span>
          )}
        </span>
      </span>
    </Button>
  )
}
