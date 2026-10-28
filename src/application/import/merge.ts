import { DomainError } from '@/domain/model/errors'
import type { Card, Dataset, DomainWarning } from '@/domain/model/types'
import { deduplicateTransactions } from '@/domain/normalization/deduplicate'

const unique = (values: readonly string[]) => [...new Set(values)].sort()

const uniqueWarnings = (warnings: readonly DomainWarning[]) => [
  ...new Map(
    warnings.map((warning) => [
      JSON.stringify([
        warning.code,
        warning.source?.fileHash,
        warning.source?.page,
        warning.source?.row,
      ]),
      warning,
    ]),
  ).values(),
]

function mergeCard(prior: Card, incoming: Card): Card {
  if (prior.lastFour !== incoming.lastFour)
    throw new DomainError('import.card-identity-conflict')

  const warnings = uniqueWarnings([
    ...(prior.warnings ?? []),
    ...(incoming.warnings ?? []),
  ])

  const conflict = (code: string) => {
    if (!warnings.some((warning) => warning.code === code))
      warnings.push({ code })
  }

  if (
    prior.role !== 'unknown' &&
    incoming.role !== 'unknown' &&
    prior.role !== incoming.role
  )
    conflict('card.role-conflict')

  if (prior.pool && incoming.pool && prior.pool.id !== incoming.pool.id)
    conflict('card.pool-conflict')

  const role = warnings.some((warning) => warning.code === 'card.role-conflict')
    ? 'unknown'
    : incoming.role === 'unknown'
      ? prior.role
      : incoming.role
  const { pool: ignoredPool, ...base } = { ...prior, ...incoming }
  void ignoredPool
  const pool = warnings.some((warning) => warning.code === 'card.pool-conflict')
    ? undefined
    : (incoming.pool ?? prior.pool)

  return {
    ...base,
    role,
    ...(pool ? { pool } : {}),
    statementIds: unique([
      ...(prior.statementIds ?? []),
      ...(incoming.statementIds ?? []),
    ]),
    accountIds: unique([
      ...(prior.accountIds ?? []),
      ...(incoming.accountIds ?? []),
    ]),
    warnings,
  }
}

/** Compute a complete next dataset before any store write. Input objects are never changed. */
export function mergeImportedDatasets(
  previous: Dataset,
  incoming: readonly Dataset[],
): Dataset {
  const statementMap = new Map(
    previous.statements.map((statement) => [statement.id, statement]),
  )
  const hashes = new Set(
    previous.statements.map((statement) => statement.fileHash),
  )
  const accepted: Dataset[] = []
  for (const dataset of [...incoming].sort(
    (a, b) =>
      (a.statements[0]?.date ?? '').localeCompare(
        b.statements[0]?.date ?? '',
      ) ||
      (a.statements[0]?.fileHash ?? '').localeCompare(
        b.statements[0]?.fileHash ?? '',
      ),
  )) {
    if (dataset.statements.length !== 1)
      throw new DomainError('import.invalid-parsed-file')

    const statement = dataset.statements[0]
    if (hashes.has(statement.fileHash)) continue
    if (statementMap.has(statement.id))
      throw new DomainError('import.statement-identity-conflict')

    statementMap.set(statement.id, statement)
    hashes.add(statement.fileHash)
    accepted.push(dataset)
  }

  const rawTransactions = [
    ...previous.transactions,
    ...accepted.flatMap((dataset) => dataset.transactions),
  ]
  if (
    new Set(rawTransactions.map((row) => row.id)).size !==
    rawTransactions.length
  )
    throw new DomainError('import.transaction-identity-conflict')

  const cards = new Map<string, Card>()

  const cardDate = (card: Card, dataset: Dataset) => {
    const sourceIds = new Set([
      ...(card.statementIds ?? []),
      ...dataset.transactions
        .filter((row) => row.cardId === card.id)
        .flatMap((row) => row.sources.map((source) => source.statementId)),
    ])

    return (
      dataset.statements
        .filter((statement) => sourceIds.has(statement.id))
        .map((statement) => `${statement.date}:${statement.fileHash}`)
        .sort()
        .at(-1) ?? ''
    )
  }

  const evidence = [previous, ...accepted]
    .flatMap((dataset) =>
      dataset.cards.map((card) => ({ card, order: cardDate(card, dataset) })),
    )
    .sort(
      (a, b) =>
        a.order.localeCompare(b.order) || a.card.id.localeCompare(b.card.id),
    )
  for (const { card } of evidence)
    cards.set(
      card.id,
      cards.has(card.id) ? mergeCard(cards.get(card.id)!, card) : card,
    )

  const accountCurrency = new Map<string, string>()
  for (const statement of statementMap.values())
    for (const account of statement.accounts) {
      if (
        accountCurrency.has(account.id) &&
        accountCurrency.get(account.id) !== account.currency
      )
        throw new DomainError('import.account-currency-conflict')
      accountCurrency.set(account.id, account.currency)
    }

  for (const row of rawTransactions) {
    if (
      !cards.has(row.cardId) ||
      accountCurrency.get(row.accountId) !== row.account.currency ||
      row.sources.length === 0 ||
      row.sources.some((source) => {
        const statement = statementMap.get(source.statementId)

        return (
          !statement ||
          !statement.accounts.some(
            (account) =>
              account.id === row.accountId &&
              account.currency === row.account.currency,
          ) ||
          statement.fileHash !== source.fileHash ||
          !Number.isInteger(source.page) ||
          source.page < 1 ||
          source.page > statement.pageCount ||
          !Number.isInteger(source.row) ||
          source.row < 1
        )
      })
    )
      throw new DomainError('import.invalid-source-association')
  }

  const cleaned = rawTransactions.map((row) => ({
    ...row,
    warnings: row.warnings.filter(
      (warning) =>
        ![
          'transaction.possible-duplicate',
          'transaction.reference-conflict',
        ].includes(warning.code),
    ),
  }))

  return {
    cards: [...cards.values()].sort((a, b) => a.id.localeCompare(b.id)),
    statements: [...statementMap.values()].sort(
      (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
    ),
    transactions: deduplicateTransactions(cleaned).transactions.map((row) => ({
      ...row,
      warnings: uniqueWarnings(row.warnings),
    })),
  }
}
