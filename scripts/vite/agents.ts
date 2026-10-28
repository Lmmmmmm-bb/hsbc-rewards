import type { Plugin } from 'vite'
import { createAgentDocuments } from '../../src/app/agent-documents.ts'
import { AGENT_DOCUMENT_PATHS } from '../../src/application/agent/contract.ts'

/** Emits public, session-independent documentation and serves the same content during development. */
export function agentDocuments({ originTrialToken }: { originTrialToken?: string } = {}): Plugin {
  const documents = createAgentDocuments()
  return {
    name: 'reward-agent-documents',
    transformIndexHtml() {
      return [
        { tag: 'link', attrs: { rel: 'describedby', href: AGENT_DOCUMENT_PATHS.overview }, injectTo: 'head' as const },
        ...(originTrialToken ? [{ tag: 'meta', attrs: { 'http-equiv': 'origin-trial', content: originTrialToken }, injectTo: 'head' as const }] : []),
      ]
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split('?')[0] ?? ''
        if (!Object.hasOwn(documents, path)) { next(); return }
        response.setHeader('Content-Type', 'text/plain; charset=utf-8')
        response.setHeader('Cache-Control', 'no-cache')
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          response.writeHead(405, { Allow: 'GET, HEAD' })
          response.end()
          return
        }
        response.end(request.method === 'HEAD' ? undefined : documents[path])
      })
    },
    generateBundle() {
      for (const [path, source] of Object.entries(documents))
        this.emitFile({ type: 'asset', fileName: path.slice(1), source })
    },
  }
}
