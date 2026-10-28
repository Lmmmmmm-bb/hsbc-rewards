import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { prerender } from './scripts/vite/prerender.ts'
import { seo } from './scripts/vite/seo.ts'
import { agentDocuments } from './scripts/vite/agents.ts'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    prerender(),
    seo({ indexable: process.env.VERCEL_ENV !== 'preview' }),
    agentDocuments({ originTrialToken: process.env.WEBMCP_ORIGIN_TRIAL_TOKEN }),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-runtime',
              test: /[\\/]node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
              priority: 20,
            },
            {
              // Match the engine only: the reader, worker URL and support assets
              // keep their existing lazy boundary and independent lifecycles.
              name: 'pdf-engine',
              test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]build[\\/]pdf\.mjs$/,
              priority: 10,
            },
            {
              // Cache stable UI code without promoting dialog-only dependencies.
              name: 'ui-runtime',
              test: /[\\/]node_modules[\\/](?:motion|framer-motion|motion-dom|motion-utils|@base-ui[\\/](?:react|utils)|@floating-ui[\\/][^\\/]+|cn|clsx|class-variance-authority|use-sync-external-store)[\\/]/,
              tags: ['$initial'],
              priority: 5,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
