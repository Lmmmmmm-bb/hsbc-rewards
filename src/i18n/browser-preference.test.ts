import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  LOCALE_PREFERENCE_KEY,
  readLocalePreference,
  saveLocalePreference,
} from './browser-preference'

afterEach(() => vi.unstubAllGlobals())

function storage(value: string | null) {
  const localStorage = {
    getItem: vi.fn(() => value),
    setItem: vi.fn(),
  }
  vi.stubGlobal('window', { localStorage })

  return localStorage
}

describe('local language preference', () => {
  it.each(['zh-CN', 'en-US'] as const)('reads and saves only the selected %s language', (locale) => {
    const cache = storage(locale)

    expect(readLocalePreference()).toBe(locale)
    expect(cache.getItem).toHaveBeenCalledWith(LOCALE_PREFERENCE_KEY)
    expect(cache.setItem).not.toHaveBeenCalled()

    saveLocalePreference(locale)

    expect(cache.setItem).toHaveBeenCalledExactlyOnceWith(LOCALE_PREFERENCE_KEY, locale)
  })

  it('accepts an earlier English preference without writing during the read', () => {
    const cache = storage('en-HK')

    expect(readLocalePreference()).toBe('en-US')
    expect(cache.setItem).not.toHaveBeenCalled()

    saveLocalePreference('en-US')

    expect(cache.setItem).toHaveBeenCalledExactlyOnceWith(LOCALE_PREFERENCE_KEY, 'en-US')
  })

  it.each([null, '', 'en-GB', 'zh', 'unknown', '{"locale":"en-US"}'])(
    'ignores an absent or unsupported stored value: %s',
    (value) => {
      const cache = storage(value)

      expect(readLocalePreference()).toBeNull()
      expect(cache.setItem).not.toHaveBeenCalled()
    },
  )

  it('tolerates missing browser APIs and denied storage access', () => {
    for (const browser of [undefined, Object.defineProperty({}, 'localStorage', {
      get() { throw new Error('Storage access denied') },
    })]) {
      vi.stubGlobal('window', browser)

      expect(readLocalePreference()).toBeNull()
      expect(() => saveLocalePreference('en-US')).not.toThrow()
    }
  })

  it('tolerates failed reads and writes', () => {
    const cache = storage(null)
    cache.getItem.mockImplementation(() => { throw new Error('Read denied') })
    cache.setItem.mockImplementation(() => { throw new Error('Quota exceeded') })

    expect(readLocalePreference()).toBeNull()
    expect(() => saveLocalePreference('zh-CN')).not.toThrow()
  })
})
