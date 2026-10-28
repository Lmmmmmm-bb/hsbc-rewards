import { createContext } from 'react'
import type { Locale } from './locale'
import type { Translate } from './message-types'

export const I18nContext = createContext<{
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translate
} | null>(null)
