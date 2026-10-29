import { act, StrictMode, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LanguageSwitcher } from '@/components/workspace/LanguageSwitcher'
import { PasswordForm } from '@/features/import/components/PasswordForm'
import { createTranslator } from '@/i18n/messages'
import type { Locale } from '@/i18n/locale'
import { useI18n } from '@/i18n/use-i18n'
import { LOCALE_PREFERENCE_KEY } from '@/i18n/browser-preference'
import { zh } from '@/i18n/zh'
import { readBrowserLocale } from '@/i18n/browser-locale'
import { createMemorySession, sessionStore } from '@/store/memory-session'
import { createPdfImportController } from '@/application/import/controller'
import { commitImportedBatch } from '@/application/import/commit'
import { deriveWorkspace } from '@/application/session/selectors'
import type { SessionStore } from '@/application/session/types'
import type { PdfImportController } from '@/application/import/types'
import { parsePulseStatement } from '@/domain/parsing/pulse/parse'
import { PdfReadError } from '@/ports/pdf'
import type { LocalPdfDocument } from '@/ports/pdf'
import { importedFile } from '@/tests/fixtures/imported-file'
import { pulsePage, purchase } from '@/tests/fixtures/pulse-statement'
import { deferred } from '@/tests/helpers/deferred'
import { AppProviders } from './AppProviders'
import { AppRoot } from './AppRoot'
import { pageMetadata } from './seo'
import { startLocaleBootstrap } from './locale-startup/bootstrap'
import { claimInitialLocale } from './locale-startup/claim'

let dom: JSDOM | undefined
let root: Root | undefined

function browser(languages: readonly string[] = ['en-GB'], language = 'en-GB') {
  dom = new JSDOM(`<!doctype html><html lang="zh-CN"><head>
    <title>${pageMetadata().title}</title>
    <meta name="description" content=""><meta property="og:locale" content="">
    ${['title', 'description', 'image:alt'].map((field) =>
      `<meta property="og:${field}" content=""><meta name="twitter:${field}" content="">`,
    ).join('')}
    </head><body><div id="root"></div></body></html>`, {
    url: 'https://rewards.lmmmmmm.dev/',
    pretendToBeVisual: true,
  })
  const { window } = dom
  Object.defineProperty(window.navigator, 'languages', { get: () => languages, configurable: true })
  Object.defineProperty(window.navigator, 'language', { get: () => language, configurable: true })

  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'MutationObserver'] as const) {
    vi.stubGlobal(key, key === 'window' ? window : window[key])
  }

  vi.stubGlobal('getComputedStyle', window.getComputedStyle.bind(window))
  vi.stubGlobal('requestAnimationFrame', window.requestAnimationFrame.bind(window))
  vi.stubGlobal('cancelAnimationFrame', window.cancelAnimationFrame.bind(window))
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)

  return window.document.getElementById('root')!
}

function query<ElementType extends Element = HTMLElement>(container: ParentNode, selector: string) {
  const element = container.querySelector<ElementType>(selector)
  if (!element) throw new Error(`Missing test element: ${selector}`)
  return element
}

function expectMetadata(locale: Locale) {
  const metadata = pageMetadata(locale)

  expect(document.documentElement.lang).toBe(locale)
  expect(document.title).toBe(metadata.title)
  expect(query(document, 'meta[name="description"]').getAttribute('content')).toBe(metadata.description)
  expect(query(document, 'meta[property="og:locale"]').getAttribute('content')).toBe(metadata.socialLocale)

  for (const [field, content] of [
    ['title', metadata.title], ['description', metadata.description], ['image:alt', metadata.imageAlt],
  ]) {
    expect(query(document, `meta[property="og:${field}"]`).getAttribute('content')).toBe(content)
    expect(query(document, `meta[name="twitter:${field}"]`).getAttribute('content')).toBe(content)
  }
}

async function clickButton(container: ParentNode, label: string) {
  const button = [...container.querySelectorAll('button')].find((element) => element.textContent === label)
  if (!button) throw new Error(`Missing test button: ${label}`)

  await act(async () => button.click())
}

function Page({ children }: { children?: ReactNode }) {
  const { locale, t, date } = useI18n()

  return (
    <>
      <LanguageSwitcher />
      <h1 data-locale={locale}>{t('cashback.emptyTitle')}</h1>
      <p data-date>{date('2026-10-28')}</p>
      {children}
    </>
  )
}

