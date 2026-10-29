import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { JSDOM } from 'jsdom'
import { en } from '../src/i18n/en.ts'
import { SITE_URL, pageMetadata } from '../src/app/seo.ts'

/** Execute the emitted classic scripts without React or network access. */
export async function verifyLocaleStartupBuild(directory, { expectedHeading }) {
  const html = await readFile(join(directory, 'index.html'), 'utf8')
  const preparation = html.indexOf('<script data-locale-prepare>')
  const rootPosition = html.indexOf('<div id="root"')
  const templatePosition = html.indexOf('<template id="prerender-en-US"')
  const activation = html.indexOf('<script data-locale-activate>')
  assert.ok(preparation > html.indexOf('<meta charset=') && preparation < html.indexOf('</head>') && preparation < rootPosition)
  assert.ok(rootPosition < templatePosition && templatePosition < activation, 'Activate only after both static versions are parsed.')
  const scripts = [...html.matchAll(/<script data-locale-(?:prepare|activate)>([^]*?)<\/script>/g)]
  assert.equal(scripts.length, 2)
  assert.ok(gzipSync(scripts.map(([, code]) => code).join('\n')).length <= 2048, 'Keep the inline language startup within 2 KiB gzip.')
  for (const locale of ['zh-CN', 'en-US']) {
    const page = new JSDOM(html, {
      url: SITE_URL,
      runScripts: 'dangerously',
      beforeParse(window) { window.localStorage.setItem('pulse.locale.v1', locale) },
    })
    try {
      const document = page.window.document
      assert.equal(document.documentElement.lang, locale)
      assert.equal(document.title, pageMetadata(locale).title)
      assert.equal(document.querySelector('#root')?.getAttribute('data-prerender-locale'), locale)
      assert.equal(document.querySelector('#root h1')?.textContent, locale === 'zh-CN' ? expectedHeading : en['cashback.emptyTitle'])
      assert.equal(document.documentElement.getAttribute('data-locale-startup'), null)
      assert.equal(document.querySelector('template'), null, 'Release alternate content after activation.')
    } finally { page.window.close() }
  }
}
