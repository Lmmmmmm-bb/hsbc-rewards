import { JSDOM } from 'jsdom'
import { afterEach, expect, it, vi } from 'vitest'
import { LOCALE_PREFERENCE_KEY } from '../../i18n/browser-preference'
import { pageMetadata } from '../seo'
import { startLocaleBootstrap } from './bootstrap'
import { claimInitialLocale } from './claim'
import { ENGLISH_TEMPLATE_ID, PRERENDER_LOCALE_ATTRIBUTE, STARTUP_ATTRIBUTE, STARTUP_TIMEOUT_MS } from './contract'

let dom: JSDOM | undefined
const metadata = { 'zh-CN': pageMetadata('zh-CN'), 'en-US': pageMetadata('en-US') }

function page(saved: string | null = 'en-US', languages = ['zh-CN']) {
  dom = new JSDOM(`<!doctype html><html lang="zh-CN"><head><title>Chinese</title>
    <meta name="description" content=""><meta property="og:locale" content=""></head><body>
    <div id="root" ${PRERENDER_LOCALE_ATTRIBUTE}="zh-CN"><main><h1>Chinese</h1></main></div>
    <template id="${ENGLISH_TEMPLATE_ID}"><main><h1>English</h1></main></template></body></html>`, {
    url: 'https://rewards.lmmmmmm.dev/',
  })
  const { window } = dom
  Object.defineProperty(window.navigator, 'languages', { value: languages })
  if (saved !== null) window.localStorage.setItem(LOCALE_PREFERENCE_KEY, saved)
  vi.stubGlobal('window', window)
  vi.stubGlobal('navigator', window.navigator)
  vi.stubGlobal('document', window.document)
  return window.document.getElementById('root')!
}

