import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { afterEach, expect, it } from 'vitest'
import type { Statement, Transaction } from '@/domain/model/types'
import { I18nProvider } from '@/i18n/I18nProvider'
import { statement, transaction } from '@/tests/fixtures/dataset'
import { TransactionSources } from './TransactionSources'

let dom: JSDOM | undefined

afterEach(() => dom?.window.close())

function renderSources(
  sources: Transaction['sources'],
  statements: readonly Statement[],
) {
  dom = new JSDOM(
    renderToStaticMarkup(
      <I18nProvider initialLocale="en-US">
        <TransactionSources sources={sources} statements={statements} />
      </I18nProvider>,
    ),
  )
  return dom.window.document
}

it('shows one statement for its transaction, payment and continuation rows without losing source text', () => {
  const source = transaction().sources[0]
  const document = renderSources(
    [
      { ...source, text: 'SYNTHETIC TRANSACTION' },
      { ...source, row: 2, text: 'APPLE PAY-MOBILE:0000' },
      { ...source, page: 2, row: 1, text: 'SYNTHETIC CONTINUATION' },
    ],
    [statement({ pageCount: 2 })],
  )

  expect(document.querySelectorAll('article')).toHaveLength(1)
  expect(document.querySelectorAll('summary')).toHaveLength(1)
  expect(document.querySelector('h4')?.textContent).toBe('synthetic.pdf')
  const extractedText = document.querySelector('details')!
  expect(extractedText.hasAttribute('open')).toBe(false)
  expect(extractedText.textContent).toContain('SYNTHETIC TRANSACTION')
  expect(extractedText.textContent).toContain('APPLE PAY-MOBILE:0000')
  expect(extractedText.textContent).toContain('SYNTHETIC CONTINUATION')
  expect(extractedText.textContent).toContain('Page 1')
  expect(extractedText.textContent).toContain('Page 2')
})

it('keeps distinct statements separate, including missing statement metadata', () => {
  const source = transaction().sources[0]
  const document = renderSources(
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
  expect(entries[0].textContent).toContain('synthetic.pdf')
  expect(entries[0].textContent).toContain('FIRST STATEMENT ROW')
  expect(entries[1].textContent).toContain(
    'Source-statement details are no longer available',
  )
  expect(entries[1].textContent).toContain('Page 3')
  expect(entries[1].textContent).toContain('Unknown')
  expect(entries[1].textContent).toContain('SECOND STATEMENT ROW')
})
