import { expect, it, vi } from 'vitest'
import { zh } from '../i18n/zh'
import { en } from '../i18n/en'

it('renders a crawlable empty page without requests or session changes', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No build-time network access'))
  const { sessionStore } = await import('../store/memory-session')
  const before = sessionStore.getSnapshot()
  const { renderPage } = await import('./prerender')

  const html = renderPage()

  expect(html).toContain('<main')
  expect(html).toContain(zh['cashback.emptyTitle'])
  expect(html).toContain(zh['cashback.intro'])
  expect(html.match(/<h1\b/g)).toHaveLength(1)
  expect(html).toContain(zh['pdf.choose'])
  expect(html).toContain(zh['cashback.memory'])
  expect(html).toContain('data-statement-illustration="true" aria-hidden="true"')
  expect(html).not.toMatch(/style="[^"]*(?:opacity:\s*0(?:[;"]|$)|translateY\()/)
  expect(renderPage()).toBe(html)
  const english = renderPage('en-US')
  expect(english).toContain(en['cashback.emptyTitle'])
  expect(english).toContain(en['pdf.choose'])
  expect(english.match(/<h1\b/g)).toHaveLength(1)
  expect(english).not.toMatch(/style="[^"]*(?:opacity:\s*0(?:[;"]|$)|translateY\()/)
  expect(renderPage('en-US')).toBe(english)
  expect(sessionStore.getSnapshot()).toBe(before)
  expect(before.mode).toBe('empty')
  expect(fetch).not.toHaveBeenCalled()
})
