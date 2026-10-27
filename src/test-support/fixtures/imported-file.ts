import type { Card, Dataset } from '@/domain/model/types'
import { statement, testCard, transaction } from './dataset'

export function importedFile(
  id = 'a',
  date = '2026-10-20',
  card: Partial<Card> = {},
): Dataset {
  const cardId = card.id ?? testCard.id
  const accountId = `account-${cardId}`
  return {
    cards: [
      { ...testCard, statementIds: [id], accountIds: [accountId], ...card },
    ],
    statements: [
      statement({
        id,
        fileHash: `hash-${id}`,
        date,
        fileSizeBytes: 1000,
        accounts: [
          {
            id: accountId,
            currency: 'CNY',
            openingMinor: 0,
            closingMinor: 25000,
          },
        ],
      }),
    ],
    transactions: [
      transaction({
        id: `transaction-${id}`,
        cardId,
        accountId,
        sources: [
          {
            ...transaction().sources[0],
            statementId: id,
            fileHash: `hash-${id}`,
          },
        ],
      }),
    ],
  }
}
