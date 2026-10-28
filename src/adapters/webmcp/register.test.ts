import { describe, expect, it, vi } from 'vitest'
import { createTranslator } from '@/i18n/messages'
import { AGENT_TOOLS } from '@/application/agent/catalog'
import type { AgentService } from '@/application/agent/service'
import { nativeModelContext, registerAgentTools, type NativeModelContext } from './register'

type NativeTool = Parameters<NativeModelContext['registerTool']>[0]

function context(failAt = -1) {
  const active = new Map<string, NativeTool>()
  let count = 0
  const api: NativeModelContext = { registerTool: vi.fn(async (tool, { signal }) => {
    if (count++ === failAt) throw new Error('Synthetic registration failure')

    active.set(tool.name, tool)
    signal.addEventListener('abort', () => active.delete(tool.name), { once: true })
  }) }

  return { api, active }
}

function service() {
  return { execute: vi.fn(async () => ({ schemaVersion: 1, status: 'ok' as const })), dispose: vi.fn() } satisfies AgentService
}

describe('native WebMCP registration', () => {
  it('registers the catalog and forwards execution cancellation without owning the business session', async () => {
    const { api, active } = context()
    const target = service()
    const lifetime = new AbortController()
    const dispose = await registerAgentTools(api, target, createTranslator('en-US'), lifetime.signal)

    expect([...active.keys()]).toEqual(Object.keys(AGENT_TOOLS))
    expect(active.get('reward_list_transactions')?.annotations.untrustedContentHint).toBe(true)

    const call = new AbortController()
    await active.get('reward_get_summary')!.execute({ periodId: 'all' }, { signal: call.signal })

    expect(target.execute).toHaveBeenCalledWith('reward_get_summary', { periodId: 'all' }, call.signal)

    lifetime.abort()
    dispose()

    expect(active.size).toBe(0)
    expect(target.dispose).not.toHaveBeenCalled()

    await registerAgentTools(api, target, createTranslator('en-US'), new AbortController().signal)

    expect(active.size).toBe(10)
  })

  it('cleans partial registration and skips already-aborted mounts', async () => {
    const { api, active } = context(2)
    const target = service()

    await expect(registerAgentTools(api, target, createTranslator('en-US'), new AbortController().signal)).rejects.toThrow('Synthetic')
    expect(active.size).toBe(0)

    const stopped = new AbortController()
    stopped.abort()
    const untouched = context()
    await registerAgentTools(untouched.api, target, createTranslator('en-US'), stopped.signal)

    expect(untouched.api.registerTool).not.toHaveBeenCalled()
    expect(nativeModelContext({} as Document)).toBeNull()
    expect(nativeModelContext({ modelContext: untouched.api } as unknown as Document)).toBe(untouched.api)
  })
})
