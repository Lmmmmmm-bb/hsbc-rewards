import type {
  PdfErrorCode,
  PdfSource,
  PdfReader,
  PdfTextPage,
} from '@/ports/pdf'
import type { InputError, PasswordGate } from './limits'
import type { Card, Dataset } from '@/domain/model/types'
import type { StatementParser } from '@/ports/statements'

export type ImportProblem =
  | InputError
  | PdfErrorCode
  | 'duplicate'
  | 'batch-busy'
  | 'unsupported-statement'
  | 'invalid-statement'

export interface ImportItem {
  readonly id: string
  readonly name: string
  readonly size: number
  readonly status:
    | 'queued'
    | 'reading'
    | 'locked'
    | 'extracted'
    | 'parsing'
    | 'parsed'
    | 'imported'
    | 'error'
    | 'duplicate'
    | 'removed'
  readonly problem: ImportProblem | null
  readonly completedPages: number
  readonly totalPages: number | null
  readonly textRows: number
  readonly transactions: number
  readonly gate: PasswordGate
}

export interface ImportSnapshot {
  readonly batch: number
  readonly active: boolean
  readonly items: readonly ImportItem[]
  readonly rejected: ImportProblem | null
  readonly cardReview?: {
    readonly id: number
    readonly cards: readonly ImportCardRole[]
  }
  readonly outcome: {
    readonly status: 'idle' | 'committed' | 'empty' | 'failed'
    readonly files: number
    readonly transactions: number
    readonly problem?: 'session-changed' | 'commit-failed'
  }
}

export interface ImportCardRole {
  readonly cardId: string
  readonly lastFour: string
  readonly role: Exclude<Card['role'], 'unknown'> | null
}

export interface ImportDependencies {
  readonly reader: PdfReader
  readonly fingerprint: (bytes: ArrayBuffer) => Promise<string>
  readonly now: () => number
  readonly yieldTask?: () => Promise<void>
  readonly existing: () => {
    hashes: readonly string[]
    files: number
    bytes: number
    revision?: number
  }
  readonly parser?: StatementParser
  readonly reviewCards?: (files: readonly Dataset[], expectedRevision: number) => readonly ImportCardRole[]
  readonly commit?: (
    files: readonly Dataset[],
    expectedRevision: number,
    roles?: readonly ImportCardRole[],
  ) => { files: number; transactions: number }
}

export interface PdfImportController {
  getSnapshot(): ImportSnapshot
  subscribe(listener: () => void): () => void
  start(files: readonly PdfSource[]): void
  unlock(id: string, password: string): void
  retry(id: string): void
  remove(id: string): void
  cancel(): void
  setCardRole(reviewId: number, cardId: string, role: NonNullable<ImportCardRole['role']>): void
  confirmCards(reviewId: number): void
  preview(id: string): readonly PdfTextPage[] | null
}
