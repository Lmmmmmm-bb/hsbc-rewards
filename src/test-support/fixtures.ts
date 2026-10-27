import type { Card, Statement, Transaction } from '@/domain/model/types'

export const testCard: Card = { id: 'card-a', lastFour: '1234', role: 'primary' }

export function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'transaction-a', cardId: 'card-a', accountId: 'account-cny',
    transactionDate: '2026-10-19', postingDate: '2026-10-20',
    description: 'UNIONPAY QR SAMPLE STORE CN',
    original: { currency: 'CNY', minor: 25_000 }, account: { currency: 'CNY', minor: 25_000 },
    sources: [{ statementId: 'statement-a', fileHash: 'synthetic-hash-a', page: 1, row: 1, text: 'SYNTHETIC TEST ROW' }],
    confidence: 1, warnings: [],
    classification: { kind: 'purchase', category: 'shopping', region: 'CN', paymentMethod: 'unionpay-qr', eligible: true, reasonCodes: [] },
    ...overrides,
  }
}

export function statement(overrides: Partial<Statement> = {}): Statement {
  return { id: 'statement-a', fileHash: 'synthetic-hash-a', fileName: 'synthetic.pdf', date: '2026-10-20', period: { from: '2026-09-21', to: '2026-10-20' }, pageCount: 1, templateVersion: 'synthetic-v1', accounts: [{ id: 'account-cny', currency: 'CNY', openingMinor: 100_000, closingMinor: 125_000 }], warnings: [], ...overrides }
}
