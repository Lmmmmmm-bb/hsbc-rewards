import { describe, expect, it } from 'vitest'
import type { ImportItem, ImportSnapshot } from '../import/types'
import { readAgentImport } from './import-query'
import { createAgentReferences } from './references'
import { createAgentPagination } from './pagination'

function setup() {
  let id = 0
  const nextId = () => `synthetic-${++id}`
  const references = createAgentReferences(nextId)
  const pages = createAgentPagination(nextId)
  const items: ImportItem[] = Array.from({ length: 201 }, (_, index) => ({
    id: `file-${index}`, name: 'PRIVATE_FILE.pdf', size: 100, status: index === 200 ? 'locked' : 'error',
    problem: index === 200 ? 'password-required' : 'invalid-pdf', completedPages: 0, totalPages: null,
    textRows: 0, transactions: 0, gate: { failures: 0, until: 0 },
  }))
  const batch: ImportSnapshot = { batch: 1, active: true, items, rejected: null,
    outcome: { status: 'idle', files: 0, transactions: 0 } }
  return { references, pages, batch }
}

describe('bounded import status', () => {
  it('pages every file once while keeping whole-batch counts and actions on every page', () => {
    const { references, pages, batch } = setup()
    let page = readAgentImport(batch, references, 1000, { limit: 20 }, pages)
    const files = [...page.files]
    for (let pageNumber = 0; pageNumber < 11; pageNumber++) {
      expect(page).toMatchObject({ totalCount: 201, failedFiles: 200, uncommittedFiles: 1, nextAction: 'user_unlock' })
      expect(page.files.length).toBeLessThanOrEqual(20)
      if (!page.nextCursor) break
      page = readAgentImport(batch, references, 1000, { batchRef: page.batchRef, cursor: page.nextCursor, limit: 20 }, pages)
      files.push(...page.files)
    }
    expect(files.map((file) => file.selectionIndex)).toEqual(Array.from({ length: 201 }, (_, index) => index + 1))
    expect(new Set(files.map((file) => file.fileRef)).size).toBe(201)
    expect(files.at(-1)?.status).toBe('locked')
    expect(JSON.stringify(files)).not.toContain('PRIVATE_')
  })

  it('retains a cursor during progress but rejects changed batches and removals', () => {
    const { references, pages, batch } = setup()
    const first = readAgentImport(batch, references, 1000, {}, pages)
    const input = { batchRef: first.batchRef, cursor: first.nextCursor! }
    const updated = { ...batch, items: batch.items.map((item) => ({ ...item, completedPages: 1 })) }
    expect(readAgentImport(updated, references, 1000, input, pages).files[0].selectionIndex).toBe(11)
    expect(() => readAgentImport(batch, references, 1000, { cursor: first.nextCursor! }, pages)).toThrow('agent.invalid_arguments')
    expect(() => readAgentImport({ ...batch, batch: 2 }, references, 1000, input, pages)).toThrow('agent.batch_changed')
    const removed = { ...batch, items: batch.items.map((item, index) => index === 0 ? { ...item, status: 'removed' as const } : item) }
    expect(() => readAgentImport(removed, references, 1000, input, pages)).toThrow('agent.cursor_invalid')
    const restarted = readAgentImport(removed, references, 1000, {}, pages)
    expect(restarted.totalCount).toBe(200)
    expect(restarted.files[0].selectionIndex).toBe(2)
  })
})
