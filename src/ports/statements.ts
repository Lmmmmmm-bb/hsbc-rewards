import type { Dataset } from '@/domain/model/types'
import type { TextPage } from '@/domain/parsing/text-layout'

export interface StatementDocument {
  readonly id: string
  readonly fileHash: string
  readonly fileName: string
  readonly size: number
}

export interface StatementParser {
  parse(
    pages: readonly TextPage[],
    source: StatementDocument,
    signal: AbortSignal,
  ): Promise<Dataset>
}
