import { act } from 'react'
import type { Root } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import { afterEach, expect, it, vi } from 'vitest'
import { LanguageSwitcher } from '@/components/workspace/LanguageSwitcher'
import { I18nProvider } from '@/i18n/I18nProvider'
import { deriveWorkspace } from '@/application/session/selectors'
import { createDemoDataset } from '@/application/demo/dataset'
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

it('preserves filters across language and result changes, resets paging, and follows source statements', async () => {
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
  const render = async (current: SessionState) =>
    act(async () =>
      root!.render(
        <I18nProvider initialLocale="en-US">
          <LanguageSwitcher />
          <ResultDetailsContent
            request={{ tab: 'transactions' }}
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
  const scroll = container.querySelector('[data-details-scroll]')!
  const note = () => container.querySelector('[data-detail-footnote]')!
  expect(scroll.contains(note())).toBe(false)
  expect(note().textContent).toContain('Filters display rewards')
  expect(container.textContent).toContain('Page 1 of 2')
  await click('Next')
  expect(container.textContent).toContain('Page 2 of 2')
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
  await click('PULSE exclusive')
  await click('Capped')
  expect(
    container.querySelectorAll('[data-transaction-id]').length,
  ).toBeGreaterThan(0)
  await act(async () =>
    (container.querySelector('[data-transaction-id]') as HTMLElement).click(),
  )
  expect(container.querySelector('[data-transaction-detail]')).not.toBeNull()
  const source = [...container.querySelectorAll('button')].find((item) =>
    item.textContent?.includes('.pdf'),
  )!
  await act(async () => source.click())
  expect(container.querySelector('[data-statement-detail]')).not.toBeNull()
  expect(note().textContent).toContain(
    'Balance checks cover complete source statements',
  )
  expect(container.textContent).toContain('Calculated closing balance')
  await click('Back')
  expect(container.querySelector('[data-transaction-detail]')).not.toBeNull()
  await click('Back')
  expect(container.querySelector('[aria-pressed="true"]')?.textContent).toBe(
    'All cards',
  )
  expect(
    [...container.querySelectorAll('[aria-pressed="true"]')].map(
      (item) => item.textContent,
    ),
  ).toContain('Capped')
  expect(
    window.document.activeElement?.hasAttribute('data-transaction-id'),
  ).toBe(true)
  await click('Balance checks')
  await act(async () =>
    (container.querySelector('[data-statement-id]') as HTMLElement).click(),
  )
  await act(async () =>
    (
      container.querySelector('[data-source-transaction-id]') as HTMLElement
    ).click(),
  )
  await click('Back')
  expect(
    window.document.activeElement?.hasAttribute('data-source-transaction-id'),
  ).toBe(true)
  await click('Back')
  expect(window.document.activeElement?.hasAttribute('data-statement-id')).toBe(
    true,
  )
  await click('Calculation and basis')
  expect(note().textContent).toContain(
    'Calculations retain six RC decimal places',
  )
  expect(scroll.contains(note())).toBe(false)
})
