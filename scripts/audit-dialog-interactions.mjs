import assert from 'node:assert/strict'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { auditRuntime, origin } from './quality/runtime.mjs'

// Explicit local QA, with synthetic input from create-synthetic-interactions.py.
const [moduleRoot, directory] = process.argv.slice(2)
if (!moduleRoot || !directory)
  throw new Error('Usage: node scripts/audit-dialog-interactions.mjs <audit-node_modules> <synthetic-output-dir>')
const output = resolve(directory)
const fixture = join(output, 'SYNTHETIC-half-year.pdf')
await stat(fixture)
await mkdir(output, { recursive: true })
const { browser } = await auditRuntime(moduleRoot)
const checks = []

async function scenario({ hold = false, holdEngine = false, fail = false } = {}) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const errors = []
  let imports = 0
  let navigations = 0
  let held
  let heldEngine
  let signal
  const requested = new Promise(resolve => { signal = resolve })
  page.on('pageerror', error => errors.push(error.message))
  await page.setRequestInterception(true)
  page.on('request', request => {
    if (request.url().startsWith(origin)) {
      if (request.isNavigationRequest()) navigations++
      if (holdEngine && /\/pdf-engine-[^/]+\.js$/.test(request.url())) {
        heldEngine = request
        return
      }
      if (/\/DialogContents-[^/]+\.js$/.test(request.url())) {
        imports++
        signal()
        if (hold) { held = request; return }
        if (fail) { fail = false; return void request.abort() }
      }
      return void request.continue()
    }
    if (/^(data|blob):/.test(request.url())) return void request.continue()
    if (request.url() === 'https://api.frankfurter.dev/v2/providers/ecb/rate/hkd/cny')
      return void request.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), base: 'HKD', quote: 'CNY', rate: 0.85 }),
      })
    void request.abort()
  })
  await page.goto(origin, { waitUntil: 'networkidle0' })
  assert.equal(imports, 0, 'Navigation must not load dialog content.')
  return {
    page,
    context,
    errors,
    counts: () => ({ imports, navigations }),
    async waitForImport() {
      let timeout
      try {
        await Promise.race([requested, new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Dialog content was not requested.')), 5000)
        })])
      } finally { clearTimeout(timeout) }
    },
    async release() {
      hold = false
      assert.ok(held, 'A delayed request must exist.')
      await held.continue()
      held = undefined
      holdEngine = false
      if (heldEngine) await heldEngine.continue()
    },
  }
}

async function insideDialog(page) {
  await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement))
}

async function closedWithFocus(page, text) {
  await page.waitForFunction(text =>
    !document.querySelector('[role="dialog"]') && document.activeElement?.textContent.includes(text), {}, text)
}

const select = async page => (await page.$('input[type="file"]')).uploadFile(fixture)
const complete = page => page.waitForFunction(() => document.querySelector('[data-reward-total]')?.textContent.includes('4,680.00'))

