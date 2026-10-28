import {
  classify,
  classifyTransaction,
  identifyPayment,
  identifyRegion,
} from '@/domain/classification/classify'
import { DomainError } from '@/domain/model/errors'
import { UNKNOWN_CURRENCY } from '@/domain/normalization/currency'
import type {
  Card,
  Dataset,
  NormalizedTransaction,
  Transaction,
} from '@/domain/model/types'
import type { TextPage } from '../text-layout'
import { readPulseMetadata } from './metadata'
import { readPulseTransactions } from './transactions'
import type { PulseFile, PulseIdentity } from './types'

export const PULSE_TEMPLATE_VERSION = 'hsbc-pulse-english-2026-v1'

/** Available to a composition root for opaque hashing without retaining bank numbers in application state. */
export function pulseAccountNumbers(pages: readonly TextPage[]): string[] {
  return [
    ...new Set(
      pages.flatMap((page) =>
        page.rows.flatMap((row) =>
          [...row.text.matchAll(/\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b/g)].map(
            (match) => match[0].replace(/\s/g, ''),
          ),
        ),
      ),
    ),
  ]
}

export function parsePulseStatement(
  pages: readonly TextPage[],
  file: PulseFile,
  identify: PulseIdentity,
): Dataset {
  if (
    !file.id ||
    !file.fileHash ||
    !Number.isSafeInteger(file.size) ||
    file.size < 0
  )
    throw new DomainError('parse.invalid-file-metadata')

  const metadata = readPulseMetadata(pages)
  const rows = readPulseTransactions(pages, metadata)
  const cardNumbers = new Set(
    [...metadata.accounts.values()].map((account) => account.cardNumber),
  )
  rows.forEach((row) => cardNumbers.add(row.cardNumber))
  const cardOwners = new Map<string, Set<string>>()
  for (const row of rows) {
    const owner = metadata.accounts.get(row.accountNumber)!.cardNumber
    const owners = cardOwners.get(row.cardNumber) ?? new Set<string>()
    owners.add(owner)
    cardOwners.set(row.cardNumber, owners)
  }

  const sharedOwners = new Set(
    [...metadata.accounts.values()]
      .map((account) => account.cardNumber)
      .filter(
        (owner) =>
          new Set([
            owner,
            ...rows
              .filter(
                (row) =>
                  metadata.accounts.get(row.accountNumber)!.cardNumber ===
                  owner,
              )
              .map((row) => row.cardNumber),
          ]).size > 1,
      ),
  )

  const opaque = (kind: 'card' | 'account', number: string) => {
    const id = identify(kind, number)
    if (!id || id.includes(number))
      throw new DomainError('parse.invalid-opaque-identity')
    return id
  }

  const cards: Card[] = [...cardNumbers].map((number) => {
    const owners = cardOwners.get(number) ?? new Set([number])
    if (owners.size > 1) throw new DomainError('parse.conflicting-card-account')

    const owner = [...owners][0]
    const program = metadata.programs.get(owner)
    return {
      id: opaque('card', number),
      lastFour: number.slice(-4),
      role: metadata.roles.get(number) ?? 'unknown',
      statementIds: [file.id],
      accountIds: [...metadata.accounts.values()]
        .filter((account) => account.cardNumber === owner)
        .map((account) => opaque('account', account.number)),
      ...(sharedOwners.has(owner)
        ? {
            pool: {
              id: opaque('account', owner),
              evidence: 'statement-account' as const,
            },
          }
        : {}),
      ...(program
        ? {
            abroadEnrollment: 'registered' as const,
            abroadMultiplier: program.multiplier,
          }
        : {}),
    }
  })
  if (new Set(cards.map((card) => card.id)).size !== cards.length)
    throw new DomainError('parse.identity-collision')

  const transactions: Transaction[] = rows.map((row) => {
    const account = metadata.accounts.get(row.accountNumber)!
    const region = identifyRegion(row.description)
    const local =
      (account.currency === 'HKD' && region === 'HK') ||
      (account.currency === 'CNY' && region === 'CN')
    const base: NormalizedTransaction = {
      id: `${file.id}:${row.sourceRows[0].page}:${row.sourceRows[0].row.row}`,
      cardId: opaque('card', row.cardNumber),
      accountId: opaque('account', row.accountNumber),
      transactionDate: row.transactionDate,
      postingDate: row.postingDate,
      description: row.description,
      original: row.original ?? {
        currency: account.currency,
        minor: row.minor,
      },
      account: { currency: account.currency, minor: row.minor },
      sources: [],
      confidence: row.confidence,
      warnings: [],
    }
    const missingOriginal = !row.original && !local && classify(base).eligible
    const normalized: NormalizedTransaction = {
      ...base,
      original: row.original ?? {
        currency: missingOriginal ? UNKNOWN_CURRENCY : account.currency,
        minor: row.minor,
      },
      ...(row.bankHkdEquivalentMinor !== undefined
        ? { bankHkdEquivalentMinor: row.bankHkdEquivalentMinor }
        : {}),
      sources: row.sourceRows.map(({ page, row: source }) => ({
        statementId: file.id,
        fileHash: file.fileHash,
        page,
        row: source.row,
        text: source.text,
        bounds: source.bounds,
      })),
      confidence: missingOriginal
        ? Math.min(row.confidence, 0.75)
        : row.confidence,
      warnings: [
        ...row.warningCodes,
        ...(missingOriginal ? ['currency.original-unknown'] : []),
      ].map((code) => ({ code })),
    }
    const classified = classifyTransaction(normalized)
    const methods = new Set(row.paymentLines.map(identifyPayment))
    if (methods.size > 1)
      throw new DomainError('parse.conflicting-payment-method')
    return {
      ...classified,
      classification: {
        ...classified.classification,
        paymentMethod:
          [...methods][0] ?? classified.classification.paymentMethod,
      },
    }
  })
  const accountIds = [...metadata.accounts.values()].map((account) =>
    opaque('account', account.number),
  )
  if (new Set(accountIds).size !== accountIds.length)
    throw new DomainError('parse.identity-collision')

  const earliestPosted = transactions.map((row) => row.postingDate).sort()[0]
  const from =
    earliestPosted && earliestPosted < metadata.period.from
      ? earliestPosted
      : metadata.period.from

  return {
    cards,
    transactions,
    statements: [
      {
        id: file.id,
        fileHash: file.fileHash,
        fileName: file.fileName,
        fileSizeBytes: file.size,
        date: metadata.date,
        period: { from, to: metadata.date },
        pageCount: pages.length,
        templateVersion: PULSE_TEMPLATE_VERSION,
        accounts: [...metadata.accounts.values()].map((account) => ({
          id: opaque('account', account.number),
          currency: account.currency,
          openingMinor: account.openingMinor,
          closingMinor: account.closingMinor,
        })),
        warnings: [
          { code: 'statement.period-inferred' },
          ...([...metadata.accounts.values()].some(
            (account) => account.openingMinor === null,
          )
            ? [{ code: 'balance.missing-opening' }]
            : []),
          ...([...metadata.programs.values()].some(
            (program) => program.effectivePeriod,
          )
            ? [{ code: 'assumption.enrollment-period-ignored' }]
            : []),
        ],
      },
    ],
  }
}
