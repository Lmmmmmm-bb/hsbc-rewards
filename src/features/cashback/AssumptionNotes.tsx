import type { AssumptionKind } from '@/application/results/assumptions'
import type { MessageKey } from '@/i18n/zh'
import { useI18n } from '@/i18n/use-i18n'

const labels = {
  registration: 'basis.registration',
  multiplier: 'basis.multiplier',
  pool: 'rewards.poolUnconfirmed',
  'reference-fx': 'card.fxAssumed',
  'role-conflict': 'rewards.roleConflict',
  'pool-conflict': 'rewards.poolConflict',
  'enrollment-period': 'rewards.enrollmentPeriodIgnored',
} as const satisfies Readonly<Record<AssumptionKind, MessageKey>>

export function AssumptionNotes({
  items,
  emphasis = false,
}: {
  items: readonly AssumptionKind[]
  emphasis?: boolean
}) {
  const { t } = useI18n()
  if (!items.length) return null
  return (
    <ul
      className={
        emphasis
          ? 'list-disc space-y-3 pl-4 text-sm leading-relaxed text-foreground'
          : 'space-y-1 text-xs text-muted-foreground'
      }
      data-assumption-notes
    >
      {items.map((item) => (
        <li key={item}>{t(labels[item])}</li>
      ))}
    </ul>
  )
}
