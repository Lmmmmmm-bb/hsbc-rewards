import type { PdfSource } from '@/ports/pdf'

export const IMPORT_LIMITS = Object.freeze({
  fileBytes: 25 * 1024 * 1024,
  sessionBytes: 100 * 1024 * 1024,
  files: 20,
  pages: 200,
})
export type InputError = 'not-pdf' | 'file-too-large' | 'empty-file' | 'session-limit'

export function validatePdfSource(
  file: PdfSource,
  used: { files: number; bytes: number },
): InputError | null {
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) return 'not-pdf'
  if (file.size <= 0) return 'empty-file'
  if (file.size > IMPORT_LIMITS.fileBytes) return 'file-too-large'
  if (used.files >= IMPORT_LIMITS.files || used.bytes + file.size > IMPORT_LIMITS.sessionBytes)
    return 'session-limit'
  return null
}

export function hasPdfHeader(buffer: ArrayBuffer): boolean {
  return new TextDecoder('ascii')
    .decode(new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 1024)))
    .includes('%PDF-')
}

export interface PasswordGate {
  readonly failures: number
  readonly until: number
}
export const EMPTY_GATE: PasswordGate = Object.freeze({ failures: 0, until: 0 })

export function recordPasswordFailure(gate: PasswordGate, now: number): PasswordGate {
  const failures = (gate.until && now >= gate.until ? 0 : gate.failures) + 1
  return { failures, until: failures >= 5 ? now + 60_000 : 0 }
}

export function passwordWaitSeconds(gate: PasswordGate, now: number): number {
  return Math.max(0, Math.ceil((gate.until - now) / 1000))
}
