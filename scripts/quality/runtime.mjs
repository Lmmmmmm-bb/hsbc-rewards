import { createRequire } from 'node:module'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const origin = 'http://localhost:5173/'

export async function auditRuntime(moduleRoot) {
  if (!moduleRoot)
    throw new Error(
      'Provide the optional audit node_modules directory as the first argument.',
    )
  const require = createRequire(join(resolve(moduleRoot), 'pulse-audit.cjs'))
  const lighthouse = await import(
    pathToFileURL(require.resolve('lighthouse')).href
  )
  const puppeteer = await import(
    pathToFileURL(require.resolve('puppeteer-core')).href
  )
  const browser = await puppeteer.launch({
    executablePath:
      process.env.CHROME_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-first-run', '--no-default-browser-check'],
  })
  return { ...lighthouse, browser }
}

export function summarizeFlow(result) {
  return result.steps.map(({ name, lhr }) => ({
    name,
    lighthouse: lhr.lighthouseVersion,
    browser: lhr.environment.hostUserAgent,
    device: lhr.configSettings.formFactor,
    mode: lhr.gatherMode,
    scores: Object.fromEntries(
      Object.entries(lhr.categories).map(([key, category]) => [
        key,
        (key === 'performance' && lhr.gatherMode !== 'navigation') ||
        category.score === null
          ? null
          : Math.round(category.score * 100),
      ]),
    ),
    metrics: Object.fromEntries(
      [
        'first-contentful-paint',
        'largest-contentful-paint',
        'total-blocking-time',
        'cumulative-layout-shift',
      ].map((key) => [key, lhr.audits[key]?.numericValue ?? null]),
    ),
    failures: Object.values(lhr.audits)
      .filter(
        (audit) =>
          audit.score !== null &&
          audit.score < 1 &&
          lhr.categories.accessibility?.auditRefs.some(
            (ref) => ref.id === audit.id && ref.weight > 0,
          ),
      )
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        items: audit.details?.items,
      })),
  }))
}
