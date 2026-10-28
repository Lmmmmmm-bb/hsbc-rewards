import { DomainError } from '@/domain/model/errors'
import { parseMinor } from '@/domain/money/money'
import { normalizeAccountCurrency } from '@/domain/normalization/currency'
import { requireIsoDate } from '@/domain/normalization/dates'
import type { TextPage, TextRow } from '../text-layout'
import type { PulseAccount, PulseMetadata, PulseProgram } from './types'

const accountToken = '(\\d{4}\\s*\\d{4}\\s*\\d{4}\\s*\\d{4})'
const subAccount = new RegExp(
  `^Account number\\s+${accountToken}\\s+(HKD|RMB|CNY)\\s+Sub-account\\s+Statement balance\\s+(HKD|RMB|CNY)\\s*(.+)$`,
  'i',
)
const monthNames = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]

export function pulseDate(value: string): string {
  const match = /^(\d{1,2})\s*([A-Z]{3})\s*(20\d{2})$/i.exec(value.trim())
  if (!match) throw new DomainError('parse.invalid-statement-date')

  const month = monthNames.indexOf(match[2].toUpperCase()) + 1
  return requireIsoDate(
    `${match[3]}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}`,
  )
}

function numberOf(value: string): string {
  const number = value.replace(/\s/g, '')
  if (!/^\d{16}$/.test(number)) throw new DomainError('parse.invalid-account')
  return number
}

/** Statement period is not printed by this template. Keep an explicit warning on the output. */
function inferredPeriod(date: string) {
  const end = new Date(`${date}T00:00:00Z`)
  const priorMonthEnd = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0),
  )
  const day = Math.min(end.getUTCDate(), priorMonthEnd.getUTCDate())
  const previous = new Date(
    Date.UTC(
      priorMonthEnd.getUTCFullYear(),
      priorMonthEnd.getUTCMonth(),
      day + 1,
    ),
  )

  return { from: previous.toISOString().slice(0, 10), to: date }
}

function rightText(row: TextRow, left: number, right = Infinity): string {
  return row.spans
    .filter((span) => span.bounds.x >= left && span.bounds.x < right)
    .map((span) => span.text.trim())
    .join(' ')
}

