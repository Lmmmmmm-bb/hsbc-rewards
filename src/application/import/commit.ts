import type { Dataset } from '@/domain/model/types'
import { DomainError } from '@/domain/model/errors'
import type { SessionStore } from '@/application/session/types'
import { mergeImportedDatasets } from './merge'
import { validateSessionDataset } from '@/application/session/validate'
import type { ImportCardRole } from './types'

function previousDataset(store: SessionStore, expectedRevision: number): Dataset {
  const snapshot = store.getSnapshot()
  if (snapshot.revision !== expectedRevision)
    throw new DomainError('import.session-changed')
  return snapshot.mode === 'real'
    ? snapshot.dataset
    : { cards: [], statements: [], transactions: [] }
}

/** Cards already link their HKD/CNY subaccounts; never group by last four digits. */
export function reviewImportedCards(
  store: SessionStore,
  files: readonly Dataset[],
  expectedRevision: number,
): ImportCardRole[] {
  const dataset = mergeImportedDatasets(previousDataset(store, expectedRevision), files)
  return dataset.cards.map((card) => ({
    cardId: card.id,
    lastFour: card.lastFour,
    role: card.role === 'unknown'
      ? dataset.cards.length === 1 ? 'primary' : null
      : card.role,
  }))
}

export function commitImportedBatch(
  store: SessionStore,
  files: readonly Dataset[],
  expectedRevision: number,
  roles?: readonly ImportCardRole[],
) {
  const snapshot = store.getSnapshot()
  const previous = previousDataset(store, expectedRevision)
  let dataset = mergeImportedDatasets(previous, files)
  if (roles) {
    const byId = new Map(roles.map((choice) => [choice.cardId, choice.role]))
    if (
      byId.size !== roles.length || byId.size !== dataset.cards.length ||
      dataset.cards.some((card) => !['primary', 'additional'].includes(byId.get(card.id) ?? ''))
    )
      throw new DomainError('import.invalid-card-roles')
    dataset = {
      ...dataset,
      cards: dataset.cards.map((card) => ({
        ...card,
        role: byId.get(card.id)!,
        roleSource: 'user',
        warnings: card.warnings?.filter((warning) => warning.code !== 'card.role-conflict'),
      })),
    }
  }
  const fileCount = dataset.statements.length - previous.statements.length
  const transactionCount =
    dataset.transactions.length - previous.transactions.length
  if (fileCount > 0) {
    validateSessionDataset(
      dataset,
      snapshot.mode === 'real' ? snapshot.fx : undefined,
    )
    store.replace(
      dataset,
      'real',
      snapshot.mode === 'real' ? snapshot.fx : undefined,
    )
  }

  return { files: fileCount, transactions: Math.max(0, transactionCount) }
}
