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

export function AssumptionNotes({ items }: { items: readonly AssumptionKind[] }) {
  const { t } = useI18n()
  if (!items.length) return null
  return <ul className="space-y-1 text-xs text-muted-foreground" data-assumption-notes>
    {items.map((item) => <li key={item}>{t(labels[item])}</li>)}
  </ul>
}
