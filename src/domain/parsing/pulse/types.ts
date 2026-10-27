import type { AccountCurrency, Card, Money } from '@/domain/model/types'
import type { TextRow } from '../text-layout'

export interface PulseFile {
  readonly id: string
  readonly fileHash: string
  readonly fileName: string
  readonly size: number
}

/** Raw account numbers are transient parser inputs; only caller-supplied opaque IDs leave parsing. */
export type PulseIdentity = (
  kind: 'card' | 'account',
  accountNumber: string,
) => string

export interface PulseAccount {
  readonly number: string
  readonly cardNumber: string
  readonly currency: AccountCurrency
  openingMinor: number | null
  closingMinor: number
}

export interface PulseProgram {
  readonly multiplier: number
  readonly effectivePeriod: {
    readonly from: string
    readonly to: string
  } | null
}

export interface PulseMetadata {
  readonly date: string
  readonly period: { readonly from: string; readonly to: string }
  readonly accounts: ReadonlyMap<string, PulseAccount>
  readonly pageAccounts: ReadonlyMap<number, string>
  readonly programs: ReadonlyMap<string, PulseProgram>
  readonly roles: ReadonlyMap<string, Card['role']>
}

export interface PulseRow {
  readonly accountNumber: string
  readonly cardNumber: string
  readonly postingDate: string
  readonly transactionDate: string
  description: string
  readonly minor: number
  original: Money | null
  bankHkdEquivalentMinor?: number
  readonly sourceRows: { readonly page: number; readonly row: TextRow }[]
  readonly warningCodes: string[]
  confidence: number
  readonly paymentLines: string[]
}
