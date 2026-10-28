import { passwordWaitSeconds } from '../import/limits'
import type { ImportSnapshot } from '../import/types'
import type { AgentReferences } from './references'
import { AgentError } from './errors'

export function currentBatchRef(batch: ImportSnapshot, references: AgentReferences) {
  return references.get('batch', String(batch.batch))
}

export function readAgentImport(batch: ImportSnapshot, references: AgentReferences, now: number, expectedBatch?: string) {
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
    files: items.map((item) => ({ fileRef: references.get('file', item.id), selectionIndex: batch.items.indexOf(item) + 1,
      status: item.status, problem: item.problem, completedPages: item.completedPages, totalPages: item.totalPages,
      retryAfterSeconds: passwordWaitSeconds(item.gate, now) })),
  }
}
