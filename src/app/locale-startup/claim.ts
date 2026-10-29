import { readBrowserLocale } from '../../i18n/browser-locale'
import { ENGLISH_TEMPLATE_ID, STARTUP_ATTRIBUTE, prerenderLocale } from './contract'

/** Seal static activation before React owns the DOM; never reread its preference. */
export function claimInitialLocale(root: HTMLElement) {
  const startup = window.__rewardLocaleStartup
  try {
    if (startup) return startup.claim(root)
    return root.hasChildNodes() ? prerenderLocale(root) : readBrowserLocale()
  } finally {
    window.document.documentElement.removeAttribute(STARTUP_ATTRIBUTE)
    window.document.getElementById(ENGLISH_TEMPLATE_ID)?.remove()
    delete window.__rewardLocaleStartup
  }
}
