import { createContext } from 'react'
import type { MessageKey } from './zh'

export type Locale = 'zh-CN' | 'en-HK'
export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string
export const I18nContext = createContext<{
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translate
} | null>(null)
