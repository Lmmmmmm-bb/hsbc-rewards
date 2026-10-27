import { classifyTransaction } from '@/domain/classification/classify'
import type {
  AccountCurrency,
  Card,
  Dataset,
  NormalizedTransaction,
  Statement,
} from '@/domain/model/types'

type DemoRow = [
  id: string,
  day: number,
  card: 'main' | 'additional',
  description: string,
  currency: AccountCurrency,
  amountMinor: number,
  originalCurrency?: string,
  originalMinor?: number,
]

const rows: readonly DemoRow[] = [
  ['01', 20, 'main', 'DEMO RESTAURANT UNIONPAY QR CN', 'CNY', 25000],
  ['02', 18, 'main', 'DEMO SUPERMARKET UNIONPAY QR CN', 'CNY', 75000],
  ['03', 17, 'additional', 'DEMO COFFEE HKG', 'HKD', 25000],
  ['04', 15, 'main', 'DEMO ONLINE SHOP CN', 'CNY', 200000],
  ['05', 14, 'main', 'REFUND DEMO STORE CN', 'CNY', -20000],
  ['06', 12, 'main', 'PAYMENT RECEIVED', 'CNY', -300000],
  ['07', 10, 'main', 'FINANCE CHARGE', 'HKD', 3000],
  ['08', 9, 'additional', 'DEMO TRAVEL STORE JPN', 'HKD', 50000, 'JPY', 1000000],
  ['09', 7, 'additional', 'DEMO UNKNOWN MERCHANT', 'HKD', 15000],
  ['10', 6, 'main', 'DEMO APPLE PAY STORE MO', 'HKD', 10000, 'MOP', 10309],
]

export function createDemoDataset(): Dataset {
  const cards: Card[] = [
    { id: 'demo-main', lastFour: '6228', role: 'primary' },
    { id: 'demo-additional', lastFour: '9056', role: 'additional' },
  ]
  const statements: Statement[] = [
    {
      id: 'demo-main-statement',
      fileName: 'DEMO_Pulse_Main.pdf',
      fileHash: 'demo-not-a-real-file-main',
      date: '2026-10-22',
      period: { from: '2026-09-23', to: '2026-10-22' },
      pageCount: 3,
      templateVersion: 'demo',
      accounts: [
        { id: 'demo-main-CNY', currency: 'CNY', openingMinor: 500000, closingMinor: 483000 },
        { id: 'demo-main-HKD', currency: 'HKD', openingMinor: 200000, closingMinor: 213000 },
      ],
      warnings: [{ code: 'demo.balance-warning' }],
    },
    {
      id: 'demo-additional-statement',
      fileName: 'DEMO_Pulse_Additional.pdf',
      fileHash: 'demo-not-a-real-file-additional',
      date: '2026-10-22',
      period: { from: '2026-09-23', to: '2026-10-22' },
      pageCount: 1,
      templateVersion: 'demo',
      accounts: [
        { id: 'demo-additional-HKD', currency: 'HKD', openingMinor: 100000, closingMinor: 190000 },
      ],
      warnings: [],
    },
  ]
  const transactions = rows.map(
    (
      [
        id,
        day,
        card,
        description,
        currency,
        amountMinor,
        originalCurrency = currency,
        originalMinor = amountMinor,
      ],
      index,
    ) => {
      const statement = statements[card === 'main' ? 0 : 1]
      const normalized: NormalizedTransaction = {
        id: `demo-transaction-${id}`,
        cardId: `demo-${card}`,
        accountId: `demo-${card}-${currency}`,
        transactionDate: `2026-10-${String(day - 1).padStart(2, '0')}`,
        postingDate: `2026-10-${String(day).padStart(2, '0')}`,
        description,
        original: { currency: originalCurrency, minor: originalMinor },
        account: { currency, minor: amountMinor },
        sources: [
          {
            statementId: statement.id,
            fileHash: statement.fileHash,
            page: card === 'additional' ? 1 : day > 10 ? 2 : 3,
            row: index + 1,
            text: 'SYNTHETIC DEMONSTRATION ONLY',
          },
        ],
        confidence: id === '09' ? 0.6 : 1,
        warnings: [],
      }
      return classifyTransaction(normalized)
    },
  )
  return { cards, statements, transactions }
}
