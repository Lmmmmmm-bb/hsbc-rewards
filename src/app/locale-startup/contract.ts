import type { Locale } from '../../i18n/locale'

export const PRERENDER_LOCALE_ATTRIBUTE = 'data-prerender-locale'
export const STARTUP_ATTRIBUTE = 'data-locale-startup'
export const ENGLISH_TEMPLATE_ID = 'prerender-en-US'
export const STARTUP_TIMEOUT_MS = 5_000

export interface LocaleStartup {
  activate(): void
  claim(root: HTMLElement): Locale
}

declare global {
  interface Window {
    __rewardLocaleStartup?: LocaleStartup
  }
}

export function prerenderLocale(root: HTMLElement): Locale {
  return root.getAttribute(PRERENDER_LOCALE_ATTRIBUTE) === 'en-US' ? 'en-US' : 'zh-CN'
}
