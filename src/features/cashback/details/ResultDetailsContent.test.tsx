import { act } from 'react'
import type { Root } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import { afterEach, expect, it, vi } from 'vitest'
import { LanguageSwitcher } from '@/components/workspace/LanguageSwitcher'
import { I18nProvider } from '@/i18n/I18nProvider'
import { deriveWorkspace } from '@/application/session/selectors'
import { createDemoDataset } from '@/application/demo/dataset'
import type { ResultDetailsRequest } from '@/application/results/details'
import type { SessionState } from '@/application/session/types'
import { ResultDetailsContent } from './ResultDetailsContent'

let root: Root | undefined
let dom: JSDOM | undefined

afterEach(async () => {
  if (root) await act(async () => root?.unmount())
  root = undefined
  dom?.window.close()
  vi.unstubAllGlobals()
})

it('keeps filters and pagination outside records, preserves language state, and restores list focus', async () => {
  dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'https://rewards.lmmmmmm.dev/',
    pretendToBeVisual: true,
  })
  const { window } = dom
  for (const key of [
    'window',
    'document',
    'navigator',
    'HTMLElement',
    'Element',
    'Node',
    'MutationObserver',
  ] as const)
    vi.stubGlobal(key, key === 'window' ? window : window[key])
  vi.stubGlobal('getComputedStyle', window.getComputedStyle.bind(window))
  vi.stubGlobal(
    'requestAnimationFrame',
    window.requestAnimationFrame.bind(window),
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    window.cancelAnimationFrame.bind(window),
  )
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const { createRoot } = await import('react-dom/client')
  const container = window.document.getElementById('root')!
  root = createRoot(container)
  const session: SessionState = {
    dataset: createDemoDataset(),
    revision: 1,
    mode: 'demo',
    fx: { source: 'demo', stale: false, hkdToCnyPpm: 900000 },
  }
  const render = async (
    current: SessionState,
    request: ResultDetailsRequest = {},
    instance = 'all',
  ) =>
    act(async () =>
      root!.render(
        <I18nProvider initialLocale="en-US">
          <LanguageSwitcher />
          <ResultDetailsContent
            key={instance}
            request={request}
            session={current}
            workspace={deriveWorkspace(current)}
          />
        </I18nProvider>,
      ),
    )
  const click = async (label: string) => {
    const button = [...container.querySelectorAll('button')].find(
      (item) => item.textContent === label,
    )
    expect(button, label).toBeDefined()
    await act(async () => button!.click())
  }
  await render(session)
  const region = () =>
    container.querySelector(
      '[data-details-scroll] [role="region"]',
    ) as HTMLElement
  expect(container.querySelector('[role="tablist"]')).toBeNull()
  expect(
    region().contains(container.querySelector('[data-detail-filters]')),
  ).toBe(false)
  expect(
    region().contains(container.querySelector('[data-detail-pagination]')),
  ).toBe(false)
  expect(
    region().contains(container.querySelector('[data-detail-footnote]')),
  ).toBe(false)
  expect(container.textContent).toContain('Page 1 of 2')
  region().scrollTop = 120
  await click('Next')
  expect(container.textContent).toContain('Page 2 of 2')
  expect(region().scrollTop).toBe(0)
  expect(
    window.document.activeElement?.closest('[data-detail-pagination]'),
  ).not.toBeNull()
  await click('简体中文')
  expect(container.textContent).toContain('第 2 / 2 页')
  await click('English')
  await render({
    ...session,
    fx: {
      source: 'cache',
      hkdToCnyPpm: 900000,
      rateDate: '2026-10-28',
      retrievedAt: 1,
      stale: false,
    },
  })
  expect(container.textContent).toContain('Page 1 of 2')
  expect(container.textContent).toContain('Results have changed')
  await render(session, { component: 'pulse', flags: ['capped'] }, 'filtered')
  await click('简体中文')
  await click('English')
  expect(
    container.querySelectorAll('[data-transaction-id]').length,
  ).toBeGreaterThan(0)
  region().scrollTop = 120
  await act(async () =>
    (container.querySelector('[data-transaction-id]') as HTMLElement).click(),
  )
  expect(container.querySelector('[data-transaction-detail]')).not.toBeNull()
  expect(
    window.document.activeElement?.hasAttribute('data-detail-heading'),
  ).toBe(true)
  const sources = container.querySelector('[data-transaction-sources]')!
  expect(sources.textContent).toContain('.pdf')
  expect(sources.textContent).toContain('Statement date')
  expect(sources.querySelector('button')).toBeNull()
  expect(sources.querySelector('details')).not.toBeNull()
  await click('Back')
  expect(
    container.querySelector(
      '[role="combobox"][aria-label="Calculation status"]',
    )?.textContent,
  ).toContain('Capped')
  expect(
    window.document.activeElement?.hasAttribute('data-transaction-id'),
  ).toBe(true)
  expect(region().scrollTop).toBe(120)
})
