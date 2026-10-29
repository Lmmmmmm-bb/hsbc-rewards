import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { LazyMotion, MotionConfig, domMax } from 'motion/react'
import { I18nProvider } from '@/i18n/I18nProvider'
import type { Locale } from '@/i18n/locale'
import { DocumentMetadata } from './DocumentMetadata'

export function AppProviders({ children, initialLocale }: { children: ReactNode; initialLocale: Locale }) {
  useEffect(() => {
    if (/^#\/?(import|ledger|rewards|settings)$/.test(window.location.hash)) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  return (
    <I18nProvider initialLocale={initialLocale}>
      <DocumentMetadata />
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domMax} strict>
          {children}
        </LazyMotion>
      </MotionConfig>
    </I18nProvider>
  )
}
