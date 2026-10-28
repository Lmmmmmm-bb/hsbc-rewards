import { classifyTransaction } from '@/domain/classification/classify'
import type {
  AccountCurrency,
  Card,
  Dataset,
  NormalizedTransaction,
  Statement,
} from '@/domain/model/types'

type DemoRow = readonly [
  postingDay: number,
  description: string,
  currency: AccountCurrency,
  amountMinor: number,
  originalCurrency?: string,
  originalMinor?: number,
]

interface DemoStatement {
  readonly id: string
  readonly card: 'main' | 'additional'
  readonly date: string
  readonly from: string
  readonly balances: readonly (readonly [AccountCurrency, number, number])[]
  readonly rows: readonly DemoRow[]
}

/** Fictional statements span an annual reset and a half-year reset, including cap clipping. */
const examples: readonly DemoStatement[] = [
  {
    id: 'main-2025-12', card: 'main', date: '2025-12-22', from: '2025-11-23',
    balances: [['CNY', 100000, 190000], ['HKD', 50000, 305000]],
    rows: [
      [4, 'DEMO HOTEL UNIONPAY QR CN', 'CNY', 300000],
      [7, 'DEMO STORE APPLE PAY CN', 'CNY', 120000],
      [10, 'DEMO SUPERMARKET CN', 'CNY', 80000],
      [13, 'DEMO TRAVEL STORE JPN', 'HKD', 240000, 'JPY', 4600000],
      [16, 'DEMO RESTAURANT HKG', 'HKD', 15000],
      [18, 'REFUND DEMO STORE CN', 'CNY', -10000],
      [21, 'PAYMENT RECEIVED', 'CNY', -400000],
    ],
  },
  {
    id: 'additional-2025-12', card: 'additional', date: '2025-12-22', from: '2025-11-23',
    balances: [['HKD', 20000, 186200], ['CNY', 0, 45000]],
    rows: [
      [5, 'DEMO HOTEL SGP', 'HKD', 180000, 'SGD', 30000],
      [9, 'DEMO STORE JPN', 'HKD', 80000, 'JPY', 1500000],
      [12, 'DEMO TAXI HKG', 'HKD', 6200],
      [15, 'DEMO RESTAURANT UNIONPAY QR CN', 'CNY', 45000],
      [21, 'PAYMENT RECEIVED', 'HKD', -100000],
    ],
  },
  {
    id: 'main-2026-06', card: 'main', date: '2026-06-22', from: '2026-05-23',
    balances: [['CNY', 90000, 1270000], ['HKD', 305000, 443500]],
    rows: [
      [4, 'DEMO TRAVEL UNIONPAY QR CN', 'CNY', 4000000],
      [8, 'DEMO HOME STORE APPLE PAY CN', 'CNY', 3200000],
      [12, 'DEMO ELECTRONICS STORE SAMSUNG PAY CN', 'CNY', 1200000],
      [15, 'DEMO HOTEL CN', 'CNY', 900000],
      [17, 'DEMO HOTEL GOOGLE PAY MO', 'HKD', 135000, 'MOP', 139000],
      [18, 'REFUND DEMO HOME STORE CN', 'CNY', -120000],
      [20, 'PAYMENT RECEIVED', 'CNY', -8000000],
      [21, 'FINANCE CHARGE', 'HKD', 3500],
    ],
  },
  {
    id: 'additional-2026-06', card: 'additional', date: '2026-06-22', from: '2026-05-23',
    balances: [['HKD', 186200, 829000], ['CNY', 45000, 43000]],
    rows: [
      [5, 'DEMO COFFEE HKG', 'HKD', 12800],
      [8, 'DEMO AIRLINE USA', 'HKD', 365000, 'USD', 46800],
      [11, 'DEMO STORE FRA', 'HKD', 215000, 'EUR', 25000],
      [14, 'DEMO SUPERMARKET UNIONPAY QR CN', 'CNY', 58000],
      [18, 'DEMO WALLET TOP UP HKG', 'HKD', 50000],
      [21, 'PAYMENT RECEIVED', 'CNY', -60000],
    ],
  },
  {
    id: 'main-2026-10', card: 'main', date: '2026-10-22', from: '2026-09-23',
    // The CNY closing balance deliberately differs by CNY 30 to demonstrate reconciliation.
    balances: [['CNY', 500000, 483000], ['HKD', 200000, 213000]],
    rows: [
      [6, 'DEMO APPLE PAY STORE MO', 'HKD', 10000, 'MOP', 10309],
      [10, 'FINANCE CHARGE', 'HKD', 3000],
      [12, 'PAYMENT RECEIVED', 'CNY', -300000],
      [14, 'REFUND DEMO STORE CN', 'CNY', -20000],
      [15, 'DEMO ONLINE SHOP CN', 'CNY', 200000],
      [18, 'DEMO SUPERMARKET UNIONPAY QR CN', 'CNY', 75000],
      [20, 'DEMO RESTAURANT UNIONPAY QR CN', 'CNY', 25000],
    ],
  },
  {
    id: 'additional-2026-10', card: 'additional', date: '2026-10-22', from: '2026-09-23',
    balances: [['HKD', 100000, 190000]],
    rows: [
      [7, 'DEMO UNKNOWN MERCHANT', 'HKD', 15000],
      [9, 'DEMO TRAVEL STORE JPN', 'HKD', 50000, 'JPY', 1000000],
      [17, 'DEMO COFFEE HKG', 'HKD', 25000],
    ],
  },
]

