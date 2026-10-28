import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SITE_URL, SOCIAL_IMAGE } from '../src/app/seo.ts'

/** Check emitted artifacts, independently of Vite's plugin implementation. */
export async function verifySeoBuild(directory, { indexable, expectedHeading }) {
  const html = await readFile(join(directory, 'index.html'), 'utf8')
  const charset = html.indexOf('<meta charset="UTF-8"')
  assert.ok(charset >= 0 && Buffer.byteLength(html.slice(0, charset)) < 1024, 'The character encoding must remain in the first 1024 bytes.')
  assert.match(html, /<div id="root"><div data-workspace-shell/)
  const headings = [...html.matchAll(/<h1\b[^>]*>([^<]*)<\/h1>/g)]
  assert.equal(headings.length, 1)
  assert.equal(headings[0][1], expectedHeading)
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1, 'Only one canonical URL may be emitted.')
  assert.ok(html.includes(`rel="canonical" href="${SITE_URL}"`))
  const robotsDirective = indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow'
  assert.ok(html.includes(`name="robots" content="${robotsDirective}"`), 'Only the production build may be indexed.')

  const socialTags = new Map()
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/g)) {
    const name = tag.match(/(?:name|property)="((?:og|twitter):[^"]+)"/)?.[1]
    if (!name) continue
    assert.ok(!socialTags.has(name), `${name} must not be emitted twice.`)
    socialTags.set(name, tag.match(/content="([^"]*)"/)?.[1])
  }
  assert.equal(socialTags.get('og:url'), SITE_URL)
  assert.equal(socialTags.get('og:type'), 'website')
  assert.equal(socialTags.get('og:image'), SOCIAL_IMAGE.url)
  assert.equal(socialTags.get('og:image:width'), String(SOCIAL_IMAGE.width))
  assert.equal(socialTags.get('og:image:height'), String(SOCIAL_IMAGE.height))
  assert.equal(socialTags.get('og:image:type'), SOCIAL_IMAGE.type)
  assert.equal(socialTags.get('twitter:card'), 'summary_large_image')
  assert.equal(socialTags.get('twitter:image'), SOCIAL_IMAGE.url)
  for (const field of ['title', 'description', 'image:alt']) {
    assert.ok(socialTags.get(`og:${field}`), `Open Graph ${field} must be present.`)
    assert.equal(socialTags.get(`twitter:${field}`), socialTags.get(`og:${field}`))
  }

  assert.ok(!html.includes('<!--app-html-->') && !/\b(?:src|href)="\/src\//.test(html), 'Pre-rendered HTML must contain only built asset URLs.')
  const fontPreloads = [...html.matchAll(/<link\b[^>]*rel="preload"[^>]*>/g)].map(([tag]) => {
    assert.match(tag, /as="font"/)
    assert.match(tag, /type="font\/woff2"/)
    assert.match(tag, /\bcrossorigin(?:\s|=|>)/)
    const url = tag.match(/href="(\/assets\/[^"]+\.woff2)"/)?.[1]
    assert.ok(url, 'Preloaded fonts must use built asset URLs.')
    return url
  })
  assert.equal(fontPreloads.length, 2, 'Only the two visible Latin fonts should be preloaded.')
  assert.equal(new Set(fontPreloads).size, 2, 'A font must not be preloaded twice.')
  for (const family of ['inter-latin-wght-normal-', 'roboto-latin-500-normal-']) {
    assert.ok(fontPreloads.some(url => url.startsWith(`/assets/${family}`)), 'Preload the exact font subsets used on the initial page.')
  }
  const stylesheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g)]
  const css = (await Promise.all(stylesheets.map(([, url]) => readFile(join(directory, url), 'utf8')))).join('\n')
  for (const url of fontPreloads) {
    await readFile(join(directory, url))
    assert.ok(css.includes(url), 'A preloaded font must reuse its stylesheet URL.')
  }
  const structuredData = JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)?.[1] ?? '')
  assert.equal(structuredData['@graph'].find(item => item['@type'] === 'WebSite').url, SITE_URL)
  const robots = await readFile(join(directory, 'robots.txt'), 'utf8')
  const sitemap = await readFile(join(directory, 'sitemap.xml'), 'utf8')
  assert.ok(robots.includes(`Sitemap: ${SITE_URL}sitemap.xml`))
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, 1)
  assert.ok(sitemap.includes(`<loc>${SITE_URL}</loc>`))
  const image = await readFile(join(directory, SOCIAL_IMAGE.fileName))
  assert.equal(image.subarray(1, 4).toString(), 'PNG')
  assert.equal(image.readUInt32BE(16), SOCIAL_IMAGE.width)
  assert.equal(image.readUInt32BE(20), SOCIAL_IMAGE.height)
}
