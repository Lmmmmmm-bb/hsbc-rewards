import { sessionStore } from '@/store/memory-session'
import { createFrankfurterProvider } from '@/adapters/fx/frankfurter'
import { createFxController } from './controller'
import { createBrowserFxCache } from '@/adapters/fx/browser-cache'

export const fxController = createFxController({
  store: sessionStore,
  provider: createFrankfurterProvider(),
  cache: createBrowserFxCache(),
})
