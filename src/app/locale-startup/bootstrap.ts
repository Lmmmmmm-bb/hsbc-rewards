import { readBrowserLocale } from '../../i18n/browser-locale'
import { DEFAULT_LOCALE } from '../../i18n/locale'
import type { Locale } from '../../i18n/locale'
import { applyDocumentMetadata } from '../document-metadata'
import type { DocumentMetadataSnapshot } from '../document-metadata'
import { ENGLISH_TEMPLATE_ID, PRERENDER_LOCALE_ATTRIBUTE, STARTUP_ATTRIBUTE, STARTUP_TIMEOUT_MS, prerenderLocale } from './contract'

/** Runs as a small classic script before the parser reaches the page content. */
export function startLocaleBootstrap(metadata: Record<Locale, DocumentMetadataSnapshot>) {
  if (window.__rewardLocaleStartup) return
  const document = window.document
  let phase: 'pending' | 'ready' | 'fallback' | 'claimed' = 'pending'
  let timeout: number | undefined
  let preferred: Locale = DEFAULT_LOCALE

  const cleanup = () => {
    window.clearTimeout(timeout)
    document.removeEventListener('DOMContentLoaded', fallback)
    document.documentElement.removeAttribute(STARTUP_ATTRIBUTE)
  }
  const removeTemplate = () => document.getElementById(ENGLISH_TEMPLATE_ID)?.remove()
  function fallback() {
    if (phase !== 'pending') return
    phase = 'fallback'
    try {
      applyDocumentMetadata(document, metadata[DEFAULT_LOCALE])
    } catch {
      // Keep the original static page readable even if metadata cannot be updated.
    } finally {
      cleanup()
      removeTemplate()
    }
  }

  window.__rewardLocaleStartup = {
    activate() {
      if (phase !== 'pending') { removeTemplate(); return }
      const root = document.getElementById('root')
      const template = document.getElementById(ENGLISH_TEMPLATE_ID) as HTMLTemplateElement | null
      if (!root?.hasChildNodes() || (preferred === 'en-US' &&
        (template?.tagName !== 'TEMPLATE' || !template.content.querySelector('main')))) {
        fallback()
        return
      }
      const original = [...root.childNodes]
      try {
        if (preferred === 'en-US') root.replaceChildren(template!.content)
        root.setAttribute(PRERENDER_LOCALE_ATTRIBUTE, preferred)
        applyDocumentMetadata(document, metadata[preferred])
        phase = 'ready'
      } catch {
        root.replaceChildren(...original)
        root.setAttribute(PRERENDER_LOCALE_ATTRIBUTE, DEFAULT_LOCALE)
        fallback()
      } finally {
        cleanup()
        removeTemplate()
      }
    },
    claim(root) {
      if (phase === 'pending') fallback()
      phase = 'claimed'
      cleanup()
      return prerenderLocale(root)
    },
  }

  try {
    preferred = readBrowserLocale()
    if (preferred === 'en-US') {
      // Install both recovery paths before hiding any default content.
      timeout = window.setTimeout(fallback, STARTUP_TIMEOUT_MS)
      document.addEventListener('DOMContentLoaded', fallback, { once: true })
      document.documentElement.setAttribute(STARTUP_ATTRIBUTE, 'pending')
    }
  } catch {
    fallback()
  }
}
