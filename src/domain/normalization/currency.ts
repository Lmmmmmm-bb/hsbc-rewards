import { DomainError } from '../model/errors'
import type { AccountCurrency } from '../model/types'

/** ISO 4217's no-currency code represents missing original-currency evidence, never a foreign-currency qualification. */
export const UNKNOWN_CURRENCY = 'XXX'

const aliases: Readonly<Record<string, string>> = { RMB: 'CNY', 'CN¥': 'CNY', '￥': 'CNY', 'HK$': 'HKD', 'MOP$': 'MOP', 'JP¥': 'JPY' }

export function normalizeCurrency(value: string): string {
  const normalized = value.trim().toUpperCase()
  const currency = aliases[normalized] ?? normalized
  if (!/^[A-Z]{3}$/.test(currency)) throw new DomainError('currency.invalid')
  return currency
}

export function normalizeAccountCurrency(value: string): AccountCurrency {
  const currency = normalizeCurrency(value)
  if (currency !== 'HKD' && currency !== 'CNY') throw new DomainError('currency.unsupported-account')
  return currency
}
