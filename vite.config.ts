import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { prerender } from './scripts/vite/prerender.ts'
import { seo } from './scripts/vite/seo.ts'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    prerender(),
    seo({ indexable: process.env.VERCEL_ENV !== 'preview' }),
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
