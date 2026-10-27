export type AccountCurrency = 'HKD' | 'CNY'
export type TransactionKind = 'purchase' | 'refund' | 'repayment' | 'fee' | 'cash-advance' | 'credit'
export type Category = 'dining' | 'groceries' | 'shopping' | 'travel' | 'transport' | 'other' | 'refund' | 'repayment' | 'fee' | 'cash-advance'
export type PaymentMethod = 'standard' | 'apple-pay' | 'google-pay' | 'samsung-pay' | 'unionpay-qr' | 'unknown'

export interface Money {
  readonly currency: string
  readonly minor: number
}

export interface Bounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface SourceReference {
  readonly statementId: string
  readonly fileHash: string
  readonly page: number
  readonly row: number
  readonly text: string
  readonly bounds?: Bounds
}

export interface DomainWarning {
  readonly code: string
  readonly source?: SourceReference
}

export interface Card {
  readonly id: string
  readonly lastFour: string
  readonly holderName?: string
  readonly role: 'primary' | 'additional' | 'unknown'
  readonly pool?: {
    readonly id: string
    readonly evidence: 'statement-account' | 'bank-identifier'
  }
  readonly abroadEnrollment?: 'registered' | 'not-registered'
  readonly abroadMultiplier?: number
}

export interface StatementAccount {
  readonly id: string
  readonly currency: AccountCurrency
  readonly openingMinor: number | null
  readonly closingMinor: number | null
}

export interface Statement {
  readonly id: string
  readonly fileHash: string
  readonly fileName: string
  readonly date: string
  readonly period: { readonly from: string; readonly to: string }
  readonly pageCount: number
  readonly templateVersion: string
  readonly accounts: readonly StatementAccount[]
  readonly warnings: readonly DomainWarning[]
}

export interface NormalizedTransaction {
  readonly id: string
  readonly cardId: string
  readonly accountId: string
  readonly transactionDate: string
  readonly postingDate: string
  readonly description: string
  readonly original: Money
  readonly account: Money & { readonly currency: AccountCurrency }
  readonly bankReference?: string
  readonly sources: readonly SourceReference[]
  readonly confidence: number
  readonly warnings: readonly DomainWarning[]
}

export interface Classification {
  readonly kind: TransactionKind
  readonly category: Category
  readonly region: string | null
  readonly paymentMethod: PaymentMethod
  readonly eligible: boolean
  readonly reasonCodes: readonly string[]
}

export interface Transaction extends NormalizedTransaction {
  readonly classification: Classification
}

export interface Dataset {
  readonly cards: readonly Card[]
  readonly statements: readonly Statement[]
  readonly transactions: readonly Transaction[]
}
