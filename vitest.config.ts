import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: 'unit',
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx}'],
      clearMocks: true,
      restoreMocks: true,
    },
  }),
)
