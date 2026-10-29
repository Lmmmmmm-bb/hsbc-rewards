import type { MessageKey } from '@/i18n/zh'

const labels = {
  'reward.eligible': 'reason.eligible',
  'reward.cap-applied': 'reason.cap',
  'fx.required-for-cap': 'reason.fx',
  'region.unknown': 'reason.region',
  'currency.original-unknown': 'reason.currency',
  'reward.original-hkd': 'reason.originalHkd',
  'reward.region-excluded': 'reason.regionExcluded',
  'reward.currency-excluded': 'reason.currencyExcluded',
  'reward.payment-excluded': 'reason.payment',
  'reward.not-enrolled': 'reason.enrollment',
  'transaction.refund': 'reason.refund',
  'transaction.repayment': 'reason.repayment',
  'transaction.fee': 'reason.fee',
  'transaction.cash-advance': 'reason.cash',
  'transaction.credit': 'reason.credit',
  'transaction.non-positive': 'reason.nonpositive',
  'eligibility.excluded-merchant': 'reason.excluded',
} as const satisfies Readonly<Record<string, MessageKey>>

export function reasonMessage(code: string) {
  return Object.hasOwn(labels, code)
    ? labels[code as keyof typeof labels]
    : 'reason.other'
}