function Session({ store, controller }: { store: SessionStore; controller: PdfImportController }) {
  const session = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const batch = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  const { t, number } = useI18n()
  const item = batch.items[0]

  return (
    <Page>
      <p data-result>{number(deriveWorkspace(session).knownRewardMicroRc / 1_000_000, 6)}</p>
      <p data-batch>{item && t(`pdf.status.${item.status}`)}</p>
      {item?.status === 'locked'
        ? <PasswordForm item={item} onUnlock={(password) => controller.unlock(item.id, password)} />
        : <input aria-label="Synthetic unfinished input" defaultValue="" />}
    </Page>
  )
}

afterEach(async () => {
  const mounted = root
  if (mounted) await act(async () => mounted.unmount())
  root = undefined
  sessionStore.clear()
  dom?.window.close()
  dom = undefined
  vi.unstubAllGlobals()
})

describe('initial language and hydration', () => {
  it.each([
    { languages: ['fr-FR', 'en-US', 'zh-HK'], saved: null, expected: 'en-US' },
    { languages: ['zh-TW'], saved: 'en-US', expected: 'en-US' },
    { languages: ['zh-TW'], saved: 'en-HK', expected: 'zh-CN' },
    { languages: ['en-US'], saved: 'zh-CN', expected: 'zh-CN' },
  ] as const)('hydrates the selected $expected markup with saved preference $saved', async ({ languages, saved, expected }) => {
    const container = browser(languages)
    if (saved) window.localStorage.setItem(LOCALE_PREFERENCE_KEY, saved)
    const localRead = vi.spyOn(dom!.window.Storage.prototype, 'getItem')
    const languageRead = vi.spyOn(window.navigator, 'languages', 'get')
    const tree = <StrictMode><AppProviders initialLocale={expected}><Page /></AppProviders></StrictMode>
    const staticHtml = renderToString(tree)

    expect(staticHtml).toContain(createTranslator(expected)('cashback.emptyTitle'))
    expect(localRead).not.toHaveBeenCalled()
    expect(languageRead).not.toHaveBeenCalled()

    container.innerHTML = staticHtml
    const heading = query(container, 'h1')
    expect(readBrowserLocale()).toBe(expected)
    const onRecoverableError = vi.fn()
    const { hydrateRoot } = await import('react-dom/client')
    await act(async () => { root = hydrateRoot(container, tree, { onRecoverableError }) })

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(query(container, 'h1')).toBe(heading)
    expect(heading.dataset.locale).toBe(expected)
    expect(heading.textContent).toBe(createTranslator(expected)('cashback.emptyTitle'))
    expectMetadata(expected)
  })

  it.each([
    { languages: ['zh-TW', 'en-US'], language: 'en-US', expected: 'zh-CN' },
    { languages: [], language: 'en-US', expected: 'en-US' },
    { languages: ['fr-FR', 'ja-JP'], language: 'fr-FR', expected: 'zh-CN' },
  ])('selects $expected from browser configuration $languages / $language', async ({ languages, language, expected }) => {
    const container = browser(languages, language)
    const { createRoot } = await import('react-dom/client')
    const mounted = root = createRoot(container)
    await act(async () => mounted.render(<AppProviders initialLocale={readBrowserLocale()}><Page /></AppProviders>))

    expect(query(container, 'h1').dataset.locale).toBe(expected)
  })

  it('uses the US language tag, calendar format and social locale for English variants', async () => {
    const container = browser(['en-HK'])
    const { createRoot } = await import('react-dom/client')
    const mounted = root = createRoot(container)
    await act(async () => mounted.render(<AppProviders initialLocale={readBrowserLocale()}><Page /></AppProviders>))

    expect(document.documentElement.lang).toBe('en-US')
    expect(query(container, '[data-date]').textContent).toBe('Oct 28, 2026')
    expect(query(document, 'meta[property="og:locale"]').getAttribute('content')).toBe('en_US')

    await act(async () => query<HTMLButtonElement>(container, '[data-language-switcher]').click())

    expect(query(container, '[data-language-switcher] span').lang).toBe('en-US')
  })

  it.each([
    { languages: ['en-GB'], initial: 'en-US', selected: 'zh-CN' },
    { languages: ['zh-HK'], initial: 'zh-CN', selected: 'en-US' },
  ] as const)('keeps manual $selected across rerenders and remounts over browser $initial', async ({ languages, initial, selected }) => {
    const container = browser(languages)
    const localWrite = vi.spyOn(dom!.window.Storage.prototype, 'setItem')
    const cookieWrite = vi.spyOn(dom!.window.Document.prototype, 'cookie', 'set')
    const url = window.location.href
    const { createRoot } = await import('react-dom/client')
    const mounted = root = createRoot(container)
    let initialLocale = readBrowserLocale()
    const tree = (label: string) => <AppProviders initialLocale={initialLocale}><Page><p>{label}</p></Page></AppProviders>
    await act(async () => mounted.render(tree('first')))

    expect(document.documentElement.lang).toBe(initial)
    expect(localWrite).not.toHaveBeenCalled()

    const button = query<HTMLButtonElement>(container, '[data-language-switcher]')
    button.focus()
    await act(async () => button.click())

    expectMetadata(selected)
    expect(document.activeElement).toBe(button)
    expect(button.getAttribute('aria-label')).toBe(createTranslator(selected)(
      selected === 'zh-CN' ? 'language.switchToEnglish' : 'language.switchToChinese',
    ))

    await act(async () => mounted.render(tree('second')))

    expect(query(container, 'h1').dataset.locale).toBe(selected)

    await act(async () => mounted.unmount())
    const reloaded = root = createRoot(container)
    initialLocale = readBrowserLocale()
    await act(async () => reloaded.render(tree('reloaded')))

    expect(document.documentElement.lang).toBe(selected)
    expect(document.title).toBe(pageMetadata(selected).title)
    expect(window.location.href).toBe(url)
    expect(localWrite).toHaveBeenCalledExactlyOnceWith(LOCALE_PREFERENCE_KEY, selected)
    expect(cookieWrite).not.toHaveBeenCalled()
    expect(window.localStorage.length).toBe(1)
    expect(window.localStorage.getItem(LOCALE_PREFERENCE_KEY)).toBe(selected)
    expect(window.sessionStorage.length).toBe(0)
  })

  it('falls back to browser preferences for an invalid saved value', async () => {
    const container = browser(['en-GB'])
    window.localStorage.setItem(LOCALE_PREFERENCE_KEY, 'unsupported')
    const { createRoot } = await import('react-dom/client')
    const mounted = root = createRoot(container)
    await act(async () => mounted.render(<AppProviders initialLocale={readBrowserLocale()}><Page /></AppProviders>))

    expect(document.documentElement.lang).toBe('en-US')

    await act(async () => query<HTMLButtonElement>(container, '[data-language-switcher]').click())

    expect(window.localStorage.getItem(LOCALE_PREFERENCE_KEY)).toBe('zh-CN')
  })

  it('uses one initial page preference and ignores changes from other pages', async () => {
    const container = browser(['en-US'])
    window.localStorage.setItem(LOCALE_PREFERENCE_KEY, 'en-US')
    const localRead = vi.spyOn(dom!.window.Storage.prototype, 'getItem')
    const { createRoot } = await import('react-dom/client')
    const mounted = root = createRoot(container)
    let initialLocale = readBrowserLocale()
    const tree = (label: string) => <StrictMode><AppProviders initialLocale={initialLocale}><Page><p>{label}</p></Page></AppProviders></StrictMode>
    await act(async () => mounted.render(tree('first')))

    expect(document.documentElement.lang).toBe('en-US')

    window.localStorage.setItem(LOCALE_PREFERENCE_KEY, 'zh-CN')
    window.dispatchEvent(new window.StorageEvent('storage', {
      key: LOCALE_PREFERENCE_KEY, newValue: 'zh-CN', storageArea: window.localStorage,
    }))
    await act(async () => mounted.render(tree('second')))

    expect(document.documentElement.lang).toBe('en-US')
    expect(localRead).toHaveBeenCalledTimes(1)

    await act(async () => mounted.unmount())
    const reloaded = root = createRoot(container)
    initialLocale = readBrowserLocale()
    await act(async () => reloaded.render(tree('reloaded')))

    expect(document.documentElement.lang).toBe('zh-CN')
    expect(localRead).toHaveBeenCalledTimes(2)
  })

  it('still switches and retains the current selection when storage is blocked', async () => {
    const container = browser()
    const storage = dom!.window.Storage.prototype
    vi.spyOn(storage, 'getItem').mockImplementation(() => { throw new Error('Storage denied') })
    vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('Storage denied') })
    const { createRoot } = await import('react-dom/client')
    const mounted = root = createRoot(container)
    const initialLocale = readBrowserLocale()
    const tree = (label: string) => <AppProviders initialLocale={initialLocale}><Page><p>{label}</p></Page></AppProviders>
    await act(async () => mounted.render(tree('first')))

    expect(document.documentElement.lang).toBe('en-US')

    await act(async () => query<HTMLButtonElement>(container, '[data-language-switcher]').click())
    await act(async () => mounted.render(tree('second')))

    expect(document.documentElement.lang).toBe('zh-CN')
  })

  it('hydrates the actual app, preserves demo results on switch, and keeps the language when results clear', async () => {
    const container = browser(['zh-CN'])
    window.localStorage.setItem(LOCALE_PREFERENCE_KEY, 'en-US')
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network in the example'))
    container.innerHTML = renderToString(<AppRoot initialLocale="zh-CN" />)
    container.setAttribute('data-prerender-locale', 'zh-CN')
    const alternate = document.createElement('template')
    alternate.id = 'prerender-en-US'
    alternate.innerHTML = renderToString(<AppRoot initialLocale="en-US" />)
    document.body.append(alternate)
    startLocaleBootstrap({ 'zh-CN': pageMetadata('zh-CN'), 'en-US': pageMetadata('en-US') })
    window.__rewardLocaleStartup!.activate()
    const initialLocale = claimInitialLocale(container)
    const heading = query(container, 'h1')

    expect(heading.textContent).toBe(createTranslator('en-US')('cashback.emptyTitle'))

    const onRecoverableError = vi.fn()
    const { hydrateRoot } = await import('react-dom/client')
    await act(async () => { root = hydrateRoot(container, <AppRoot initialLocale={initialLocale} />, { onRecoverableError }) })

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(query(container, 'h1')).toBe(heading)
    expectMetadata('en-US')

    await clickButton(container, createTranslator('en-US')('cashback.tryExample'))

    expect([...container.querySelectorAll('button')].some((button) =>
      button.textContent === createTranslator('en-US')('cashback.tryExample'))).toBe(false)

    const before = sessionStore.getSnapshot()
    const total = query(container, '[data-reward-total]')
    const amount = total.textContent
    await act(async () => query<HTMLButtonElement>(container, '[data-language-switcher]').click())

    expectMetadata('zh-CN')
    expect(sessionStore.getSnapshot()).toBe(before)
    expect(query(container, '[data-reward-total]')).toBe(total)
    expect(total.textContent).toBe(amount)

    await act(async () => sessionStore.clear())

    expect(sessionStore.getSnapshot().mode).toBe('empty')
    expectMetadata('zh-CN')
    expect(window.localStorage.getItem(LOCALE_PREFERENCE_KEY)).toBe('zh-CN')
    expect([...container.querySelectorAll('button')].some((button) =>
      button.textContent === zh['cashback.tryExample'])).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('keeps the selected half, focused period button, and expanded result when the language changes', async () => {
    const container = browser(['zh-CN'])
    const dataset = importedFile('two-halves')
    const row = dataset.transactions[0]
    sessionStore.replace({
      ...dataset,
      transactions: [
        { ...row, id: 'first-half', transactionDate: '2026-06-19', postingDate: '2026-06-20' },
        { ...row, id: 'second-half', account: { currency: 'CNY', minor: 50_000 }, original: { currency: 'CNY', minor: 50_000 } },
      ],
    }, 'demo', { hkdToCnyPpm: 900000, source: 'demo', stale: false })
    const before = sessionStore.getSnapshot()
    const { createRoot } = await import('react-dom/client')
    const mounted = root = createRoot(container)
    await act(async () => mounted.render(<AppRoot initialLocale="zh-CN" />))
    const periods = query(container, '[data-reward-periods]')
    const buttons = [...periods.querySelectorAll('button')]
    const firstHalf = buttons.find((button) => button.textContent?.includes('上半年'))!
    await act(async () => firstHalf.click())
    const total = query(container, '[data-reward-total]')

    expect(total.textContent).toBe('11.00RC')
    expect(container.querySelectorAll('[data-reward-breakdown]')).toHaveLength(1)
    expect(query(container, '[data-reward-breakdown]').getAttribute('data-period')).toBe('2026-H1')

    const reasons = query<HTMLButtonElement>(container, '[data-reward-card] button[aria-expanded]')
    await act(async () => reasons.click())

    expect(reasons.getAttribute('aria-expanded')).toBe('true')

    firstHalf.focus()
    await act(async () => query<HTMLButtonElement>(container, '[data-language-switcher]').click())

    expect(document.documentElement.lang).toBe('en-US')
    expect(document.activeElement).toBe(firstHalf)
    expect(firstHalf.getAttribute('aria-pressed')).toBe('true')
    expect(query(container, '[data-reward-total]')).toBe(total)
    expect(total.textContent).toBe('11.00RC')
    expect(query(container, '[data-reward-card] button[aria-expanded]')).toBe(reasons)
    expect(reasons.getAttribute('aria-expanded')).toBe('true')
    expect(sessionStore.getSnapshot()).toBe(before)

    await act(async () => buttons[0].click())

    expect(total.textContent).toBe('33.00RC')
    expect(container.querySelectorAll('[data-reward-breakdown]')).toHaveLength(2)
    expect(sessionStore.getSnapshot()).toBe(before)
  })
})

