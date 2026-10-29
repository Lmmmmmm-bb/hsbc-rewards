import { readLocalePreference } from './browser-preference'
import { resolveLocale } from './locale'

/** Resolve the page's initial UI language without writing a preference. */
export function readBrowserLocale() {
  const saved = readLocalePreference()
  if (saved) return saved

  const preferences = globalThis.navigator
  const languages = preferences?.languages
  return resolveLocale(
    languages?.length
      ? languages
      : [preferences?.language ?? ''],
  )
}
