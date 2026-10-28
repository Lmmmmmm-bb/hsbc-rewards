import { useEffect } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import { pageMetadata } from './seo'

/** Browser-only document effects; translations stay independent of the application. */
export function DocumentMetadata() {
  const { locale } = useI18n()

  useEffect(() => {
    const metadata = pageMetadata(locale)
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
    ]) {
      document.querySelector(selector)?.setAttribute('content', content)
    }
  }, [locale])

  return null
}
