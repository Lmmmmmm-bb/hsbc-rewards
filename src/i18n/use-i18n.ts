import { useContext } from 'react'
import { formatRewardNumber } from './reward-format'
import { I18nContext } from './context'

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('i18n.provider-missing')

  const money = (minor: number | null, currency = 'CNY') =>
    minor === null
      ? value.t('rewards.pending')
      : new Intl.NumberFormat(value.locale, {
          style: 'currency',
          currency,
          currencyDisplay: 'code',
        }).format(minor / 100)

  const number = (amount: number, maximumFractionDigits = 2) =>
    new Intl.NumberFormat(value.locale, {
      maximumFractionDigits,
      minimumFractionDigits: Math.min(2, maximumFractionDigits),
    }).format(amount)

  const date = (iso: string) =>
    new Intl.DateTimeFormat(value.locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'Asia/Hong_Kong',
    }).format(new Date(`${iso}T00:00:00Z`))

  const rc = (microRc: number | null) =>
    microRc === null
      ? value.t('rewards.pending')
      : `${formatRewardNumber(microRc, value.locale, 'exact')} RC`

  const dateTime = (timestamp: number) =>
    new Intl.DateTimeFormat(value.locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Hong_Kong',
      timeZoneName: 'short',
    }).format(timestamp)

  const rewardNumber = (microRc: number) => formatRewardNumber(microRc, value.locale)
  const rcSummary = (microRc: number | null) => microRc === null ? value.t('rewards.pending') : `${rewardNumber(microRc)} RC`

  return { ...value, money, number, date, rc, rcSummary, rewardNumber, dateTime }
}
