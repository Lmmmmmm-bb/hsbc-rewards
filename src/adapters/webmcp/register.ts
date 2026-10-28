import { AGENT_TOOLS, type AgentToolName, type ToolInputSchema } from '@/application/agent/catalog'
import type { AgentService } from '@/application/agent/service'
import type { Translate } from '@/i18n/message-types'

export interface NativeModelContext {
  registerTool(tool: { name: string; description: string; inputSchema: ToolInputSchema;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean; consequentialHint: boolean };
    execute(input: unknown, options?: { signal: AbortSignal }): Promise<unknown> }, options: { signal: AbortSignal }): Promise<void>
}

export function nativeModelContext(document: Document): NativeModelContext | null {
  const context = (document as Document & { modelContext?: NativeModelContext }).modelContext
  return context && typeof context.registerTool === 'function' ? context : null
}

/** Own registration only. Aborting this scope never clears a session or cancels an import. */
export async function registerAgentTools(context: NativeModelContext, service: AgentService, t: Translate, signal: AbortSignal) {
  const registration = new AbortController()
  const abort = () => registration.abort()
  signal.addEventListener('abort', abort, { once: true })
  const dispose = () => { registration.abort(); signal.removeEventListener('abort', abort) }
  try {
    for (const name of Object.keys(AGENT_TOOLS) as AgentToolName[]) {
      if (signal.aborted) { dispose(); return dispose }
      const tool = AGENT_TOOLS[name]
      await context.registerTool({ name, description: t(tool.descriptionKey), inputSchema: tool.inputSchema,
        annotations: tool.annotations, execute: (input, options) => service.execute(name, input, options?.signal) },
      { signal: registration.signal })
    }

    return dispose
  } catch (error) {
    dispose()
    throw error
  }
}
