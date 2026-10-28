import type { MessageKey } from '../../i18n/zh.ts'
import { AGENT_PAGE_LIMIT } from './contract.ts'
export { AGENT_SCHEMA_VERSION, AGENT_DOCUMENT_PATHS, AGENT_FILE_INPUT_SELECTOR } from './contract.ts'

export interface FieldSchema {
  readonly type: 'string' | 'integer' | 'boolean' | 'array'
  readonly enum?: readonly string[]
  readonly pattern?: string
  readonly minLength?: number
  readonly maxLength?: number
  readonly minimum?: number
  readonly maximum?: number
  readonly maxItems?: number
  readonly uniqueItems?: boolean
  readonly items?: FieldSchema
}

export interface ToolInputSchema {
  readonly type: 'object'
  readonly properties: Readonly<Record<string, FieldSchema>>
  readonly required: readonly string[]
  readonly additionalProperties: false
}

export interface AgentToolDefinition {
  readonly descriptionKey: Extract<MessageKey, `agent.tool.${string}`>
  readonly inputSchema: ToolInputSchema
  readonly dataAccess: boolean
  readonly annotations: { readonly readOnlyHint: boolean; readonly untrustedContentHint: boolean; readonly consequentialHint: boolean }
}

const ref = { type: 'string', minLength: 1, maxLength: 160 } as const
const periodId = { type: 'string', pattern: '^(all|[0-9]{4}-H[12])$' } as const
const page = { cursor: ref, limit: { type: 'integer', minimum: 1, maximum: AGENT_PAGE_LIMIT } as const }
const scope = { periodId, cardRef: ref }

function tool(descriptionKey: AgentToolDefinition['descriptionKey'], properties: ToolInputSchema['properties'], required: readonly string[] = [],
  options: { dataAccess?: boolean; write?: boolean; untrusted?: boolean; consequential?: boolean } = {}): AgentToolDefinition {
  return { descriptionKey, inputSchema: { type: 'object', properties, required, additionalProperties: false },
    dataAccess: options.dataAccess ?? false,
    annotations: { readOnlyHint: !options.write, untrustedContentHint: options.untrusted ?? false, consequentialHint: options.consequential ?? false } }
}

/** One catalog drives registration, argument validation, and public reference generation. */
export const AGENT_TOOLS = {
  reward_get_context: tool('agent.tool.context', {}),
  reward_get_rules: tool('agent.tool.rules', { topic: { type: 'string', enum: ['overview', 'eligibility', 'caps', 'assumptions', 'sources'] } }),
  reward_request_access: tool('agent.tool.access', {}, [], { write: true }),
  reward_open_import: tool('agent.tool.openImport', { fileRef: ref }, [], { write: true }),
  reward_get_import_status: tool('agent.tool.importStatus', { batchRef: ref, ...page }, [], { dataAccess: true }),
  reward_cancel_import: tool('agent.tool.cancelImport', { batchRef: ref }, ['batchRef'], { dataAccess: true, write: true, consequential: true }),
  reward_get_summary: tool('agent.tool.summary', { periodId, resultToken: ref, ...page }, [], { dataAccess: true }),
  reward_get_card_rewards: tool('agent.tool.card', { ...scope, resultToken: ref }, ['cardRef', 'resultToken'], { dataAccess: true }),
  reward_list_transactions: tool('agent.tool.transactions', { ...scope, ...page, resultToken: ref,
    component: { type: 'string', enum: ['basic', 'abroad', 'pulse'] },
    flags: { type: 'array', maxItems: 4, uniqueItems: true, items: { type: 'string', enum: ['pending', 'uncertain', 'excluded', 'capped'] } },
    includeDescription: { type: 'boolean' } }, ['resultToken'], { dataAccess: true, untrusted: true }),
  reward_get_quality: tool('agent.tool.quality', { ...scope, ...page, resultToken: ref }, ['resultToken'], { dataAccess: true }),
} as const

export type AgentToolName = keyof typeof AGENT_TOOLS
