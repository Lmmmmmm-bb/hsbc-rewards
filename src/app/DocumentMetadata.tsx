import { useEffect } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import { pageMetadata } from './seo'
import { applyDocumentMetadata } from './document-metadata'

/** Browser-only document effects; translations stay independent of the application. */
export function DocumentMetadata() {
  const { locale } = useI18n()

  useEffect(() => {
    applyDocumentMetadata(document, pageMetadata(locale))
  }, [locale])

  return null
}
