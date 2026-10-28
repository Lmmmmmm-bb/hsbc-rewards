import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, resolveLocale } from './locale'

describe('browser language matching', () => {
  it.each([
    [['zh'], 'zh-CN'],
    [['zh-HK'], 'zh-CN'],
    [['zh-Hant-TW'], 'zh-CN'],
    [['en'], 'en-US'],
    [['en-US'], 'en-US'],
    [['en-HK'], 'en-US'],
    [['EN-gb'], 'en-US'],
    [['en-US', 'zh-CN'], 'en-US'],
    [['zh-TW', 'en-GB'], 'zh-CN'],
    [['fr-FR', 'en-GB', 'zh-CN'], 'en-US'],
    [['fr-FR', 'zh-HK', 'en-US'], 'zh-CN'],
  ] as const)('matches ordered preferences %j to %s', (languages, expected) => {
    expect(resolveLocale(languages)).toBe(expected)
  })

  it('uses the default when no supported language is present', () => {
    for (const languages of [[], ['fr-FR', 'ja-JP'], ['', 'english', 'zhongwen']]) {
      expect(resolveLocale(languages)).toBe(DEFAULT_LOCALE)
    }
  })
})
