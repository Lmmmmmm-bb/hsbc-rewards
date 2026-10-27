import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { en } from './en'
import { zh } from './zh'
import { I18nContext } from './context'
import type { Locale, Translate } from './context'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('zh-CN')
  const value = useMemo(() => {
    const messages = locale === 'zh-CN' ? zh : en
    const t: Translate = (key, values = {}) =>
      messages[key].replace(/\{(\w+)\}/g, (token, name: string) =>
        values[name] === undefined ? token : String(values[name]),
      )
    return { locale, setLocale, t }
  }, [locale])
  useEffect(() => {
    document.documentElement.lang = locale
    document.title = `Pulse Rewards · ${value.t('app.title')}`
  }, [locale, value])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
