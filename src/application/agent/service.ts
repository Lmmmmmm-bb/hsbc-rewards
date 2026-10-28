import type { Translate } from '@/i18n/message-types'
import type { SessionStore } from '../session/types'
import type { PdfImportController } from '../import/types'
import { IMPORT_LIMITS } from '../import/limits'
import { LATEST_RULES } from '@/domain/rewards/rules'
import { AGENT_DOCUMENT_PATHS, AGENT_FILE_INPUT_SELECTOR, AGENT_SCHEMA_VERSION, AGENT_TOOLS, type AgentToolName } from './catalog'
import type { AgentAccess } from './access'
import { AgentError, type AgentProblem } from './errors'
import { createAgentSnapshots } from './snapshots'
import { getAgentCardRewards, getAgentSummary } from './reward-queries'
import { listAgentTransactions } from './transaction-query'
import { getAgentQuality } from './quality-query'
import { currentBatchRef, readAgentImport } from './import-query'
import { getAgentRules } from './rules-query'
import { validateAgentInput } from './validate'
import { AGENT_RESPONSE_CHAR_LIMIT } from './contract'
import { createAgentReferences } from './references'

export interface AgentUiActions {
  requestAccess(): void | Promise<void>
  openImport(itemId?: string): void | Promise<void>
  cancelImport(): void
}
interface ToolResult { readonly meta?: { readonly resultToken: string }; readonly data: unknown }
export interface AgentResponse {
  readonly schemaVersion: number
  readonly status: 'ok' | 'needs_user_action' | 'error'
  readonly meta?: { readonly resultToken: string }
  readonly data?: unknown
  readonly error?: { readonly code: string; readonly message: string; readonly nextAction: string }
}

