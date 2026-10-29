import { RiArrowRightSLine } from '@remixicon/react'
import type { ResultTransaction } from '@/application/results/transactions'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'

export function TransactionRow({
  entry,
  cardLabel,
  source = false,
  onSelect,
}: {
  entry: Pick<ResultTransaction, 'row' | 'reward'>
  cardLabel?: string
  source?: boolean
  onSelect: (id: string) => void
}) {
  const { t, date, money, rcSummary } = useI18n()
  const { row, reward } = entry
  return (
    <Button
      variant="ghost"
      className="h-auto w-full items-center justify-between gap-3 px-2 py-4 text-left whitespace-normal"
      data-transaction-id={source ? undefined : row.id}
      data-source-transaction-id={source ? row.id : undefined}
      onClick={() => onSelect(row.id)}
    >
      <span className="min-w-0 space-y-1.5">
        <span className="block text-xs font-normal text-muted-foreground">
          {date(row.transactionDate)}
          {cardLabel && ` · ${cardLabel}`}
        </span>
        <span className="block break-words text-sm font-medium">
          {row.description}
        </span>
        <span className="block text-xs font-normal text-muted-foreground">
          {t('details.account')} ·{' '}
          {money(row.account.minor, row.account.currency)}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="max-w-36 text-right tabular-nums">
          <span className="block text-xs font-normal text-muted-foreground">
            {t('details.transactionReward')}
          </span>
          <span className="mt-1 block text-base font-semibold">
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
        <RiArrowRightSLine
          className="hidden size-4 text-muted-foreground sm:block"
          aria-hidden="true"
        />
      </span>
    </Button>
  )
}
