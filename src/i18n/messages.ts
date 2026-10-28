import { en } from './en.ts'
import { zh } from './zh.ts'
import type { MessageKey } from './zh.ts'
import type { Locale } from './locale.ts'
import type { MessageValues, Translate } from './message-types.ts'

export function messagesFor(locale: Locale) {
  return locale === 'zh-CN' ? zh : en
}

export function createTranslator(locale: Locale): Translate {
  const messages = messagesFor(locale)
  return (key: MessageKey, values: MessageValues = {}) => {
    const message = messages[key]
    const template = typeof message === 'function' ? message(values) : message

    return template.replace(/\{(\w+)\}/g, (_, name: string) => {
      if (values[name] === undefined) throw new Error('i18n.missing-parameter')
      return String(values[name])
    })
  }
}
