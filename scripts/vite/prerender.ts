import react from '@vitejs/plugin-react'
import { createServer } from 'vite'
import type { Plugin, ResolvedConfig } from 'vite'

const outlet = '<!--app-html-->'

export function prerender(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'reward-prerender',
    configResolved(resolved) {
      config = resolved
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        if (!html.includes(outlet)) throw new Error('Missing pre-render outlet in index.html.')
        if (config.command !== 'build') return html.replace(outlet, '')

        const server = await createServer({
          configFile: false,
          root: config.root,
          mode: config.mode,
          // Keep injected build transforms consistent across SSR and the browser.
          plugins: [react(), config.inlineConfig.plugins],
          resolve: { alias: config.resolve.alias },
          server: { middlewareMode: true, hmr: false, watch: null },
          optimizeDeps: { noDiscovery: true, include: [] },
          logLevel: 'error',
        })
        try {
          const { renderPage } = await server.ssrLoadModule('/src/app/prerender.tsx')
          return html.replace(outlet, () => renderPage())
        } finally {
          await server.close()
        }
      },
    },
  }
}
