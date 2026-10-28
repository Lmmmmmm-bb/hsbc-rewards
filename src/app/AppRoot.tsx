import { StrictMode } from 'react'
import App from '@/App'
import { AppProviders } from './AppProviders'

/** Shared composition keeps pre-rendering and browser hydration in sync. */
export function AppRoot() {
  return (
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>
  )
}
