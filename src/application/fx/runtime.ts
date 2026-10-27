import { sessionStore } from '@/store/memory-session'
import { createFrankfurterProvider } from '@/adapters/fx/frankfurter'
import { createFxController } from './controller'

export const fxController = createFxController({
  store: sessionStore,
  provider: createFrankfurterProvider(),
})