afterEach(() => {
  dom?.window.__rewardLocaleStartup?.claim(dom.window.document.getElementById('root')!)
  dom?.window.close()
  dom = undefined
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it.each([
  ['zh-CN', ['en-US'], 'zh-CN'],
  ['en-US', ['zh-CN'], 'en-US'],
  [null, ['en-GB'], 'en-US'],
  ['en-HK', ['zh-TW'], 'zh-CN'],
] as const)('activates %s / %j as %s before React, reading once', (saved, languages, expected) => {
  const root = page(saved, [...languages])
  const original = root.firstChild
  const read = vi.spyOn(dom!.window.Storage.prototype, 'getItem')
  const write = vi.spyOn(dom!.window.Storage.prototype, 'setItem')
  startLocaleBootstrap(metadata)
  const handle = window.__rewardLocaleStartup!
  const guarded = document.documentElement.getAttribute(STARTUP_ATTRIBUTE)
  expect(guarded).toBe(expected === 'en-US' ? 'pending' : null)
  expect(document.querySelectorAll('h1')).toHaveLength(1)
  handle.activate()
  expect(root.textContent).toBe(expected === 'en-US' ? 'English' : 'Chinese')
  if (expected === 'zh-CN') expect(root.firstChild).toBe(original)
  expect(document.documentElement.lang).toBe(expected)
  expect(document.title).toBe(metadata[expected].title)
  expect(document.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe(metadata[expected].socialLocale)
  expect(document.documentElement.hasAttribute(STARTUP_ATTRIBUTE)).toBe(false)
  expect(document.getElementById(ENGLISH_TEMPLATE_ID)).toBeNull()
  expect(claimInitialLocale(root)).toBe(expected)
  expect(window.__rewardLocaleStartup).toBeUndefined()
  handle.activate()
  expect(root.getAttribute(PRERENDER_LOCALE_ATTRIBUTE)).toBe(expected)
  expect(read).toHaveBeenCalledExactlyOnceWith(LOCALE_PREFERENCE_KEY)
  expect(write).not.toHaveBeenCalled()
})

it.each(['missing', 'empty', 'not-template'] as const)('falls back when the English template is %s', (failure) => {
  const root = page()
  const template = document.getElementById(ENGLISH_TEMPLATE_ID)!
  if (failure === 'missing') template.remove()
  if (failure === 'empty') (template as HTMLTemplateElement).content.replaceChildren()
  if (failure === 'not-template') template.replaceWith(Object.assign(document.createElement('div'), { id: ENGLISH_TEMPLATE_ID }))
  startLocaleBootstrap(metadata)
  window.__rewardLocaleStartup!.activate()
  expect(root.textContent).toBe('Chinese')
  expect(claimInitialLocale(root)).toBe('zh-CN')
  expect(document.documentElement.hasAttribute(STARTUP_ATTRIBUTE)).toBe(false)
  expect(window.localStorage.getItem(LOCALE_PREFERENCE_KEY)).toBe('en-US')
})

it('rolls back the original nodes when metadata fails after swapping the content', () => {
  const root = page()
  const original = root.firstChild
  startLocaleBootstrap(metadata)
  vi.spyOn(document, 'title', 'set').mockImplementationOnce(() => { throw new Error('Synthetic activation failure') })
  window.__rewardLocaleStartup!.activate()
  expect(root.firstChild).toBe(original)
  expect(claimInitialLocale(root)).toBe('zh-CN')
  expect(document.documentElement.lang).toBe('zh-CN')
  expect(document.title).toBe(metadata['zh-CN'].title)
  expect(document.documentElement.hasAttribute(STARTUP_ATTRIBUTE)).toBe(false)
})

it.each(['timeout', 'parsed', 'claimed'] as const)('seals fallback after %s and ignores late activation', (reason) => {
  vi.useFakeTimers()
  const root = page()
  startLocaleBootstrap(metadata)
  const handle = window.__rewardLocaleStartup!
  if (reason === 'timeout') vi.advanceTimersByTime(STARTUP_TIMEOUT_MS)
  if (reason === 'parsed') document.dispatchEvent(new window.Event('DOMContentLoaded'))
  if (reason === 'claimed') expect(claimInitialLocale(root)).toBe('zh-CN')
  handle.activate()
  expect(claimInitialLocale(root)).toBe('zh-CN')
  expect(root.textContent).toBe('Chinese')
  expect(document.documentElement.hasAttribute(STARTUP_ATTRIBUTE)).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
})

it('cancels recovery after successful activation, even before React loads', () => {
  vi.useFakeTimers()
  const root = page()
  startLocaleBootstrap(metadata)
  const handle = window.__rewardLocaleStartup!
  startLocaleBootstrap(metadata)
  expect(window.__rewardLocaleStartup).toBe(handle)
  handle.activate()
  const english = root.firstChild
  vi.advanceTimersByTime(STARTUP_TIMEOUT_MS * 2)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  expect(root.firstChild).toBe(english)
  expect(claimInitialLocale(root)).toBe('en-US')
  expect(vi.getTimerCount()).toBe(0)
})

it('uses the displayed snapshot when preparation is blocked, and browser preferences for an empty dev root', () => {
  const root = page()
  const read = vi.spyOn(dom!.window.Storage.prototype, 'getItem')
  expect(claimInitialLocale(root)).toBe('zh-CN')
  expect(read).not.toHaveBeenCalled()
  expect(document.getElementById(ENGLISH_TEMPLATE_ID)).toBeNull()
  root.replaceChildren()
  expect(claimInitialLocale(root)).toBe('en-US')
  expect(read).toHaveBeenCalledOnce()
})

it('uses browser languages when local storage is denied', () => {
  const root = page(null, ['en-US'])
  vi.spyOn(dom!.window.Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage denied') })
  startLocaleBootstrap(metadata)
  window.__rewardLocaleStartup!.activate()
  expect(claimInitialLocale(root)).toBe('en-US')
})

it('releases the guard even if browser language access fails', () => {
  const root = page(null)
  vi.stubGlobal('navigator', Object.defineProperty({}, 'languages', { get() { throw new Error('Unavailable') } }))
  startLocaleBootstrap(metadata)
  expect(claimInitialLocale(root)).toBe('zh-CN')
  expect(document.documentElement.hasAttribute(STARTUP_ATTRIBUTE)).toBe(false)
})
