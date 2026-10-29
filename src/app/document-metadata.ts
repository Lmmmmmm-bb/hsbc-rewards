import type { Locale } from '../i18n/locale'

export interface DocumentMetadataSnapshot {
  locale: Locale
  title: string
  description: string
  imageAlt: string
  socialLocale: string
}

/** Apply the same metadata during static activation and later language changes. */
export function applyDocumentMetadata(document: Document, metadata: DocumentMetadataSnapshot) {
  document.documentElement.lang = metadata.locale
  document.title = metadata.title
  for (const [selector, content] of [
    ['meta[name="description"]', metadata.description],
    ['meta[property="og:title"]', metadata.title],
    ['meta[property="og:description"]', metadata.description],
    ['meta[property="og:locale"]', metadata.socialLocale],
    ['meta[property="og:image:alt"]', metadata.imageAlt],
    ['meta[name="twitter:title"]', metadata.title],
    ['meta[name="twitter:description"]', metadata.description],
    ['meta[name="twitter:image:alt"]', metadata.imageAlt],
  ]) document.querySelector(selector)?.setAttribute('content', content)
}
