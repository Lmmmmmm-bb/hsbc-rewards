import type { PdfErrorCode, PdfSource, PdfReader, PdfTextPage } from '@/ports/pdf'
import type { InputError, PasswordGate } from './limits'

export type ImportProblem = InputError | PdfErrorCode | 'duplicate' | 'batch-busy'
export interface ImportItem {
  readonly id: string
  readonly name: string
  readonly size: number
  readonly status: 'queued' | 'reading' | 'locked' | 'extracted' | 'error' | 'duplicate' | 'removed'
  readonly problem: ImportProblem | null
  readonly completedPages: number
  readonly totalPages: number | null
  readonly textRows: number
  readonly gate: PasswordGate
}
export interface ImportSnapshot {
  readonly batch: number
  readonly active: boolean
  readonly items: readonly ImportItem[]
  readonly rejected: ImportProblem | null
}
export interface ImportDependencies {
  readonly reader: PdfReader
  readonly fingerprint: (bytes: ArrayBuffer) => Promise<string>
  readonly now: () => number
  readonly existing: () => { hashes: readonly string[]; files: number; bytes: number }
}
export interface PdfImportController {
  getSnapshot(): ImportSnapshot
  subscribe(listener: () => void): () => void
  start(files: readonly PdfSource[]): void
  unlock(id: string, password: string): void
  retry(id: string): void
  remove(id: string): void
  cancel(): void
  preview(id: string): readonly PdfTextPage[] | null
}
