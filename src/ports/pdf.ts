import type { TextPage } from '@/domain/parsing/text-layout'

export interface PdfSource {
  readonly name: string
  readonly size: number
  readonly type: string
  arrayBuffer(): Promise<ArrayBuffer>
}

export type PdfTextPage = TextPage

export interface LocalPdfDocument {
  readonly pages: readonly PdfTextPage[]
  dispose(): Promise<void>
}

export type PdfErrorCode =
  | 'password-required'
  | 'password-incorrect'
  | 'invalid-pdf'
  | 'too-many-pages'
  | 'no-text'
  | 'aborted'
  | 'read-failed'
  | 'engine-unavailable'

export class PdfReadError extends Error {
  readonly code: PdfErrorCode
  constructor(code: PdfErrorCode) {
    super(code)
    this.name = 'PdfReadError'
    this.code = code
  }
}

export interface PdfReadOptions {
  readonly signal: AbortSignal
  readonly password?: string
  readonly maxPages: number
  readonly onProgress: (completed: number, total: number) => void
}

export interface PdfReader {
  read(bytes: ArrayBuffer, options: PdfReadOptions): Promise<LocalPdfDocument>
}
