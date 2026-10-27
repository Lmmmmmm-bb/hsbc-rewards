import type { Dataset } from '@/domain/model/types'
import { DomainError } from '@/domain/model/errors'
import type { SessionStore } from '@/application/session/types'
import { mergeImportedDatasets } from './merge'

export function commitImportedBatch(
  store: SessionStore,
  files: readonly Dataset[],
  expectedRevision: number,
) {
  const snapshot = store.getSnapshot()
  if (snapshot.revision !== expectedRevision)
    throw new DomainError('import.session-changed')
  const previous =
    snapshot.mode === 'real'
      ? snapshot.dataset
      : { cards: [], statements: [], transactions: [] }
  const dataset = mergeImportedDatasets(previous, files)
  const fileCount = dataset.statements.length - previous.statements.length
  const transactionCount =
    dataset.transactions.length - previous.transactions.length
  if (fileCount > 0)
    store.replace(
      dataset,
      'real',
      snapshot.mode === 'real' ? snapshot.fx : undefined,
    )
  return { files: fileCount, transactions: Math.max(0, transactionCount) }
}
