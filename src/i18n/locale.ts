export type Locale = 'zh-CN' | 'en-US'

export const DEFAULT_LOCALE: Locale = 'zh-CN'

/** Use the first supported language in the browser's ordered preferences. */
export function resolveLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const primary = language.trim().toLowerCase().split(/[-_]/)[0]
    if (primary === 'zh') return 'zh-CN'
    if (primary === 'en') return 'en-US'
  }
  return DEFAULT_LOCALE
}
