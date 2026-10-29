import type { Locale } from './locale'

export const LOCALE_PREFERENCE_KEY = 'pulse.locale.v1'

/** Only an explicitly selected, supported UI language may be persisted. */
export function readLocalePreference(): Locale | null {
  try {
    const value = window.localStorage.getItem(LOCALE_PREFERENCE_KEY)
    return value === 'zh-CN' || value === 'en-US' ? value : null
  } catch {
    // Missing or blocked browser storage falls back to browser preferences.
    return null
  }
}

export function saveLocalePreference(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_PREFERENCE_KEY, locale)
  } catch {
    // The provider still retains the user's selection for the current page.
  }
}