export function readPulseMetadata(input: readonly TextPage[]): PulseMetadata {
  const pages = [...input].sort((a, b) => a.page - b.page)
  if (
    pages.length === 0 ||
    pages.some((page, index) => page.page !== index + 1)
  )
    throw new DomainError('parse.incomplete-pages')
  if (
    !pages.some((page) =>
      page.rows.some((row) =>
        /Statement of HSBC Pulse UnionPay Dual Currency Diamond Card/i.test(
          row.text,
        ),
      ),
    )
  )
    throw new DomainError('parse.unsupported-template')

  const dates = new Set<string>()
  const associations = new Map<
    string,
    { currency: PulseAccount['currency']; cardNumber: string }
  >()
  const headers: {
    page: number
    number: string
    currency: PulseAccount['currency']
    closingMinor: number
  }[] = []
  const roles = new Map<string, 'primary' | 'additional'>()

  for (const page of pages) {
    for (let index = 0; index < page.rows.length; index++) {
      const row = page.rows[index]
      const label = row.spans.find((span) =>
        /^Statement Date$/i.test(span.text.trim()),
      )
      if (label) {
        const next = page.rows[index + 1]
        if (!next) throw new DomainError('parse.missing-statement-date')

        const adjacent = row.spans.find(
          (span) =>
            /^Statement balance$/i.test(span.text.trim()) &&
            span.bounds.x > label.bounds.x,
        )
        dates.add(
          pulseDate(rightText(next, label.bounds.x - 24, adjacent?.bounds.x)),
        )
      }

      const accountLabel = row.spans.find((span) =>
        /^Account Number$/i.test(span.text.trim()),
      )
      const limitLabel = row.spans.find((span) =>
        /^Credit Limit$/i.test(span.text.trim()),
      )
      if (accountLabel && limitLabel) {
        const pair: { number: string; currency: PulseAccount['currency'] }[] =
          []
        for (const candidate of page.rows.slice(index + 1, index + 4)) {
          if (/Sub-account\s+Statement balance/i.test(candidate.text)) break

          const numberText = rightText(
            candidate,
            accountLabel.bounds.x - 12,
            limitLabel.bounds.x,
          )
          const currency = /^(HKD|RMB|CNY)\s*\d/i.exec(
            rightText(candidate, limitLabel.bounds.x),
          )
          if (!currency) break

          pair.push({
            number: numberOf(numberText),
            currency: normalizeAccountCurrency(currency[1]),
          })
        }

        const card = pair.find((account) => account.currency === 'HKD')
        if (!card) throw new DomainError('parse.missing-card-association')

        for (const account of pair) {
          const prior = associations.get(account.number)
          if (
            prior &&
            (prior.cardNumber !== card.number ||
              prior.currency !== account.currency)
          )
            throw new DomainError('parse.conflicting-account-association')

          associations.set(account.number, {
            currency: account.currency,
            cardNumber: card.number,
          })
        }
      }

      const header = subAccount.exec(row.text.trim())
      if (header) {
        const currency = normalizeAccountCurrency(header[2])
        if (normalizeAccountCurrency(header[3]) !== currency)
          throw new DomainError('parse.conflicting-currency')

        headers.push({
          page: page.page,
          number: numberOf(header[1]),
          currency,
          closingMinor: parseMinor(header[4]),
        })
      }

      const role = new RegExp(
        `^(PRIMARY|ADDITIONAL) CARD(?: NUMBER)?\\s+${accountToken}$`,
        'i',
      ).exec(row.text.trim())
      if (role)
        roles.set(
          numberOf(role[2]),
          role[1].toUpperCase() === 'PRIMARY' ? 'primary' : 'additional',
        )
    }
  }

  if (dates.size !== 1)
    throw new DomainError(
      dates.size
        ? 'parse.conflicting-statement-dates'
        : 'parse.missing-statement-date',
    )
  if (headers.length === 0) throw new DomainError('parse.missing-subaccounts')

  const accounts = new Map<string, PulseAccount>()
  const pageAccounts = new Map<number, string>()
  for (const header of headers) {
    const association = associations.get(header.number)
    if (!association || association.currency !== header.currency)
      throw new DomainError('parse.missing-card-association')

    const prior = accounts.get(header.number)
    if (
      prior &&
      (prior.currency !== header.currency ||
        prior.closingMinor !== header.closingMinor)
    )
      throw new DomainError('parse.conflicting-balances')
    if (pageAccounts.has(header.page))
      throw new DomainError('parse.multiple-subaccounts-on-page')

    pageAccounts.set(header.page, header.number)
    accounts.set(
      header.number,
      prior ?? {
        ...association,
        number: header.number,
        openingMinor: null,
        closingMinor: header.closingMinor,
      },
    )
  }

  const programs = new Map<string, PulseProgram>()
  for (const page of pages) {
    const number = pageAccounts.get(page.page)
    if (!number) continue

    const account = accounts.get(number)!
    for (let index = 0; index < page.rows.length; index++) {
      const text = page.rows[index].text.trim()
      const opening = /^PREVIOUS BALANCE\s+(.+)$/i.exec(text)
      if (opening) {
        const minor = parseMinor(opening[1])
        if (account.openingMinor !== null && account.openingMinor !== minor)
          throw new DomainError('parse.conflicting-balances')

        account.openingMinor = minor
      }

      const closing = /^STATEMENT BALANCE\s+(.+)$/i.exec(text)
      if (closing && parseMinor(closing[1]) !== account.closingMinor)
        throw new DomainError('parse.conflicting-balances')

      const multiplier =
        /^(\d+)X REWARDCASH IN OVERSEAS\s*&\s*MAINLAND CN[- ]20\d{2}$/i.exec(
          text,
        )
      if (multiplier) {
        const value = Number(multiplier[1])
        if (value > 5)
          throw new DomainError('parse.unsupported-reward-allocation')

        const effective = /^THE EFFECTIVE PERIOD IS FROM (.+) TO (.+)\.$/i.exec(
          page.rows[index + 1]?.text.trim() ?? '',
        )
        const program = {
          multiplier: value,
          effectivePeriod: effective
            ? { from: pulseDate(effective[1]), to: pulseDate(effective[2]) }
            : null,
        }
        if (
          program.effectivePeriod &&
          program.effectivePeriod.from > program.effectivePeriod.to
        )
          throw new DomainError('parse.invalid-program-period')

        const prior = programs.get(account.cardNumber)
        if (prior && prior.multiplier !== value)
          throw new DomainError('parse.conflicting-reward-allocation')

        programs.set(account.cardNumber, program)
      }
    }
  }

  const date = [...dates][0]
  return {
    date,
    period: inferredPeriod(date),
    accounts,
    pageAccounts,
    programs,
    roles,
  }
}
