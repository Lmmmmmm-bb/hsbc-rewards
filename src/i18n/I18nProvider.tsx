import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { I18nContext } from './context'
import { createTranslator } from './messages'
import { DEFAULT_LOCALE } from './locale'
import type { Locale } from './locale'
import { saveLocalePreference } from './browser-preference'
import { readBrowserLocale } from './browser-locale'

// No cross-tab subscription: the current page retains its explicit selection.
const subscribe = () => () => {}
const getServerLocale = () => DEFAULT_LOCALE

export function I18nProvider({ children }: { children: ReactNode }) {
  // Retain a lazy reader per provider without reading browser APIs during SSR.
  const [getInitialLocale] = useState(() => {
    let snapshot: Locale | undefined
    return () => (snapshot ??= readBrowserLocale())
  })

  // Hydration first matches the static HTML, then React reads browser preferences.
  const preferredLocale = useSyncExternalStore(
    subscribe,
    getInitialLocale,
    getServerLocale,
  )

  const [selection, setSelection] = useState<Locale | null>(null)
  const locale = selection ?? preferredLocale

  const setLocale = useCallback((next: Locale) => {
    setSelection(next)
    saveLocalePreference(next)
  }, [])

  const value = useMemo(
    () => ({ locale, setLocale, t: createTranslator(locale) }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