export function createAgentService(deps: {
  store: SessionStore; importer: PdfImportController; access: AgentAccess; ui: AgentUiActions
  nextId: () => string; now: () => number; translate: () => Translate
}) {
  const snapshots = createAgentSnapshots(deps.store, deps.nextId)
  const importReferences = createAgentReferences(deps.nextId)
  let importBatch = deps.importer.getSnapshot().batch
  function currentImport() {
    const batch = deps.importer.getSnapshot()
    if (batch.batch !== importBatch) {
      importReferences.clear()
      importBatch = batch.batch
    }
    return batch
  }
  const importStatus = (expectedBatch?: string) =>
    readAgentImport(currentImport(), importReferences, deps.now(), expectedBatch)
  let disposed = false
  const allowed = () => { if (!deps.access.allowed()) throw new AgentError('access_required') }
  function context() {
    return { schemaVersion: AGENT_SCHEMA_VERSION, mode: deps.store.getSnapshot().mode,
      sharingEnabled: deps.access.allowed(), hasResults: deps.store.getSnapshot().mode !== 'empty',
      importActive: deps.importer.getSnapshot().active, documents: AGENT_DOCUMENT_PATHS,
      fileInput: { selector: AGENT_FILE_INPUT_SELECTOR, accept: 'application/pdf', multiple: true },
      limits: IMPORT_LIMITS, ruleId: LATEST_RULES.id, units: { reward: 'microRC', microRcPerRc: 1_000_000, money: 'minor' } }
  }
  async function run(name: AgentToolName, value: unknown): Promise<ToolResult> {
    switch (name) {
      case 'reward_get_context': validateAgentInput(name, value); return { data: context() }
      case 'reward_get_rules': return { data: getAgentRules(validateAgentInput(name, value), deps.translate()) }
      case 'reward_request_access':
        validateAgentInput(name, value)
        if (!deps.access.allowed()) await deps.ui.requestAccess()
        return { data: { sharingEnabled: deps.access.allowed(), nextAction: deps.access.allowed() ? 'continue' : 'enable_sharing' } }
      case 'reward_open_import': {
        const { fileRef } = validateAgentInput(name, value)
        let itemId: string | undefined
        if (fileRef) {
          allowed()
          const batch = currentImport()
          itemId = importReferences.resolve('file', fileRef)
          if (!batch.items.some((item) => item.id === itemId && item.status !== 'removed')) throw new AgentError('file_not_found')
        }
        await deps.ui.openImport(itemId)
        return { data: { opened: true, fileInputSelector: AGENT_FILE_INPUT_SELECTOR, nextAction: fileRef ? 'handle_file' : 'provide_files' } }
      }
      case 'reward_get_import_status':
        return { data: importStatus(validateAgentInput(name, value).batchRef) }
      case 'reward_cancel_import': {
        const { batchRef } = validateAgentInput(name, value)
        const batch = currentImport()
        if (currentBatchRef(batch, importReferences) !== batchRef) throw new AgentError('batch_changed')
        if (batch.outcome.status !== 'idle' || !batch.items.some((item) => ['queued', 'reading', 'locked', 'parsing', 'parsed'].includes(item.status)))
          throw new AgentError('batch_not_active')
        deps.ui.cancelImport()
        return { data: { cancelledBatchRef: batchRef, previousResultsRetained: true, nextAction: deps.store.getSnapshot().mode === 'empty' ? 'provide_files' : 'read_summary' } }
      }
      case 'reward_get_summary': return getAgentSummary(snapshots, validateAgentInput(name, value))
      case 'reward_get_card_rewards': return getAgentCardRewards(snapshots, validateAgentInput(name, value))
      case 'reward_list_transactions': return listAgentTransactions(snapshots, validateAgentInput(name, value))
      case 'reward_get_quality': return getAgentQuality(snapshots, validateAgentInput(name, value))
    }
  }
  return {
    async execute(name: AgentToolName, value: unknown = {}, signal?: AbortSignal): Promise<AgentResponse> {
      try {
        if (disposed) throw new AgentError('unavailable')
        if (signal?.aborted) throw new AgentError('cancelled')
        validateAgentInput(name, value)
        if (['reward_get_summary', 'reward_get_card_rewards', 'reward_list_transactions', 'reward_get_quality'].includes(name) && deps.store.getSnapshot().mode === 'empty')
          throw new AgentError('no_results')
        if (AGENT_TOOLS[name].dataAccess) allowed()
        const result = await run(name, value)
        if (signal?.aborted) throw new AgentError('cancelled')
        if (disposed) throw new AgentError('unavailable')
        if (AGENT_TOOLS[name].dataAccess) allowed()
        if (result.meta) snapshots.capture(result.meta.resultToken)
        if (JSON.stringify(result).length > AGENT_RESPONSE_CHAR_LIMIT) throw new AgentError('query_too_broad')
        const needsAction = name === 'reward_request_access' && !deps.access.allowed()
        const latest = result.meta ? importStatus() : null
        const meta = result.meta && latest ? { ...result.meta, latestImport: {
          batchRef: latest.batchRef, active: latest.active, outcome: latest.outcome,
          uncommittedFiles: latest.files.filter((file) => ['queued', 'reading', 'locked', 'parsing', 'parsed', 'extracted'].includes(file.status)).length,
          failedFiles: latest.failedFiles, skippedFiles: latest.skippedFiles, partialSuccess: latest.partialSuccess,
        } } : undefined
        return { schemaVersion: AGENT_SCHEMA_VERSION, status: needsAction ? 'needs_user_action' : 'ok', ...result, ...(meta ? { meta } : {}) }
      } catch (error) {
        const code: AgentProblem = error instanceof AgentError ? error.code : 'unavailable'
        const nextAction = code === 'access_required' ? 'request_access' : code === 'no_results' ? 'provide_files'
          : code === 'result_changed' ? 'read_summary' : code === 'ui_busy' ? 'finish_current_dialog' : 'review_request'
        return { schemaVersion: AGENT_SCHEMA_VERSION, status: code === 'access_required' ? 'needs_user_action' : 'error',
          error: { code: `agent.${code}`, message: deps.translate()(`agent.error.${code}`), nextAction } }
      }
    },
    dispose() { disposed = true; snapshots.dispose(); importReferences.clear() },
  }
}
export type AgentService = ReturnType<typeof createAgentService>
