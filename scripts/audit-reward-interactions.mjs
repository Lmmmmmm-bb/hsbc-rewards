import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { auditRuntime, origin, summarizeFlow } from './quality/runtime.mjs'

// Explicit Lighthouse user flow with fixed synthetic inputs. Never accepts real statement paths.
const [moduleRoot, directory] = process.argv.slice(2)
if (!directory)
  throw new Error(
    'Provide audit node_modules and the synthetic fixture directory.',
  )
const output = resolve(directory)
await mkdir(output, { recursive: true })
const { browser, startFlow, desktopConfig } = await auditRuntime(moduleRoot)
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  let requests = 0
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    if (request.url().startsWith(origin)) return void request.continue()
    if (
      request.url() ===
      'https://api.frankfurter.dev/v2/providers/ecb/rate/hkd/cny'
    ) {
      requests++
      return void request.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          base: 'HKD',
          quote: 'CNY',
          rate: 0.85,
        }),
      })
    }
    void request.abort()
  })
  const flow = await startFlow(page, {
    name: 'Pulse R1 synthetic interactions',
    config: desktopConfig,
    flags: { onlyCategories: ['accessibility'], logLevel: 'error' },
  })
  await flow.navigate(origin, { name: 'Empty workspace' })
  const drag = {
    items: [],
    files: [join(output, 'SYNTHETIC-half-year.pdf')],
    dragOperationsMask: 1,
  }
  await page.mouse.dragEnter({ x: 12, y: 100 }, drag)
  await page.mouse.dragOver({ x: 20, y: 120 }, drag)
  await page.waitForSelector('[data-page-drop-overlay]')
  await flow.snapshot({ name: 'Whole-page file drop overlay' })
  await page.screenshot({ path: join(output, 'whole-page-drop.png') })
  await page.mouse.drop({ x: 20, y: 120 }, drag)
  await page.waitForFunction(() =>
    document
      .querySelector('[data-reward-total]')
      ?.textContent.includes('4,680.00'),
  )
  await page.waitForFunction(() =>
    document.querySelector('[data-fx-reference]')?.textContent.includes('0.85'),
  )
  assert.equal(await page.$('[data-page-drop-overlay]'), null)
  assert.equal(
    await page.$$eval('[data-reward-breakdown]', (items) => items.length),
    2,
  )
  assert.equal(
    await page.$$eval('[data-batch-item]', (items) => items.length),
    0,
    'Completed files collapse automatically',
  )
  await flow.snapshot({ name: 'Two half-years · independent reward groups' })
  await page.locator('button::-p-text(2026 年 · 上半年)').click()
  assert.match(
    await page.$eval('[data-reward-total]', (el) => el.textContent),
    /3,760.00/,
  )
  assert.equal(
    await page.$eval('[data-reward-card] [role="progressbar"]', (el) =>
      Number(el.getAttribute('aria-valuenow')),
    ),
    90,
  )
  await flow.snapshot({ name: 'H1 annual cap as of June' })
  await page.locator('button::-p-text(2026 年 · 下半年)').click()
  assert.match(
    await page.$eval('[data-reward-total]', (el) => el.textContent),
    /920.00/,
  )
  const progress = await page.$$eval(
    '[data-reward-card] [role="progressbar"]',
    (items) => items.map((el) => Number(el.getAttribute('aria-valuenow'))),
  )
  assert.deepEqual(
    progress,
    [100, 37.5],
    'Annual cap continues; half-year cap resets',
  )
  await flow.snapshot({ name: 'H2 annual continuation and half-year reset' })
  await page.locator('button::-p-text(全部周期)').click()
  await (
    await page.$('input[type="file"]')
  ).uploadFile(join(output, 'SYNTHETIC-cross-year.pdf'))
  await page.waitForFunction(() =>
    document
      .querySelector('[data-reward-total]')
      ?.textContent.includes('4,680.24'),
  )
  assert.equal(
    await page.$$eval('[data-reward-breakdown]', (items) => items.length),
    3,
  )
  await page.screenshot({
    path: join(output, 'cross-period-desktop.png'),
    fullPage: true,
  })
  await flow.snapshot({ name: 'Cross-year results · three groups' })
  const widths = []
  for (const width of [320, 360, 768, 1280, 1440]) {
    await page.setViewport({ width, height: 900 })
    widths.push(
      await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    )
  }
  assert.ok(
    widths.every((item) => item.width === item.scrollWidth),
    'No horizontal page overflow',
  )
  await page.setViewport({ width: 360, height: 900 })
  await page.screenshot({
    path: join(output, 'cross-period-mobile.png'),
    fullPage: true,
  })
  await page.locator('button::-p-text(返现规则与算法)').click()
  await page.waitForSelector('[data-reward-rules]')
  await flow.snapshot({ name: 'Mobile rules dialog' })
  await page.keyboard.press('Escape')
  assert.match(
    await page.evaluate(() => document.activeElement?.textContent),
    /返现规则与算法/,
  )
  await page.reload({ waitUntil: 'networkidle0' })
  assert.equal(
    await page.$$eval('[data-reward-card]', (items) => items.length),
    0,
    'Refresh clears business data',
  )
  await (
    await page.$('input[type="file"]')
  ).uploadFile(
    ...Array.from({ length: 20 }, (_, index) =>
      join(output, `SYNTHETIC-batch-${String(index + 1).padStart(2, '0')}.pdf`),
    ),
  )
  await page.waitForFunction(() =>
    document
      .querySelector('[data-batch]')
      ?.textContent.includes('已加入 20 份结单，新增 20 笔交易。'),
  )
  assert.equal(
    await page.$$eval('[data-batch-item]', (items) => items.length),
    0,
  )
  await page.locator('button::-p-text(展开文件状态)').click()
  const list = await page.$eval('[data-file-list]', (el) => ({
    height: el.clientHeight,
    scrollHeight: el.scrollHeight,
    rows: el.children.length,
  }))
  assert.equal(list.rows, 20)
  assert.ok(
    list.height <= 256 && list.scrollHeight > list.height,
    'Twenty files are bounded and scrollable',
  )
  await flow.snapshot({ name: 'Twenty files · bounded list' })
  await page.screenshot({
    path: join(output, 'batch-mobile.png'),
    fullPage: true,
  })
  assert.equal(
    requests,
    1,
    'Same-day public cache survives refresh and reimport',
  )
  const textDrag = {
    items: [{ mimeType: 'text/plain', data: 'SYNTHETIC TEXT' }],
    dragOperationsMask: 1,
  }
  await page.mouse.dragEnter({ x: 10, y: 100 }, textDrag)
  await page.mouse.dragOver({ x: 20, y: 120 }, textDrag)
  assert.equal(
    await page.$('[data-page-drop-overlay]'),
    null,
    'Ordinary text dragging is unaffected',
  )
  await page.mouse.drop({ x: 20, y: 120 }, textDrag)
  assert.deepEqual(errors, [])
  const result = await flow.createFlowResult()
  const summary = summarizeFlow(result)
  assert.ok(
    summary.every(
      (step) => step.scores.accessibility >= 95 && !step.failures.length,
    ),
  )
  await writeFile(
    join(output, 'interactions-flow.html'),
    await flow.generateReport(),
  )
  await writeFile(
    join(output, 'interactions-summary.json'),
    JSON.stringify({ widths, list, requests, errors, steps: summary }, null, 2),
  )
  console.log(
    JSON.stringify(
      {
        widths,
        list,
        requests,
        errors,
        scores: summary.map((step) => ({ name: step.name, ...step.scores })),
      },
      null,
      2,
    ),
  )
} finally {
  await browser.close()
}
