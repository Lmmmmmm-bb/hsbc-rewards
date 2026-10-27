import { mkdir, stat, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { auditRuntime, origin } from './quality/runtime.mjs'

// This runner accepts only the generator's synthetic fixture, never real bank files.
const [moduleRoot, directory, run = 'import'] = process.argv.slice(2)
if (!directory)
  throw new Error(
    'Usage: node scripts/benchmark-import.mjs <audit-node_modules> <output-dir>',
  )
if (!/^[a-z0-9-]{1,40}$/.test(run))
  throw new Error('Use a short alphanumeric run name.')
const output = resolve(directory)
await mkdir(output, { recursive: true })
const fixture = join(output, 'SYNTHETIC-benchmark-100.pdf')
await stat(fixture)
const { browser, startFlow, desktopConfig } = await auditRuntime(moduleRoot)
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  await page.setCacheEnabled(false)
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    if (
      request.url() ===
      'https://api.frankfurter.dev/v2/providers/ecb/rate/hkd/cny'
    ) {
      void request.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          base: 'HKD',
          quote: 'CNY',
          rate: 0.85,
        }),
      })
    } else if (
      request.url().startsWith(origin) ||
      request.url().startsWith('data:') ||
      request.url().startsWith('blob:')
    )
      void request.continue()
    else void request.abort()
  })
  await page.goto(origin, { waitUntil: 'networkidle0' })
  const flow = await startFlow(page, {
    name: '100-page synthetic import · unthrottled local host',
    config: desktopConfig,
    flags: {
      onlyCategories: ['performance'],
      throttlingMethod: 'provided',
      logLevel: 'error',
    },
  })
  await flow.startTimespan({ name: 'Select PDF → fully calculated result' })
  await page.evaluate(() => {
    const measurement = { startedAt: null, finishedAt: null, longTasks: [] }
    window.__pulseBenchmark = measurement
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        measurement.longTasks.push({
          startTime: entry.startTime,
          duration: entry.duration,
        })
    }).observe({ type: 'longtask' })
    document.querySelector('input[type="file"]').addEventListener(
      'change',
      () => {
        measurement.startedAt = performance.now()
      },
      { capture: true, once: true },
    )
    const observer = new MutationObserver(() => {
      const summary =
        document.querySelector('[data-reward-summary]')?.textContent ?? ''
      const total =
        document.querySelector('[data-reward-total]')?.textContent ?? ''
      if (
        measurement.startedAt !== null &&
        measurement.finishedAt === null &&
        total.includes('480.00') &&
        !summary.includes('待换算') &&
        document.body.textContent.includes('已加入 1 份结单，新增 2000 笔交易')
      ) {
        measurement.finishedAt = performance.now()
        observer.disconnect()
      }
    })
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    })
  })
  const input = await page.$('input[type="file"]')
  await input.uploadFile(fixture)
  await page.waitForFunction(
    () => window.__pulseBenchmark.finishedAt !== null,
    { timeout: 30000 },
  )
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  )
  const measurement = await page.evaluate(() => {
    const { startedAt, finishedAt, longTasks } = window.__pulseBenchmark
    const duringImport = longTasks.filter(
      (task) =>
        task.startTime + task.duration > startedAt &&
        task.startTime < finishedAt,
    )
    return {
      elapsedMs: finishedAt - startedAt,
      longTasks: duringImport,
      maxObservedLongTaskMs: Math.max(
        0,
        ...duringImport.map((task) => task.duration),
      ),
      transactions: 2000,
      pages: 100,
      fx: 'synthetic 0.85; public network latency excluded',
    }
  })
  await flow.endTimespan()
  const result = await flow.createFlowResult()
  const report = {
    ...measurement,
    browser: await browser.version(),
    timing:
      'file-input change to complete RC and CNY DOM; UI loaded; browser HTTP cache disabled; unthrottled CPU',
    longTaskThresholdMs: 50,
  }
  await writeFile(
    join(output, `${run}-timespan.html`),
    await flow.generateReport(),
  )
  await writeFile(
    join(output, `${run}-timespan.json`),
    JSON.stringify(result, null, 2),
  )
  await writeFile(
    join(output, `${run}-benchmark.json`),
    JSON.stringify(report, null, 2),
  )
  console.log(JSON.stringify(report, null, 2))
  if (report.elapsedMs >= 5000 || report.longTasks.length > 0)
    process.exitCode = 1
} finally {
  await browser.close()
}
