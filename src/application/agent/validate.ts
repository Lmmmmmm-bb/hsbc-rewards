import { AGENT_TOOLS, type AgentToolName, type FieldSchema } from './catalog'
import type { AgentToolInputs } from './inputs'
import { AgentError } from './errors'

function matches(value: unknown, schema: FieldSchema): boolean {
  if (schema.type === 'string') return typeof value === 'string' &&
    (schema.minLength === undefined || value.length >= schema.minLength) &&
    (schema.maxLength === undefined || value.length <= schema.maxLength) &&
    (!schema.enum || schema.enum.includes(value)) && (!schema.pattern || new RegExp(schema.pattern).test(value))
  if (schema.type === 'integer') return typeof value === 'number' && Number.isSafeInteger(value) &&
    (schema.minimum === undefined || value >= schema.minimum) && (schema.maximum === undefined || value <= schema.maximum)
  if (schema.type === 'boolean') return typeof value === 'boolean'
  return Array.isArray(value) && (schema.maxItems === undefined || value.length <= schema.maxItems) &&
    (!schema.uniqueItems || new Set(value).size === value.length) && value.every((item) => schema.items && matches(item, schema.items))
}

export function validateAgentInput<Name extends AgentToolName>(name: Name, value: unknown): AgentToolInputs[Name] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AgentError('invalid_arguments')
  const schema = AGENT_TOOLS[name].inputSchema
  const object = value as Record<string, unknown>
  if (schema.required.some((key) => !Object.hasOwn(object, key)) ||
    Object.keys(object).some((key) => !Object.hasOwn(schema.properties, key) || !matches(object[key], schema.properties[key])))
    throw new AgentError('invalid_arguments')
  if (name === 'reward_get_summary' && object.cursor && !object.resultToken) throw new AgentError('invalid_arguments')
  return object as AgentToolInputs[Name]
}
