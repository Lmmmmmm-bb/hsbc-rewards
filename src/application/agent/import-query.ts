import { passwordWaitSeconds } from '../import/limits'
import type { ImportSnapshot } from '../import/types'
import type { AgentReferences } from './references'
import { AgentError } from './errors'
import type { AgentPagination, PageInput } from './pagination'

export interface ImportStatusInput extends PageInput { readonly batchRef?: string }

export function currentBatchRef(batch: ImportSnapshot, references: AgentReferences) {
  return references.get('batch', String(batch.batch))
}

export function summarizeAgentImport(batch: ImportSnapshot, references: AgentReferences, now: number, expectedBatch?: string) {
  const batchRef = currentBatchRef(batch, references)
  if (expectedBatch !== undefined && expectedBatch !== batchRef) throw new AgentError('batch_changed')

  const items = batch.items.filter((item) => item.status !== 'removed')
  const locked = items.filter((item) => item.status === 'locked')
  const failedFiles = items.filter((item) => item.status === 'error').length
  const processing = batch.outcome.status === 'idle' && items.some((item) => ['queued', 'reading', 'parsing', 'parsed'].includes(item.status))
  const nextAction = locked.length ? locked.some((item) => passwordWaitSeconds(item.gate, now) === 0) ? 'user_unlock' : 'wait_for_cooldown'
    : processing ? 'wait' : failedFiles || batch.outcome.status === 'failed' ? 'review_failed_files' : batch.outcome.status === 'committed' ? 'read_summary' : 'provide_files'

  return {
    batchRef,
    active: batch.active || processing,
    outcome: { ...batch.outcome },
    successfulFiles: batch.outcome.status === 'committed' ? batch.outcome.files : 0,
    failedFiles,
    skippedFiles: items.filter((item) => item.status === 'duplicate').length,
    partialSuccess: batch.outcome.status === 'committed' && failedFiles > 0,
    rejected: batch.rejected,
    nextAction,
    pollAfterMs: nextAction === 'wait' ? 1000 : null,
    uncommittedFiles: batch.outcome.status === 'idle'
      ? items.filter((item) => ['queued', 'reading', 'locked', 'parsing', 'parsed', 'extracted'].includes(item.status)).length : 0,
    totalCount: items.length,
  }
}

export function readAgentImport(batch: ImportSnapshot, references: AgentReferences, now: number,
  input: ImportStatusInput, pagination: AgentPagination) {
  if (input.cursor && !input.batchRef) throw new AgentError('invalid_arguments')
  const summary = summarizeAgentImport(batch, references, now, input.batchRef)
  const visible = batch.items.map((item, index) => ({ item, selectionIndex: index + 1 }))
    .filter(({ item }) => item.status !== 'removed')
  // Progress may change between polls, but removing entries must not silently shift a cursor.
  const page = pagination.page(visible, input, JSON.stringify([summary.batchRef, visible.map(({ item }) => item.id)]))
  return { ...summary, nextCursor: page.nextCursor,
    files: page.items.map(({ item, selectionIndex }) => ({ fileRef: references.get('file', item.id), selectionIndex,
      status: item.status, problem: item.problem, completedPages: item.completedPages, totalPages: item.totalPages,
      retryAfterSeconds: passwordWaitSeconds(item.gate, now) })),
  }
}
