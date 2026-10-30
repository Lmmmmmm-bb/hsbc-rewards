import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'
import { verifySeoBuild } from './audit-seo.mjs'
import { verifyAgentBuild } from './audit-agents.mjs'
import { verifyLocaleStartupBuild } from './audit-locale-startup.mjs'
import { zh } from '../src/i18n/zh.ts'

// Cache comparisons are opt-in. Their copy edit exists only in a build transform.
const { values, positionals } = parseArgs({
  options: { 'check-cache': { type: 'boolean', default: false } },
  allowPositionals: true,
})
assert.equal(positionals.length, 1, 'Usage: node scripts/audit-build.mjs [--check-cache] <output-dir-outside-repository>')
const [directory] = positionals
const checkCache = values['check-cache']

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(directory)
const fromRoot = relative(root, output)
assert.ok(fromRoot === '..' || fromRoot.startsWith('../'), 'Use an output directory outside the repository.')
await mkdir(output, { recursive: true })
const work = await mkdtemp(join(output, 'build-'))
const heading = zh['cashback.emptyTitle']
const probeHeading = `${heading}（缓存验收）`

async function snapshot(name, probe = false) {
  let transformed = false
  const staticModules = new Set()
  const result = await build({
    root,
    configFile: join(root, 'vite.config.ts'),
    logLevel: 'warn',
    build: { outDir: join(work, name), emptyOutDir: true, reportCompressedSize: false },
    plugins: [{
      name: 'cache-audit-static-graph',
      generateBundle(_options, bundle) {
        const entry = Object.values(bundle).find(item => item.type === 'chunk' && item.isEntry)
        assert.ok(entry?.facadeModuleId, 'The browser entry must have a source module.')

        const visit = (id) => {
          if (staticModules.has(id)) return

          staticModules.add(id)
          this.getModuleInfo(id)?.importedIds.forEach(visit)
        }

        visit(entry.facadeModuleId)
      },
    }, ...(probe ? [{
      name: 'cache-audit-copy-edit',
      enforce: 'pre',
      transform(code, id) {
        if (id !== join(root, 'src/i18n/zh.ts')) return

        const changed = code.replace(`'cashback.emptyTitle': '${heading}'`, `'cashback.emptyTitle': '${probeHeading}'`)
        assert.notEqual(changed, code, 'The copy probe must change a rendered message.')
        transformed = true

        return { code: changed, map: null }
      },
    }] : [])],
  })
  assert.ok(!probe || transformed, 'The copy probe must run.')
  assert.ok(!Array.isArray(result) && 'output' in result)
  const chunks = result.output.filter(item => item.type === 'chunk')
  const byFile = new Map(chunks.map(chunk => [chunk.fileName, chunk]))
  const entry = chunks.find(chunk => chunk.isEntry)
  assert.ok(entry, 'A browser entry must exist.')
  const initial = new Set()

  function visit(file) {
    if (initial.has(file)) return

    const chunk = byFile.get(file)
    assert.ok(chunk, `Missing eager import: ${file}`)
    initial.add(file)
    chunk.imports.forEach(visit)
  }

  visit(entry.fileName)
  const runtime = chunks.find(chunk => chunk.name === 'react-runtime')
  const ui = chunks.find(chunk => chunk.name === 'ui-runtime')
  const engine = chunks.find(chunk => chunk.name === 'pdf-engine')
  const reader = chunks.find(chunk => chunk.name === 'pdfjs-reader')
  const dialogs = chunks.find(chunk => chunk.name === 'DialogContents')
  const agentService = chunks.find(chunk => Object.keys(chunk.modules).includes(join(root, 'src/application/agent/service.ts')))
  assert.ok(runtime && ui && engine, 'All stable dependency chunks must exist.')
  assert.ok(reader && !initial.has(reader.fileName), 'The PDF reader must stay lazy.')
  assert.ok(dialogs && !initial.has(dialogs.fileName), 'Dialog content must stay lazy.')
  assert.ok(agentService && !initial.has(agentService.fileName), 'Agent result queries must load only when native WebMCP is available.')
  assert.ok(initial.has(runtime.fileName), 'React must be available on initial navigation.')
  assert.ok(initial.has(ui.fileName), 'Shared UI code must be available on initial navigation.')
  assert.ok(!initial.has(engine.fileName), 'PDF.js must stay lazy.')
  assert.equal(engine.imports.length, 0, 'The PDF engine must not depend on the app entry.')

  for (const chunk of [runtime, ui, engine]) {
    assert.ok(!Object.keys(chunk.modules).some(id => id.startsWith(join(root, 'src/'))), `${chunk.name} must contain no business modules.`)
  }

  for (const file of initial) {
    for (const id of Object.keys(byFile.get(file).modules)) {
      if (id === '\0rolldown/runtime.js') continue
      assert.ok(staticModules.has(id), `A lazy-only module must not be promoted into the initial graph: ${id}`)
    }

    assert.ok(!Object.keys(byFile.get(file).modules).some(id => /[\\/]pdfjs-dist[\\/]/.test(id)), 'No PDF.js module may enter the initial graph.')
    assert.ok(!Object.keys(byFile.get(file).modules).some(id => /[\\/](?:PrivacyDetails|RewardRules|FileStatusList|FileStatusRow|PasswordForm)\.tsx$/.test(id)), 'Deferred dialog bodies must not enter the initial graph.')
  }

  const pdfResources = result.output.filter(item => item.type === 'asset' && item.originalFileNames.some(name => /[\\/]pdfjs-dist[\\/](?:cmaps|standard_fonts|wasm)[\\/]/.test(name)))
  assert.ok(pdfResources.some(item => item.fileName.endsWith('.bcmap')), 'CMaps must be emitted as independent resources.')

  for (const id of Object.keys(reader.modules).filter(id => /[\\/]pdfjs-dist[\\/](?:cmaps|standard_fonts|wasm)[\\/]/.test(id))) {
    assert.ok(id.includes('no-inline'), 'All PDF support URLs must explicitly opt out of inlining.')
  }

  assert.ok(!/["'`]data:/.test(reader.code), 'The PDF reader must not embed support data URLs.')

  for (const chunk of chunks) {
    assert.ok(!Object.keys(chunk.modules).some(id => /[\\/]app[\\/]prerender\.tsx$|[\\/]react-dom[\\/].*server/.test(id)), 'Build-time rendering must not enter any browser chunk.')
    assert.ok(!Object.keys(chunk.modules).some(id => /[\\/]app[\\/]agent-documents\.ts$|[\\/]scripts[\\/]/.test(id)), 'Public-document rendering and verification must stay outside browser chunks.')
    assert.ok(!Object.keys(chunk.modules).some(id => /[\\/]locale-startup[\\/]bootstrap\.ts$/.test(id)), 'Static activation must not be bundled a second time in React.')
  }

  await verifySeoBuild(join(work, name), {
    indexable: process.env.VERCEL_ENV !== 'preview',
    expectedHeading: probe ? probeHeading : heading,
  })
  await verifyLocaleStartupBuild(join(work, name), { expectedHeading: probe ? probeHeading : heading })
  await verifyAgentBuild(join(work, name), { originTrialToken: process.env.WEBMCP_ORIGIN_TRIAL_TOKEN })
  const files = checkCache ? {} : undefined
  if (files) {
    async function collect(folder) {
      for (const item of await readdir(folder, { withFileTypes: true })) {
        const path = join(folder, item.name)
        if (item.isDirectory()) await collect(path)
        else {
          const data = await readFile(path)
          files[relative(join(work, name), path)] = { bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') }
        }
      }
    }

    await collect(join(work, name))
  }

  return {
    directory: join(work, name),
    entry: entry.fileName,
    stable: { react: runtime.fileName, ui: ui.fileName, pdf: engine.fileName },
    initial: [...initial],
    initialBytes: [...initial].reduce((sum, file) => sum + Buffer.byteLength(byFile.get(file).code), 0),
    initialGzipBytes: [...initial].reduce((sum, file) => sum + gzipSync(byFile.get(file).code).length, 0),
    ...(files ? { files, totalBytes: Object.values(files).reduce((sum, file) => sum + file.bytes, 0) } : {}),
    chunks: chunks.map(chunk => ({
      file: chunk.fileName,
      name: chunk.name,
      bytes: Buffer.byteLength(chunk.code),
      gzipBytes: gzipSync(chunk.code).length,
      imports: chunk.imports,
      dynamicImports: chunk.dynamicImports,
    })),
  }
}

const baseline = await snapshot('baseline')
let cache = { status: 'skipped' }
if (checkCache) {
  const probe = await snapshot('copy-edit', true)
  assert.notEqual(baseline.entry, probe.entry, 'The changed copy must invalidate the business entry.')

  for (const kind of ['react', 'ui', 'pdf']) {
    assert.equal(baseline.stable[kind], probe.stable[kind], `${kind} must retain its content hash.`)
    const file = baseline.stable[kind]
    assert.deepEqual(baseline.files[file], probe.files[file], `${kind} must remain byte-identical.`)
  }

  const chunkFiles = new Set(baseline.chunks.map(chunk => chunk.file))
  const resources = Object.keys(baseline.files).filter(file => file.startsWith('assets/') && !chunkFiles.has(file))
  for (const file of resources) assert.deepEqual(baseline.files[file], probe.files[file], `${file} must remain byte-identical.`)
  for (const file of ['llms.txt', 'webmcp.txt']) assert.deepEqual(baseline.files[file], probe.files[file], `${file} must be independent of page copy and session state.`)
  cache = {
    status: 'passed',
    probe: 'In-memory edit to cashback.emptyTitle in zh.ts; source files are untouched.',
    stableDependenciesUnchanged: true,
    unchangedResources: resources.length,
    copyEdit: { entry: probe.entry, stable: probe.stable, directory: probe.directory },
  }
}
const report = {
  mode: checkCache ? 'cache' : 'build',
  checks: { pdfStaysLazy: true, dialogsStayLazy: true, agentServiceStaysLazy: true, noLazyModulesPromoted: true, pdfSupportDataExternal: true, prerenderStaysBuildOnly: true, staticSeo: true, bilingualStartup: true, agentDocumentsMatchContract: true },
  baseline,
  cache,
}
const reportPath = join(output, 'build-summary.json')
await writeFile(reportPath, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ report: reportPath, mode: report.mode, checks: report.checks, cache: report.cache, initialBytes: baseline.initialBytes, initialGzipBytes: baseline.initialGzipBytes, chunks: baseline.chunks }, null, 2))
