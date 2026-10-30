import type { SessionStore } from '@/application/session/types'
import { createFrankfurterProvider } from '@/adapters/fx/frankfurter'
import { createFxController } from '@/application/fx/controller'
import { createBrowserFxCache } from '@/adapters/fx/browser-cache'

export function createFxRuntime(store: SessionStore) {
  return createFxController({
    store,
    provider: createFrankfurterProvider(),
    cache: createBrowserFxCache(),
  })
}
