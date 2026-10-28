import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'
import { verifySeoBuild } from './audit-seo.mjs'
import { zh } from '../src/i18n/zh.ts'

// Explicit build/cache audit. The copy edit exists only in a build transform;
// source files, the normal dist directory and business data are never changed.
const [directory] = process.argv.slice(2)
if (!directory) throw new Error('Usage: node scripts/audit-build.mjs <output-dir-outside-repository>')
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
  const result = await build({
    root,
    configFile: join(root, 'vite.config.ts'),
    logLevel: 'warn',
    build: { outDir: join(work, name), emptyOutDir: true, reportCompressedSize: false },
    plugins: probe ? [{
      name: 'cache-audit-copy-edit',
      enforce: 'pre',
      transform(code, id) {
        if (id !== join(root, 'src/i18n/zh.ts')) return
        const changed = code.replace(`'cashback.emptyTitle': '${heading}'`, `'cashback.emptyTitle': '${probeHeading}'`)
        assert.notEqual(changed, code, 'The copy probe must change a rendered message.')
        transformed = true
        return { code: changed, map: null }
      },
    }] : [],
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
  const engine = chunks.find(chunk => chunk.name === 'pdf-engine')
  const dialogs = chunks.find(chunk => chunk.name === 'DialogContents')
  assert.ok(runtime && engine, 'Both stable dependency chunks must exist.')
  assert.ok(dialogs && !initial.has(dialogs.fileName), 'Dialog content must stay lazy.')
  assert.ok(initial.has(runtime.fileName), 'React must be available on initial navigation.')
  assert.ok(!initial.has(engine.fileName), 'PDF.js must stay lazy.')
  assert.equal(engine.imports.length, 0, 'The PDF engine must not depend on the app entry.')
  for (const chunk of [runtime, engine]) {
    assert.ok(!Object.keys(chunk.modules).some(id => id.startsWith(join(root, 'src/'))), `${chunk.name} must contain no business modules.`)
  }
  for (const file of initial) {
    assert.ok(!Object.keys(byFile.get(file).modules).some(id => /[\\/]pdfjs-dist[\\/]/.test(id)), 'No PDF.js module may enter the initial graph.')
    assert.ok(!Object.keys(byFile.get(file).modules).some(id => /[\\/](?:PrivacyDetails|RewardRules|FileStatusList|FileStatusRow|PasswordForm)\.tsx$/.test(id)), 'Deferred dialog bodies must not enter the initial graph.')
  }
  for (const chunk of chunks) {
    assert.ok(!Object.keys(chunk.modules).some(id => /[\\/]app[\\/]prerender\.tsx$|[\\/]react-dom[\\/].*server/.test(id)), 'Build-time rendering must not enter any browser chunk.')
  }
  await verifySeoBuild(join(work, name), {
    indexable: process.env.VERCEL_ENV !== 'preview',
    expectedHeading: probe ? probeHeading : heading,
  })
  const files = {}
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
  return {
    directory: join(work, name),
    entry: entry.fileName,
    stable: { react: runtime.fileName, pdf: engine.fileName },
    initial: [...initial],
    initialBytes: [...initial].reduce((sum, file) => sum + Buffer.byteLength(byFile.get(file).code), 0),
    initialGzipBytes: [...initial].reduce((sum, file) => sum + gzipSync(byFile.get(file).code).length, 0),
    totalBytes: Object.values(files).reduce((sum, file) => sum + file.bytes, 0),
    files,
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
const probe = await snapshot('copy-edit', true)
assert.notEqual(baseline.entry, probe.entry, 'The changed copy must invalidate the business entry.')
for (const kind of ['react', 'pdf']) {
  assert.equal(baseline.stable[kind], probe.stable[kind], `${kind} must retain its content hash.`)
  const file = baseline.stable[kind]
  assert.deepEqual(baseline.files[file], probe.files[file], `${kind} must remain byte-identical.`)
}
const chunkFiles = new Set(baseline.chunks.map(chunk => chunk.file))
const resources = Object.keys(baseline.files).filter(file => file.startsWith('assets/') && !chunkFiles.has(file))
for (const file of resources) assert.deepEqual(baseline.files[file], probe.files[file], `${file} must remain byte-identical.`)
const report = {
  probe: 'In-memory edit to cashback.emptyTitle in zh.ts; source files are untouched.',
  checks: { pdfStaysLazy: true, dialogsStayLazy: true, prerenderStaysBuildOnly: true, staticSeo: true, stableDependenciesUnchanged: true, unchangedResources: resources.length },
  baseline,
  copyEdit: { entry: probe.entry, stable: probe.stable, directory: probe.directory },
}
const reportPath = join(output, 'build-summary.json')
await writeFile(reportPath, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ report: reportPath, checks: report.checks, initialBytes: baseline.initialBytes, initialGzipBytes: baseline.initialGzipBytes, chunks: baseline.chunks }, null, 2))
