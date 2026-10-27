import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { auditRuntime, origin, summarizeFlow } from './quality/runtime.mjs'

// Opt-in Lighthouse user flow, only against the local build and its built-in synthetic example.
const [moduleRoot, directory, device = 'mobile'] = process.argv.slice(2)
if (!directory || !['mobile', 'desktop'].includes(device))
  throw new Error(
    'Usage: node scripts/audit-workspace.mjs <audit-node_modules> <output-dir> [mobile|desktop]',
  )
const output = resolve(directory)
await mkdir(output, { recursive: true })
const { browser, startFlow, desktopConfig } = await auditRuntime(moduleRoot)
try {
  const page = await browser.newPage()
  const flow = await startFlow(page, {
    name: `Pulse Rewards · ${device}`,
    ...(device === 'desktop' ? { config: desktopConfig } : {}),
    flags: {
      onlyCategories: ['performance', 'accessibility'],
      logLevel: 'error',
    },
  })
  await flow.navigate(origin, { name: 'Empty workspace · cold navigation' })
  await page.setViewport({
    width: device === 'mobile' ? 360 : 1280,
    height: 900,
  })
  await page.locator('button::-p-text(查看示例)').click()
  await page.waitForSelector('[data-reward-card]')
  await flow.snapshot({ name: 'Synthetic results · collapsed' })
  for (const trigger of await page.$$('button[data-slot="accordion-trigger"]'))
    await trigger.click()
  await flow.snapshot({ name: 'Reward reasons · expanded' })
  await page.locator('button::-p-text(返现规则与算法)').click()
  await page.waitForSelector('[data-reward-rules]')
  await flow.snapshot({ name: 'Reward rules and precision dialog' })
  await page.keyboard.press('Escape')
  await page.locator('button::-p-text(隐私与独立声明)').click()
  await page.waitForSelector('[role="dialog"]')
  await flow.snapshot({ name: 'Privacy dialog' })
  await page.keyboard.press('Escape')
  await page.locator('button::-p-text(重新开始)').click()
  await page.waitForSelector('[role="dialog"]')
  await flow.snapshot({ name: 'Clear confirmation' })
  const result = await flow.createFlowResult()
  await writeFile(
    join(output, `${device}-flow.html`),
    await flow.generateReport(),
  )
  await writeFile(
    join(output, `${device}-flow.json`),
    JSON.stringify(result, null, 2),
  )
  const summary = summarizeFlow(result)
  await writeFile(
    join(output, `${device}-summary.json`),
    JSON.stringify(summary, null, 2),
  )
  if (
    summary.some(
      (step) =>
        (step.scores.performance !== null && step.scores.performance < 90) ||
        step.scores.accessibility < 95 ||
        step.failures.length > 0,
    )
  )
    process.exitCode = 1
  console.log(
    JSON.stringify(
      summary.map(({ name, scores, failures }) => ({
        name,
        scores,
        failedAudits: failures.map((failure) => failure.id),
      })),
      null,
      2,
    ),
  )
} finally {
  await browser.close()
}
