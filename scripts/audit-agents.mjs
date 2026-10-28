import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { AGENT_TOOLS } from '../src/application/agent/catalog.ts'
import { AGENT_DOCUMENT_PATHS } from '../src/application/agent/contract.ts'
import { AGENT_PROBLEMS } from '../src/application/agent/errors.ts'

/** Validate emitted public documents against the callable contract, independently of their renderer. */
export async function verifyAgentBuild(directory, { originTrialToken } = {}) {
  const html = await readFile(join(directory, 'index.html'), 'utf8')
  const overview = await readFile(join(directory, AGENT_DOCUMENT_PATHS.overview), 'utf8')
  const guide = await readFile(join(directory, AGENT_DOCUMENT_PATHS.guide), 'utf8')
  const discoveryLinks = [...html.matchAll(/<link\b[^>]*rel="describedby"[^>]*>/g)]
  assert.equal(discoveryLinks.length, 1, 'The page must link to exactly one agent overview.')
  assert.ok(discoveryLinks[0][0].includes(`href="${AGENT_DOCUMENT_PATHS.overview}"`))
  const trialTags = [...html.matchAll(/<meta\b[^>]*http-equiv="origin-trial"[^>]*>/g)]
  assert.equal(trialTags.length, originTrialToken ? 1 : 0, 'Only an explicitly configured origin-trial token may be emitted.')
  if (originTrialToken) assert.ok(trialTags[0][0].includes(`content="${originTrialToken}"`))

  assert.ok(overview.startsWith('# Reward+\n\n> '), 'llms.txt must provide a short site description.')
  assert.ok(overview.length < 2000, 'Keep the site overview concise; detailed contracts belong in the guide.')
  assert.ok(overview.includes(`](${AGENT_DOCUMENT_PATHS.guide})`))
  assert.ok(!overview.includes('reward_get_') && !overview.includes('```'), 'The overview must not duplicate tool contracts.')
  assert.ok(guide.includes(`](${AGENT_DOCUMENT_PATHS.overview})`))
  assert.ok(guide.includes('project-specific') && guide.includes('not a standard WebMCP discovery URL'))
  assert.ok(!/<!doctype|<html|\/agents\/webmcp\.md/i.test(overview + guide), 'Public text paths must not receive the SPA fallback or old guide path.')

  const sections = [...guide.matchAll(/^### (reward_[a-z_]+)\n([^]*?)(?=^### |^## |$(?![^]))/gm)]
  assert.deepEqual(sections.map(([, name]) => name), Object.keys(AGENT_TOOLS), 'Every callable tool must be documented exactly once.')

  for (const [, name, section] of sections) {
    const schema = section.match(/```json\n([^]*?)\n```/)?.[1]
    assert.ok(schema, `${name} must document a machine-readable input schema.`)
    assert.deepEqual(JSON.parse(schema), AGENT_TOOLS[name].inputSchema, `${name} documentation must match its live input schema.`)
    assert.ok(!/\b(?:password|base64|filePath|pdfUrl)\b/.test(JSON.stringify(JSON.parse(schema))), 'Tools must not accept passwords or PDF transport arguments.')
  }

  const errors = [...guide.matchAll(/^- agent\.([a-z_]+):/gm)].map(([, code]) => code)
  assert.deepEqual(errors, [...AGENT_PROBLEMS], 'Document stable errors and their recovery guidance.')

  for (const target of new Set([...`${overview}\n${guide}`.matchAll(/\]\((\/[^)]*)\)/g)].map(([, path]) => path))) {
    assert.ok(['/', ...Object.values(AGENT_DOCUMENT_PATHS)].includes(target), `Unknown local documentation link: ${target}`)
    if (target !== '/') await readFile(join(directory, target))
  }

  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
  for (const path of Object.values(AGENT_DOCUMENT_PATHS)) {
    const headers = config.headers.find((rule) => rule.source === path)?.headers ?? []
    assert.ok(headers.some(({ key, value }) => key.toLowerCase() === 'content-type' && value === 'text/plain; charset=utf-8'), `${path} must be served as UTF-8 plain text.`)
    assert.ok(headers.some(({ key, value }) => key.toLowerCase() === 'cache-control' && value === 'no-cache'), `${path} must revalidate its contract after deployment.`)
  }
}
