import { act } from 'react'
import type { Root } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import { afterEach, expect, it, vi } from 'vitest'
import type { Statement, Transaction } from '@/domain/model/types'
import { I18nProvider } from '@/i18n/I18nProvider'
import { statement, transaction } from '@/tests/fixtures/dataset'
import { TransactionSources } from './TransactionSources'

let dom: JSDOM | undefined
let root: Root | undefined

afterEach(async () => {
  if (root) await act(async () => root?.unmount())
  root = undefined
  dom?.window.close()
  vi.unstubAllGlobals()
})

async function renderSources(
  sources: Transaction['sources'],
  statements: readonly Statement[],
) {
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
  vi.stubGlobal('requestAnimationFrame', window.requestAnimationFrame.bind(window))
  vi.stubGlobal('cancelAnimationFrame', window.cancelAnimationFrame.bind(window))
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const { createRoot } = await import('react-dom/client')
  root = createRoot(window.document.getElementById('root')!)
  await act(async () =>
    root!.render(
      <I18nProvider initialLocale="en-US">
        <TransactionSources sources={sources} statements={statements} />
      </I18nProvider>,
    ),
  )
  return dom.window.document
}

it('shows one statement for its transaction, payment and continuation rows without losing source text', async () => {
  const source = transaction().sources[0]
  const document = await renderSources(
    [
      { ...source, text: 'SYNTHETIC TRANSACTION' },
      { ...source, row: 2, text: 'APPLE PAY-MOBILE:0000' },
      { ...source, page: 2, row: 1, text: 'SYNTHETIC CONTINUATION' },
    ],
    [statement({ pageCount: 2 })],
  )

  expect(document.querySelectorAll('article')).toHaveLength(1)
  expect(document.querySelectorAll('button')).toHaveLength(1)
  expect(document.querySelector('h4')?.textContent).toBe('synthetic.pdf')
  const trigger = document.querySelector('button')!
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  expect(document.body.textContent).not.toContain('SYNTHETIC TRANSACTION')
  await act(async () => trigger.click())
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  const extractedText = document.getElementById(trigger.getAttribute('aria-controls')!)!
  expect(extractedText.textContent).toContain('SYNTHETIC TRANSACTION')
  expect(extractedText.textContent).toContain('APPLE PAY-MOBILE:0000')
  expect(extractedText.textContent).toContain('SYNTHETIC CONTINUATION')
  expect(extractedText.textContent).toContain('Page 1')
  expect(extractedText.textContent).toContain('Page 2')
})

it('keeps distinct statements and their disclosure states separate, including missing statement metadata', async () => {
  const source = transaction().sources[0]
  const document = await renderSources(
    [
      { ...source, text: 'FIRST STATEMENT ROW' },
      {
        ...source,
        statementId: 'statement-b',
        fileHash: 'synthetic-hash-b',
        page: 3,
        text: 'SECOND STATEMENT ROW',
      },
    ],
    [statement()],
  )

  const entries = document.querySelectorAll('article')
  expect(entries).toHaveLength(2)
  const firstTrigger = entries[0].querySelector('button')!
  const secondTrigger = entries[1].querySelector('button')!
  await act(async () => firstTrigger.click())
  expect(firstTrigger.getAttribute('aria-expanded')).toBe('true')
  expect(secondTrigger.getAttribute('aria-expanded')).toBe('false')
  expect(entries[1].textContent).not.toContain('SECOND STATEMENT ROW')
  await act(async () => secondTrigger.click())
  expect(firstTrigger.getAttribute('aria-expanded')).toBe('true')
  expect(secondTrigger.getAttribute('aria-expanded')).toBe('true')
  expect(entries[0].textContent).toContain('synthetic.pdf')
  expect(entries[0].textContent).toContain('FIRST STATEMENT ROW')
  expect(entries[1].textContent).toContain(
    'Source-statement details are no longer available',
  )
  expect(entries[1].textContent).toContain('Page 3')
  expect(entries[1].textContent).toContain('Unknown')
  expect(entries[1].textContent).toContain('SECOND STATEMENT ROW')
})
