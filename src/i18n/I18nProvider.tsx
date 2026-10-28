import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { I18nContext } from './context'
import { createTranslator, DEFAULT_LOCALE } from './messages'
import type { Locale } from './messages'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)
  const value = useMemo(
    () => ({ locale, setLocale, t: createTranslator(locale) }),
    [locale],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