export function createDemoDataset(): Dataset {
  const statements: Statement[] = examples.map((example) => ({
    id: `demo-${example.id}`,
    fileName: `DEMO_Pulse_${example.id}.pdf`,
    fileHash: `demo-not-a-real-file-${example.id}`,
    date: example.date,
    period: { from: example.from, to: example.date },
    pageCount: 2,
    templateVersion: 'demo',
    accounts: example.balances.map(([currency, openingMinor, closingMinor]) => ({
      id: `demo-${example.card}-${currency}`, currency, openingMinor, closingMinor,
    })),
    warnings: [],
  }))
  const cards: Card[] = ([
    { id: 'demo-main', lastFour: '6228', role: 'primary' },
    { id: 'demo-additional', lastFour: '9056', role: 'additional' },
  ] satisfies Card[]).map((card) => {
    const sources = statements.filter((_, index) => card.id === `demo-${examples[index].card}`)
    return {
      ...card,
      statementIds: sources.map((statement) => statement.id),
      accountIds: [...new Set(sources.flatMap((statement) => statement.accounts.map((account) => account.id)))],
    }
  })
  const transactions = examples.flatMap((example, statementIndex) =>
    example.rows.map(([
      day, description, currency, amountMinor,
      originalCurrency = currency, originalMinor = amountMinor,
    ], rowIndex) => {
      const statement = statements[statementIndex]
      const month = example.date.slice(0, 7)
      const normalized: NormalizedTransaction = {
        id: `demo-${example.id}-${rowIndex + 1}`,
        cardId: `demo-${example.card}`,
        accountId: `demo-${example.card}-${currency}`,
        transactionDate: `${month}-${String(day - 1).padStart(2, '0')}`,
        postingDate: `${month}-${String(day).padStart(2, '0')}`,
        description,
        original: { currency: originalCurrency, minor: originalMinor },
        account: { currency, minor: amountMinor },
        sources: [{
          statementId: statement.id,
          fileHash: statement.fileHash,
          page: 1 + Math.floor(rowIndex / 4),
          row: rowIndex % 4 + 1,
          text: 'SYNTHETIC DEMONSTRATION ONLY',
        }],
        confidence: 1,
        warnings: [],
      }

      return classifyTransaction(normalized)
    }),
  )

  return { cards, statements, transactions }
}
