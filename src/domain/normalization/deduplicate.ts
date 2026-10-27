import type { SourceReference, Transaction } from '../model/types'

function signature(transaction: Transaction): string {
  return JSON.stringify([transaction.cardId, transaction.accountId, transaction.transactionDate, transaction.account.currency, transaction.account.minor, transaction.classification.kind, transaction.description.trim().replace(/\s+/g, ' ').toUpperCase()])
}

function referenceKey(transaction: Transaction): string | null {
  return transaction.bankReference ? JSON.stringify([transaction.cardId, transaction.accountId, transaction.bankReference, transaction.transactionDate, transaction.account.currency, transaction.account.minor, transaction.original.currency, transaction.original.minor, transaction.bankHkdEquivalentMinor ?? null, transaction.classification.kind, transaction.classification.region, transaction.classification.paymentMethod]) : null
}

function mergeSources(a: readonly SourceReference[], b: readonly SourceReference[]) {
  const sources = new Map<string, SourceReference>()
  for (const source of [...a, ...b]) sources.set(`${source.fileHash}:${source.page}:${source.row}`, source)
  return [...sources.values()].sort((x, y) => x.fileHash.localeCompare(y.fileHash) || x.page - y.page || x.row - y.row)
}

export function deduplicateTransactions(input: readonly Transaction[]) {
  const transactions: Transaction[] = [], proven = new Map<string, number>(), mergedIds: string[] = []
  for (const transaction of [...input].sort((a, b) => a.id.localeCompare(b.id))) {
    const key = referenceKey(transaction), index = key === null ? undefined : proven.get(key)
    if (index !== undefined) {
      const prior = transactions[index]
      transactions[index] = { ...prior, sources: mergeSources(prior.sources, transaction.sources), confidence: Math.min(prior.confidence, transaction.confidence), warnings: [...prior.warnings, ...transaction.warnings] }
      mergedIds.push(transaction.id)
    } else {
      if (key !== null) proven.set(key, transactions.length)
      transactions.push(transaction)
    }
  }
  const signatures = new Map<string, Transaction[]>()
  for (const transaction of transactions) {
    const key = signature(transaction)
    signatures.set(key, [...(signatures.get(key) ?? []), transaction])
  }
  const possibleDuplicateIds = new Set<string>()
  for (const group of signatures.values()) {
    if (group.length > 1 && group.some(t => !t.bankReference)) group.forEach(t => possibleDuplicateIds.add(t.id))
  }
  const referenceGroups = new Map<string, Transaction[]>()
  for (const transaction of transactions) {
    if (!transaction.bankReference) continue
    const key = JSON.stringify([transaction.cardId, transaction.accountId, transaction.bankReference])
    referenceGroups.set(key, [...(referenceGroups.get(key) ?? []), transaction])
  }
  const conflictingReferenceIds = new Set<string>()
  for (const group of referenceGroups.values()) {
    if (group.length > 1) group.forEach(t => conflictingReferenceIds.add(t.id))
  }
  return {
    transactions: transactions.map(t => {
      const code = conflictingReferenceIds.has(t.id) ? 'transaction.reference-conflict' : possibleDuplicateIds.has(t.id) ? 'transaction.possible-duplicate' : null
      return code ? { ...t, confidence: Math.min(t.confidence, .75), warnings: [...t.warnings, { code, source: t.sources[0] }] } : t
    }),
    mergedIds,
    possibleDuplicateIds: [...possibleDuplicateIds].sort(),
    conflictingReferenceIds: [...conflictingReferenceIds].sort(),
  }
}
