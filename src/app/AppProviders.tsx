import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { I18nProvider } from '@/i18n/I18nProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (/^#\/?(import|ledger|rewards|settings)$/.test(window.location.hash)) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])
  return <I18nProvider>{children}</I18nProvider>
}
