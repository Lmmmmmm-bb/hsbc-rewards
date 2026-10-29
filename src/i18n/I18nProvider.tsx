import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { I18nContext } from './context'
import { createTranslator } from './messages'
import type { Locale } from './locale'
import { saveLocalePreference } from './browser-preference'

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale: Locale }) {
  // The entry owns browser reads; SSR and hydration receive the same snapshot.
  const [locale, setSelection] = useState(initialLocale)

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
