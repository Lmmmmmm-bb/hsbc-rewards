import { en } from './en.ts'
import { zh } from './zh.ts'
import type { MessageKey } from './zh.ts'

export type Locale = 'zh-CN' | 'en-HK'
export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string
export const DEFAULT_LOCALE: Locale = 'zh-CN'

export function messagesFor(locale: Locale) {
  return locale === 'zh-CN' ? zh : en
}

export function createTranslator(locale: Locale): Translate {
  const messages = messagesFor(locale)
  return (key, values = {}) =>
    messages[key].replace(/\{(\w+)\}/g, (token, name: string) =>
      values[name] === undefined ? token : String(values[name]),
    )
}