try {
  const delayed = await scenario({ hold: true })
  await delayed.page.focus('button::-p-text(返现规则与算法)')
  await delayed.page.keyboard.press('Enter')
  await delayed.waitForImport()
  await delayed.page.waitForSelector('[data-dialog-content-state="loading"]')
  await insideDialog(delayed.page)
  await delayed.page.screenshot({ path: join(output, 'dialog-content-loading.png') })
  for (const key of ['Tab', 'Tab', 'Shift+Tab', 'Tab', 'Shift+Tab']) {
    if (key === 'Shift+Tab') {
      await delayed.page.keyboard.down('Shift')
      await delayed.page.keyboard.press('Tab')
      await delayed.page.keyboard.up('Shift')
    } else await delayed.page.keyboard.press(key)
    await insideDialog(delayed.page)
  }
  await delayed.page.keyboard.press('Escape')
  await closedWithFocus(delayed.page, '返现规则与算法')
  await delayed.release()
  await delayed.page.waitForNetworkIdle()
  assert.equal(await delayed.page.$('[role="dialog"]'), null, 'A late load must not reopen the closed dialog.')
  assert.match(await delayed.page.evaluate(() => document.activeElement.textContent), /返现规则与算法/)
  await delayed.page.locator('button::-p-text(隐私与独立声明)').click()
  await delayed.page.waitForSelector('[data-privacy-details]')
  await insideDialog(delayed.page)
  await delayed.page.keyboard.press('Escape')
  await closedWithFocus(delayed.page, '隐私与独立声明')
  await delayed.page.locator('button::-p-text(返现规则与算法)').click()
  await delayed.page.waitForSelector('[data-reward-rules]')
  await delayed.page.screenshot({ path: join(output, 'dialog-content-ready.png') })
  await delayed.page.focus('[role="tab"]::-p-text(计算口径)')
  await delayed.page.keyboard.press('ArrowRight')
  await delayed.page.waitForFunction(() => document.activeElement?.textContent.includes('官方依据'))
  await delayed.page.keyboard.press('Enter')
  await delayed.page.waitForFunction(() => document.querySelector('[role="tab"][aria-selected="true"]')?.textContent.includes('官方依据'))
  await delayed.page.keyboard.press('Escape')
  await closedWithFocus(delayed.page, '返现规则与算法')
  assert.equal(delayed.counts().imports, 1, 'Rules and privacy must reuse one loaded content module.')
  assert.deepEqual(delayed.errors, [])
  checks.push({ name: 'Delayed load: focus trap, Escape, late completion, cached dialogs and tab keyboard navigation', passed: true })
  await delayed.context.close()

  const background = await scenario({ hold: true })
  await select(background.page)
  await background.waitForImport()
  await insideDialog(background.page)
  await background.page.keyboard.press('Escape')
  await closedWithFocus(background.page, '查看文件状态')
  await complete(background.page)
  await background.release()
  await background.page.waitForNetworkIdle()
  assert.equal(await background.page.$('[role="dialog"]'), null)
  await background.page.locator('button::-p-text(查看文件状态)').click()
  await background.page.waitForSelector('[data-file-list] [data-batch-item]')
  assert.match(await background.page.$eval('[data-file-status-dialog]', el => el.textContent), /已加入 1 份结单，新增 2 笔交易/)
  await background.page.locator('button::-p-text(查看返现结果)').click()
  await closedWithFocus(background.page, '查看文件状态')
  assert.deepEqual(background.errors, [])
  checks.push({ name: 'Close while content loads: import continues, completed file status is current, result button restores focus', passed: true })
  await background.context.close()

  const cancelled = await scenario({ hold: true, holdEngine: true })
  await select(cancelled.page)
  await cancelled.waitForImport()
  await insideDialog(cancelled.page)
  await cancelled.page.locator('button::-p-text(取消本批导入)').click()
  // Base UI returns to the first tabbable child of the main region: the picker.
  await cancelled.page.waitForFunction(() => !document.querySelector('[role="dialog"]') && document.activeElement?.hasAttribute('data-file-picker-trigger'))
  await cancelled.release()
  await cancelled.page.waitForNetworkIdle()
  assert.equal(await cancelled.page.$$eval('[data-reward-card]', items => items.length), 0)
  assert.equal(await cancelled.page.$('[role="dialog"]'), null)
  await select(cancelled.page)
  await complete(cancelled.page)
  assert.deepEqual(cancelled.errors, [])
  checks.push({ name: 'Cancel with delayed content: batch stays cancelled and a new batch succeeds', passed: true })
  await cancelled.context.close()

  const failed = await scenario({ fail: true })
  await failed.page.locator('button::-p-text(查看示例)').click()
  await failed.page.waitForSelector('[data-reward-card]')
  const total = await failed.page.$eval('[data-reward-total]', el => el.textContent)
  await failed.page.locator('button::-p-text(返现规则与算法)').click()
  await failed.page.waitForSelector('[data-dialog-content-state="error"]')
  await insideDialog(failed.page)
  await failed.page.screenshot({ path: join(output, 'dialog-content-error.png') })
  await failed.page.locator('button::-p-text(重新加载内容)').click()
  await failed.page.waitForSelector('[data-reward-rules]')
  await insideDialog(failed.page)
  assert.equal(await failed.page.$eval('[data-reward-total]', el => el.textContent), total, 'Retry must retain the session.')
  assert.equal(failed.counts().navigations, 1, 'A load failure must not refresh the page.')
  await failed.page.keyboard.press('Escape')
  await closedWithFocus(failed.page, '返现规则与算法')
  assert.deepEqual(failed.errors, [])
  checks.push({ name: 'Failed download: local retry succeeds, focus and session survive without a page reload', passed: true })
  await failed.context.close()

  const clear = await scenario()
  await clear.page.locator('button::-p-text(查看示例)').click()
  await clear.page.waitForSelector('[data-reward-card]')
  await clear.page.locator('button::-p-text(重新开始)').click()
  await insideDialog(clear.page)
  await clear.page.locator('button::-p-text(取消)').click()
  await closedWithFocus(clear.page, '重新开始')
  assert.equal(clear.counts().imports, 0, 'The small clear confirmation should remain immediately available.')
  assert.deepEqual(clear.errors, [])
  checks.push({ name: 'Clear confirmation remains immediate and cancel restores its trigger focus', passed: true })
  await clear.context.close()

  await writeFile(join(output, 'dialog-interactions-summary.json'), JSON.stringify(checks, null, 2))
  console.log(JSON.stringify(checks, null, 2))
} finally {
  await browser.close()
}
