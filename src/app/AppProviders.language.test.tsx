import { act, StrictMode, useSyncExternalStore } from 'react'
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
import { createMemorySession } from '@/store/memory-session'
import { workspace } from './runtime/workspace'
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

const { store: sessionStore } = workspace

let dom: JSDOM | undefined
let root: Root | undefined

function browser(languages: readonly string[] = ['en-US']) {
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
}

async function clickButton(container: ParentNode, label: string) {
  const button = [...container.querySelectorAll('button')].find((element) => element.textContent === label)
  if (!button) throw new Error(`Missing test button: ${label}`)

  await act(async () => button.click())
}

function Session({ store, controller }: { store: SessionStore; controller: PdfImportController }) {
  const session = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const batch = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  const { t, number } = useI18n()
  const item = batch.items[0]

  return (
    <>
      <LanguageSwitcher />
      <p data-result>{number(deriveWorkspace(session).knownRewardMicroRc / 1_000_000, 6)}</p>
      <p data-batch>{item && t(`pdf.status.${item.status}`)}</p>
      {item?.status === 'locked'
        ? <PasswordForm item={item} onUnlock={(password) => controller.unlock(item.id, password)} />
        : <input aria-label="Synthetic unfinished input" defaultValue="" />}
    </>
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

describe('page language lifecycle', () => {
  it.each(['zh-CN', 'en-US'] as const)(
    'hydrates the %s app, preserves results on language switch, and retains the preference after clearing',
    async (locale) => {
      const container = browser([locale === 'zh-CN' ? 'en-US' : 'zh-CN'])
      window.localStorage.setItem(LOCALE_PREFERENCE_KEY, locale)
      const localRead = vi.spyOn(dom!.window.Storage.prototype, 'getItem')
      const localWrite = vi.spyOn(dom!.window.Storage.prototype, 'setItem')
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

      expect(initialLocale).toBe(locale)
      expect(heading.textContent).toBe(createTranslator(locale)('cashback.emptyTitle'))

      const onRecoverableError = vi.fn()
      const { hydrateRoot } = await import('react-dom/client')
      await act(async () => { root = hydrateRoot(container, <AppRoot initialLocale={initialLocale} />, { onRecoverableError }) })

      expect(onRecoverableError).not.toHaveBeenCalled()
      expect(query(container, 'h1')).toBe(heading)
      expectMetadata(locale)
      expect(localWrite).not.toHaveBeenCalled()

      await clickButton(container, createTranslator(locale)('cashback.tryExample'))

      const before = sessionStore.getSnapshot()
      expect(before.mode).toBe('demo')
      const total = query(container, '[data-reward-total]')
      const amount = total.textContent
      const selected = locale === 'zh-CN' ? 'en-US' : 'zh-CN'
      await act(async () => query<HTMLButtonElement>(container, '[data-language-switcher]').click())

      expectMetadata(selected)
      expect(sessionStore.getSnapshot()).toBe(before)
      expect(query(container, '[data-reward-total]')).toBe(total)
      expect(total.textContent).toBe(amount)
      expect(localWrite).toHaveBeenCalledExactlyOnceWith(LOCALE_PREFERENCE_KEY, selected)

      await act(async () => sessionStore.clear())

      expect(sessionStore.getSnapshot().mode).toBe('empty')
      expectMetadata(selected)
      expect(localRead).toHaveBeenCalledExactlyOnceWith(LOCALE_PREFERENCE_KEY)
      expect(window.localStorage.getItem(LOCALE_PREFERENCE_KEY)).toBe(selected)
      expect(window.localStorage.length).toBe(1)
      expect([...container.querySelectorAll('button')].some((button) =>
        button.textContent === createTranslator(selected)('cashback.tryExample'))).toBe(true)
      expect(fetch).not.toHaveBeenCalled()
    },
  )
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
