import { describe, expect, it } from 'vitest'
import { createTranslator } from './messages'
import { en } from './en'
import { zh } from './zh'
import type { MessageKey } from './zh'
import type { MessageValues } from './message-types'

describe('message catalogs', () => {
  const keys = Object.keys(zh) as MessageKey[]
  const parameters = (template: string) =>
    [...new Set([...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]))].sort()

  it('keeps both catalogs complete with identical interpolation parameters', () => {
    expect(Object.keys(en).sort()).toEqual([...keys].sort())
    for (const key of keys) {
      const expected = parameters(zh[key])
      for (const count of [0, 1, 2]) {
        const values = Object.fromEntries(expected.map((name) => [name, count]))
        const message = en[key]
        const template = typeof message === 'function' ? message(values) : message
        expect(parameters(template), key).toEqual(expected)
        const t = createTranslator('en-US') as (key: MessageKey, values: MessageValues) => string
        expect(t(key, values), key).not.toMatch(/\{\w+\}/)
      }
    }
  })

  it('does not reinterpret parameter values as templates or HTML', () => {
    const name = '<synthetic>{pages}$&.pdf'
    expect(createTranslator('en-US')('pdf.remove', { name })).toBe(`Remove ${name}`)
    expect(createTranslator('zh-CN')('pdf.remove', { name })).toBe(`移除 ${name}`)
  })

  it('reports missing interpolation parameters instead of displaying raw tokens', () => {
    const t = createTranslator('en-US') as (key: MessageKey, values?: MessageValues) => string
    expect(() => t('pdf.parsedSummary', { pages: 1 })).toThrow('i18n.missing-parameter')
  })
})

describe('English cardinal agreement', () => {
  const t = createTranslator('en-US')

  it.each([
    [0, 0, '0 pages · 0 transactions recognized'],
    [1, 1, '1 page · 1 transaction recognized'],
    [1, 2, '1 page · 2 transactions recognized'],
    [2, 1, '2 pages · 1 transaction recognized'],
  ])('handles independent page and transaction counts %i / %i', (pages, transactions, expected) => {
    expect(t('pdf.parsedSummary', { pages, transactions })).toBe(expected)
  })

  it.each([0, 1, 2])('handles %i statements, transactions and purchases', (count) => {
    const suffix = count === 1 ? '' : 's'
    expect(t('card.coverage', { count, from: 'A', to: 'B' })).toBe(`${count} statement${suffix} · A — B`)
    expect(t('card.transactions', { count, purchases: 1 })).toBe(`${count} transaction${suffix} · 1 purchase`)
    expect(t('pdf.committed', { files: 1, transactions: count })).toBe(`Added 1 statement and ${count} new transaction${suffix}.`)
    expect(t('reasons.count', { count })).toBe(`${count} transaction${suffix}`)
  })

  it('handles singular progress, countdowns and warning verbs', () => {
    expect(t('pdf.batchProgress', { completed: 0, total: 1 })).toBe('Processed 0 of 1 file')
    expect(t('pdf.pageProgress', { completed: 1, total: 1 })).toBe('Extracted 1 of 1 page')
    expect(t('pdf.extractedSummary', { pages: 1 })).toBe('Text extracted from 1 page; not yet included in rewards.')
    expect(t('pdf.frozen', { seconds: 1 })).toContain('in 1 second.')
    expect(t('pdf.needsAttention', { count: 1 })).toBe('1 file needs attention')
    expect(t('cashback.checkWarning', { count: 1 })).toContain('1 statement has')
    expect(t('quality.duplicateHint', { count: 1 })).toContain('1 transaction may be a duplicate. Without a unique bank reference, it remains')
    expect(t('quality.referenceHint', { count: 1 })).toContain('1 transaction has conflicting bank references and remains')
    expect(t('quality.unverifiedHint', { count: 1 })).toContain('1 balance check lacks')
    expect(t('quality.uncertainHint', { count: 1 })).toContain('1 transaction lacks')
  })

  it.each([0, 2])('handles plural progress and warning verbs for %i', (count) => {
    expect(t('pdf.batchProgress', { completed: 0, total: count })).toBe(`Processed 0 of ${count} files`)
    expect(t('pdf.pageProgress', { completed: 0, total: count })).toBe(`Extracted 0 of ${count} pages`)
    expect(t('pdf.frozen', { seconds: count })).toContain(`in ${count} seconds.`)
    expect(t('pdf.needsAttention', { count })).toBe(`${count} files need attention`)
    expect(t('cashback.checkWarning', { count })).toContain(`${count} statements have`)
    expect(t('quality.duplicateHint', { count })).toContain('they remain')
    expect(t('quality.referenceHint', { count })).toContain('transactions have conflicting bank references and remain')
    expect(t('quality.unverifiedHint', { count })).toContain('balance checks lack')
    expect(t('quality.uncertainHint', { count })).toContain('transactions lack')
  })
})
