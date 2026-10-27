import { DomainError } from '@/domain/model/errors'
import { parseMinor } from '@/domain/money/money'
import { normalizeCurrency } from '@/domain/normalization/currency'
import { resolveDateToken } from '@/domain/normalization/dates'
import type { TextPage } from '../text-layout'
import type { PulseMetadata, PulseRow } from './types'

const datedRow = /^(\d{1,2}\s*[A-Z]{3})\s+(\d{1,2}\s*[A-Z]{3})\s+(.+)$/i
const cardRow =
  /^(?:(?:PRIMARY|ADDITIONAL) CARD(?: NUMBER)?\s+)?(\d{4}\s*\d{4}\s*\d{4}\s*\d{4})(?:\s+[^\d].*)?$/i
const endOfTransactions =
  /^(?:Note:|\*+|REWARDCASH|REGISTRATION\/|HSBC PULSE CARD|RED HOT REWARDS|STATEMENT BALANCE|THE ABOVE MOBILE)/i
const pageFooter =
  /^(?:For important information|If you are paying|Please write|PO BOX)/i
const paymentLine =
  /^(?:APPLE[ -]PAY|GOOGLE[ -]PAY|G[ -]PAY|SAMSUNG[ -]PAY|UNION\s*PAY\s+QR)\b/i
const originalLine =
  /^(?:ORIGINAL(?: CURRENCY| AMOUNT)?\s*:?\s*)?([A-Z]{3})\s*([+-]?[\d,]+\.\d{2}\s*(?:CR|DR)?)$/i
const exchangeRateLine =
  /^(?:EXCHANGE RATE|CONVERSION RATE)[ :]+\d+(?:\.\d+)?$/i

function shortDate(token: string) {
  return token.trim().replace(/^(\d{1,2})\s*([A-Z]{3})$/i, '$1 $2')
}

/** Uses table coordinates for posted money. Summary values and illustrative figures are never transactions. */
export function readPulseTransactions(
  pages: readonly TextPage[],
  metadata: PulseMetadata,
): PulseRow[] {
  const output: PulseRow[] = []
  const closed = new Set<string>()
  let pending: PulseRow | null = null
  const flush = () => {
    if (pending) output.push(pending)
    pending = null
  }
  const resolutionFrom = new Date(
    Date.UTC(
      Number(metadata.date.slice(0, 4)),
      Number(metadata.date.slice(5, 7)) - 2,
      1,
    ),
  )
    .toISOString()
    .slice(0, 10)
  for (const page of [...pages].sort((a, b) => a.page - b.page)) {
    const accountNumber = metadata.pageAccounts.get(page.page)
    if (!accountNumber || closed.has(accountNumber)) continue
    const account = metadata.accounts.get(accountNumber)!
    if (pending && pending.accountNumber !== accountNumber) flush()
    let cardNumber: string = pending?.cardNumber ?? account.cardNumber
    const headerIndex = page.rows.findIndex((row) =>
      /^Post date\s+Trans date\s+Description of transaction\s+Amount\s*\((HKD|CNY|RMB)\)$/i.test(
        row.text.trim(),
      ),
    )
    if (headerIndex < 0) continue
    const header = page.rows[headerIndex]
    const currency = /\((HKD|CNY|RMB)\)$/i
      .exec(header.text)![1]
      .toUpperCase()
      .replace('RMB', 'CNY')
    if (currency !== account.currency)
      throw new DomainError('parse.conflicting-currency')
    const amountLabel = header.spans.find((span) =>
      /^Amount$/i.test(span.text.trim()),
    )
    if (!amountLabel) throw new DomainError('parse.missing-amount-column')
    const amountStart = amountLabel.bounds.x - 45
    for (const row of page.rows.slice(headerIndex + 1)) {
      const text = row.text.trim()
      // First sheets have a payment stub before later transaction sheets. It ends this page only.
      if (pageFooter.test(text)) break
      if (endOfTransactions.test(text)) {
        flush()
        closed.add(accountNumber)
        break
      }
      if (/^PREVIOUS BALANCE\b/i.test(text)) continue
      const card = cardRow.exec(text)
      if (card) {
        const number = card[1].replace(/\s/g, '')
        const nextCardNumber =
          metadata.accounts.get(number)?.cardNumber ?? number
        if (pending && pending.cardNumber !== nextCardNumber) flush()
        cardNumber = nextCardNumber
        continue
      }
      const match = datedRow.exec(text)
      if (match) {
        flush()
        const amountText = row.spans
          .filter((span) => span.bounds.x >= amountStart)
          .map((span) => span.text.trim())
          .join(' ')
        if (!amountText || !match[3].endsWith(amountText))
          throw new DomainError('parse.invalid-transaction-amount')
        const minor = parseMinor(amountText)
        const description = match[3].slice(0, -amountText.length).trim()
        if (!description)
          throw new DomainError('parse.missing-transaction-description')
        const posted = resolveDateToken(shortDate(match[1]), {
          from: resolutionFrom,
          to: metadata.date,
        })
        const transacted = resolveDateToken(shortDate(match[2]), {
          from: resolutionFrom,
          to: posted.date,
        })
        pending = {
          accountNumber,
          cardNumber,
          postingDate: posted.date,
          transactionDate: transacted.date,
          description,
          minor,
          original: null,
          sourceRows: [{ page: page.page, row }],
          warningCodes: [
            ...new Set([...posted.warningCodes, ...transacted.warningCodes]),
          ],
          confidence: Math.min(posted.confidence, transacted.confidence),
          paymentLines: [],
        }
        continue
      }
      if (/^\d{1,2}\s*[A-Z]{3}\b/i.test(text))
        throw new DomainError('parse.invalid-transaction-row')
      if (!pending || row.bounds.y > page.height * 0.9) continue
      const original = originalLine.exec(text)
      const hkd = /^HKD (?:EQUIVALENT|EQUIV\.?)[ :]+([\d,]+\.\d{2})$/i.exec(
        text,
      )
      if (original) {
        const value = {
          currency: normalizeCurrency(original[1]),
          minor: parseMinor(original[2]),
        }
        if (
          pending.original &&
          (pending.original.currency !== value.currency ||
            pending.original.minor !== value.minor)
        )
          throw new DomainError('parse.conflicting-original-amount')
        pending.original = value
      } else if (hkd) {
        const amount = parseMinor(hkd[1])
        if (
          pending.bankHkdEquivalentMinor !== undefined &&
          pending.bankHkdEquivalentMinor !== amount
        )
          throw new DomainError('parse.conflicting-original-amount')
        pending.bankHkdEquivalentMinor = amount
      } else if (paymentLine.test(text)) {
        pending.paymentLines.push(text)
      } else if (exchangeRateLine.test(text)) {
        // Bank conversion metadata is provenance, not part of the merchant/country description.
      } else {
        // A wrapped description must remain inside the merchant column and close to its previous row.
        const last = pending.sourceRows.at(-1)!
        const near =
          last.page !== page.page ||
          row.bounds.y - (last.row.bounds.y + last.row.bounds.height) <= 20
        if (
          !near ||
          row.bounds.x < header.bounds.x + 50 ||
          row.bounds.x + row.bounds.width > amountStart
        )
          throw new DomainError('parse.ambiguous-continuation')
        pending.description += ` ${text}`
      }
      pending.sourceRows.push({ page: page.page, row })
    }
  }
  flush()
  return output
}
