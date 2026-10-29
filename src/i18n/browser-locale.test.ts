import { afterEach, expect, it, vi } from 'vitest'
import { readBrowserLocale } from './browser-locale'
import { LOCALE_PREFERENCE_KEY } from './browser-preference'

afterEach(() => vi.unstubAllGlobals())

it.each([
  { saved: 'en-US', languages: ['zh-CN'], language: 'zh-CN', expected: 'en-US' },
  { saved: 'zh-CN', languages: ['en-US'], language: 'en-US', expected: 'zh-CN' },
  { saved: 'en-HK', languages: ['zh-TW'], language: 'en-US', expected: 'zh-CN' },
  { saved: null, languages: ['fr-FR', 'en-GB', 'zh-CN'], language: 'zh-CN', expected: 'en-US' },
  { saved: null, languages: [], language: 'en-GB', expected: 'en-US' },
  { saved: null, languages: ['fr-FR'], language: 'en-US', expected: 'zh-CN' },
])('resolves $expected from saved $saved and browser $languages', ({ saved, languages, language, expected }) => {
  const getItem = vi.fn(() => saved)
  const setItem = vi.fn()
  vi.stubGlobal('window', { localStorage: { getItem, setItem } })
  vi.stubGlobal('navigator', { languages, language })

  expect(readBrowserLocale()).toBe(expected)
  expect(getItem).toHaveBeenCalledExactlyOnceWith(LOCALE_PREFERENCE_KEY)
  expect(setItem).not.toHaveBeenCalled()
})

it('uses browser languages when storage is denied, and defaults without browser APIs', () => {
  vi.stubGlobal('window', Object.defineProperty({}, 'localStorage', {
    get() { throw new Error('Storage denied') },
  }))
  vi.stubGlobal('navigator', { languages: ['en-GB'] })
  expect(readBrowserLocale()).toBe('en-US')

  vi.stubGlobal('window', undefined)
  vi.stubGlobal('navigator', undefined)
  expect(readBrowserLocale()).toBe('zh-CN')
})
