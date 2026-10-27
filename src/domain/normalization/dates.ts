import { DomainError } from '../model/errors'

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function requireIsoDate(value: string): string {
  if (!isIsoDate(value)) throw new DomainError('date.invalid')
  return value
}

export function resolveDateToken(token: string, period: { from: string; to: string }) {
  requireIsoDate(period.from)
  requireIsoDate(period.to)
  if (period.from > period.to) throw new DomainError('date.invalid-period')
  const trimmed = token.trim().toUpperCase()
  if (isIsoDate(trimmed)) return { date: trimmed, confidence: 1, warningCodes: [] as string[] }
  const match = /^(\d{1,2})[\s/-]+(\d{1,2}|[A-Z]{3})$/.exec(trimmed)
  if (!match) throw new DomainError('date.invalid')
  const day = Number(match[1])
  const month = /^\d+$/.test(match[2]) ? Number(match[2]) : months.indexOf(match[2]) + 1
  const firstYear = Number(period.from.slice(0, 4)), lastYear = Number(period.to.slice(0, 4))
  const candidates: string[] = []
  for (let year = firstYear - 1; year <= lastYear + 1; year++) {
    const candidate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (isIsoDate(candidate)) candidates.push(candidate)
  }
  const covered = candidates.filter(date => date >= period.from && date <= period.to)
  if (covered.length === 1) return { date: covered[0], confidence: firstYear === lastYear ? .95 : .8, warningCodes: firstYear === lastYear ? [] : ['date.cross-year-inferred'] }
  if (covered.length > 1) throw new DomainError('date.ambiguous-year')
  const preceding = candidates.filter(date => date <= period.to).sort().at(-1)
  if (!preceding) throw new DomainError('date.invalid')
  return { date: preceding, confidence: .6, warningCodes: ['date.outside-period'] }
}

export function rewardPeriod(date: string, period: 'year' | 'half-year'): string {
  requireIsoDate(date)
  const year = date.slice(0, 4)
  return period === 'year' ? year : `${year}-H${Number(date.slice(5, 7)) <= 6 ? 1 : 2}`
}
