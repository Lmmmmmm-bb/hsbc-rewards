import { StrictMode } from 'react'
import App from '@/App'
import { AppProviders } from './AppProviders'
import type { Locale } from '@/i18n/locale'

/** Shared composition keeps pre-rendering and browser hydration in sync. */
export function AppRoot({ initialLocale }: { initialLocale: Locale }) {
  return (
    <StrictMode>
      <AppProviders initialLocale={initialLocale}>
        <App />
      </AppProviders>
    </StrictMode>
  )
}
