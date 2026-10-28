import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { I18nProvider } from '@/i18n/I18nProvider'
import { DocumentMetadata } from './DocumentMetadata'

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (/^#\/?(import|ledger|rewards|settings)$/.test(window.location.hash)) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])
  return (
    <I18nProvider>
      <DocumentMetadata />
      {children}
    </I18nProvider>
  )
}
