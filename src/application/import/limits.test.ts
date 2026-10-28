import { describe, expect, it } from 'vitest'
import {
  EMPTY_GATE,
  hasPdfHeader,
  IMPORT_LIMITS,
  passwordWaitSeconds,
  recordPasswordFailure,
  validatePdfSource,
} from './limits'

const file = (size: number, name = 'synthetic.pdf', type = 'application/pdf') => ({
  size,
  name,
  type,
  arrayBuffer: async () => new ArrayBuffer(0),
})

describe('import limits and password gate', () => {
  it('accepts exact byte/file boundaries and rejects the next file or byte', () => {
    expect(
      validatePdfSource(file(IMPORT_LIMITS.fileBytes), { files: 19, bytes: 75 * 1024 * 1024 }),
    ).toBeNull()
    expect(validatePdfSource(file(IMPORT_LIMITS.fileBytes + 1), { files: 0, bytes: 0 })).toBe(
      'file-too-large',
    )
    expect(validatePdfSource(file(1), { files: 20, bytes: 0 })).toBe('session-limit')
    expect(validatePdfSource(file(1), { files: 1, bytes: IMPORT_LIMITS.sessionBytes })).toBe(
      'session-limit',
    )
  })

  it('requires a PDF filename, compatible MIME and nonempty data, allowing blank MIME', () => {
    expect(validatePdfSource(file(1, 'SYNTHETIC.PDF', ''), { files: 0, bytes: 0 })).toBeNull()
    expect(validatePdfSource(file(1, 'x.txt'), { files: 0, bytes: 0 })).toBe('not-pdf')
    expect(validatePdfSource(file(1, 'x.pdf', 'text/plain'), { files: 0, bytes: 0 })).toBe(
      'not-pdf',
    )
    expect(validatePdfSource(file(0), { files: 0, bytes: 0 })).toBe('empty-file')
    expect(hasPdfHeader(new TextEncoder().encode('preamble\n%PDF-1.7').buffer)).toBe(true)
    expect(hasPdfHeader(new TextEncoder().encode('not a pdf').buffer)).toBe(false)
  })

  it('freezes only after five failures and starts a fresh counter after 60 seconds', () => {
    let gate = EMPTY_GATE
    for (let i = 0; i < 4; i++) gate = recordPasswordFailure(gate, 1000)

    expect(gate.until).toBe(0)

    gate = recordPasswordFailure(gate, 1000)

    expect(passwordWaitSeconds(gate, 1000)).toBe(60)
    expect(passwordWaitSeconds(gate, 60_001)).toBe(1)
    expect(passwordWaitSeconds(gate, 61_000)).toBe(0)
    expect(recordPasswordFailure(gate, 61_000)).toEqual({ failures: 1, until: 0 })
  })
})