describe('language changes during an import', () => {
  const scenarios = (['reading', 'parsing', 'locked'] as const).flatMap((phase) =>
    (['commit', 'cancel'] as const).map((outcome) => ({ phase, outcome })),
  )
  it.each(scenarios)(
    'preserves earlier rewards and the $phase batch, then handles $outcome',
    async ({ phase, outcome }) => {
      const container = browser()
      const store = createMemorySession()
      store.replace(importedFile('previous'), 'real')
      const gate = deferred<void>()
      let signal: AbortSignal | undefined
      const pdf: LocalPdfDocument = {
        pages: [pulsePage({ closing: '10.00', ledger: [purchase('SYNTHETIC STORE CN', '10.00')] })],
        dispose: vi.fn(async () => {}),
      }
      const commit = vi.fn((files, revision) => commitImportedBatch(store, files, revision))
      const controller = createPdfImportController({
        reader: { read: async (_, options) => {
          signal = options.signal
          if (phase === 'reading') await gate.promise
          if (phase === 'locked' && !options.password) throw new PdfReadError('password-required')
          return pdf
        } },
        parser: { parse: async (pages, source) => {
          if (phase === 'parsing') await gate.promise
          return parsePulseStatement(pages, source, (kind, number) => `${kind}-${number.slice(-4)}`)
        } },
        fingerprint: async () => 'synthetic-new-hash',
        now: () => 1000,
        existing: () => {
          const state = store.getSnapshot()
          return { revision: state.revision, hashes: state.dataset.statements.map((item) => item.fileHash), files: state.dataset.statements.length, bytes: 1000 }
        },
        commit,
      })
      const unlock = vi.spyOn(controller, 'unlock')
      controller.start([{ name: 'synthetic.pdf', size: 100, type: 'application/pdf', arrayBuffer: async () => new TextEncoder().encode('%PDF-synthetic').buffer }])
      await vi.waitFor(() => expect(controller.getSnapshot().items[0].status).toBe(phase))
      const beforeSession = store.getSnapshot()
      const beforeBatch = controller.getSnapshot()
      const { createRoot } = await import('react-dom/client')
      const mounted = root = createRoot(container)
      await act(async () => mounted.render(<StrictMode><AppProviders initialLocale="en-US"><Session store={store} controller={controller} /></AppProviders></StrictMode>))
      const amount = query(container, '[data-result]').textContent
      const input = query<HTMLInputElement>(container, 'input')
      input.value = 'synthetic unfinished value'

      for (const expectedLocale of ['zh-CN', 'en-US']) {
        await act(async () => query<HTMLButtonElement>(container, '[data-language-switcher]').click())

        expect(document.documentElement.lang).toBe(expectedLocale)
        expect(store.getSnapshot()).toBe(beforeSession)
        expect(controller.getSnapshot()).toBe(beforeBatch)
        expect(query(container, '[data-result]').textContent).toBe(amount)
        expect(query(container, 'input')).toBe(input)
        expect(input.value).toBe('synthetic unfinished value')
        expect(window.localStorage.getItem(LOCALE_PREFERENCE_KEY)).toBe(expectedLocale)
        expect(window.localStorage.length).toBe(1)
        expect(commit).not.toHaveBeenCalled()
      }

      if (phase !== 'parsing') expect(signal?.aborted).toBe(false)

      if (outcome === 'cancel') {
        await act(async () => {
          controller.cancel()
          gate.resolve()
          if (phase !== 'locked') await vi.waitFor(() => expect(pdf.dispose).toHaveBeenCalledTimes(1))
        })

        expect(controller.getSnapshot().active).toBe(false)
        expect(controller.getSnapshot().items).toEqual([])
        expect(store.getSnapshot()).toBe(beforeSession)
        expect(commit).not.toHaveBeenCalled()
        return
      }

      await act(async () => {
        if (phase === 'locked') {
          query(container, 'form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
        }
        else gate.resolve()
        await vi.waitFor(() => expect(controller.getSnapshot().outcome.status).toBe('committed'))
      })

      expect(commit).toHaveBeenCalledTimes(1)
      expect(store.getSnapshot().dataset.statements).toHaveLength(2)
      expect(store.getSnapshot().dataset.transactions).toHaveLength(2)
      expect(pdf.dispose).toHaveBeenCalledTimes(1)

      if (phase === 'locked') {
        expect(unlock).toHaveBeenCalledExactlyOnceWith(beforeBatch.items[0].id, 'synthetic unfinished value')
      }
    },
  )
})
