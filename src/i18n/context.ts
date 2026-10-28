import { createContext } from 'react'
import type { Locale, Translate } from './messages'

export const I18nContext = createContext<{
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translate
} | null>(null)
