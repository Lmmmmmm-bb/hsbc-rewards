import { PDFWorker, getDocument, PasswordResponses, Util } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { groupTextRows } from '@/domain/parsing/text-layout'
import type { TextSpan } from '@/domain/parsing/text-layout'
import { PdfReadError } from '@/ports/pdf'
import type { LocalPdfDocument, PdfReader, PdfReadOptions, PdfTextPage } from '@/ports/pdf'
import { BundledPdfAssets } from './bundled-assets'

async function read(bytes: ArrayBuffer, options: PdfReadOptions): Promise<LocalPdfDocument> {
  if (options.signal.aborted) throw new PdfReadError('aborted')
  // An explicit port guarantees real worker parsing instead of PDF.js's main-thread fallback.
  let port: Worker
  try {
    port = new Worker(workerUrl, { type: 'module' })
  } catch {
    throw new PdfReadError('engine-unavailable')
  }
  const worker = PDFWorker.create({ port, verbosity: 0 })
  const task = getDocument({
    worker,
    data: new Uint8Array(bytes),
    verbosity: 0,
    stopAtErrors: true,
    useWorkerFetch: false,
    BinaryDataFactory: BundledPdfAssets,
    // All support data comes from BundledPdfAssets in this application's build.
    cMapUrl: 'bundled:/',
    standardFontDataUrl: 'bundled:/',
    wasmUrl: 'bundled:/',
    enableXfa: false,
  })
  let candidate = options.password
  let disposed = false
  const dispose = async () => {
    if (disposed) return
    disposed = true
    candidate = undefined
    task.onPassword = () => {}
    try {
      await task.destroy()
    } finally {
      worker.destroy()
      port.terminate()
    }
  }
  let rejectInterruption: (reason: PdfReadError) => void = () => {}
  const interruption = new Promise<never>((_, reject) => {
    rejectInterruption = reject
  })
  const onWorkerError = () => rejectInterruption(new PdfReadError('engine-unavailable'))
  port.addEventListener('error', onWorkerError)
  const onAbort = () => {
    rejectInterruption(new PdfReadError('aborted'))
    void dispose().catch(() => {})
  }
  options.signal.addEventListener('abort', onAbort, { once: true })
  task.onPassword = (updatePassword: (password: string) => void, reason: number) => {
    if (reason === PasswordResponses.NEED_PASSWORD && candidate !== undefined) {
      const submitted = candidate
      candidate = undefined
      updatePassword(submitted)
    } else {
      rejectInterruption(
        new PdfReadError(
          reason === PasswordResponses.INCORRECT_PASSWORD
            ? 'password-incorrect'
            : 'password-required',
        ),
      )
    }
  }
  try {
    const document = await Promise.race([task.promise, interruption])
    candidate = undefined
    task.onPassword = () => {}
    if (document.numPages > options.maxPages) throw new PdfReadError('too-many-pages')
    const pages: PdfTextPage[] = []
    options.onProgress(0, document.numPages)
    for (let index = 1; index <= document.numPages; index++) {
      if (options.signal.aborted) throw new PdfReadError('aborted')
      const page = await document.getPage(index)
      const viewport = page.getViewport({ scale: 1 })
      const content = await page.getTextContent()
      const spans: TextSpan[] = []
      for (const item of content.items) {
        if (!('str' in item) || !item.str.trim()) continue
        const transform = Util.transform(viewport.transform, item.transform)
        const height = Math.hypot(transform[2], transform[3])
        spans.push({
          text: item.str,
          bounds: {
            x: transform[4],
            y: transform[5] - height,
            width: item.width,
            height,
          },
        })
      }
      pages.push({
        page: index,
        width: viewport.width,
        height: viewport.height,
        rows: groupTextRows(spans),
      })
      page.cleanup()
      options.onProgress(index, document.numPages)
    }
    if (!pages.some((page) => page.rows.length)) throw new PdfReadError('no-text')
    return { pages, dispose }
  } catch (error) {
    await dispose().catch(() => {})
    if (options.signal.aborted) throw new PdfReadError('aborted')
    if (error instanceof PdfReadError) throw error
    throw new PdfReadError(
      error instanceof Error && error.name === 'InvalidPDFException'
        ? 'invalid-pdf'
        : 'read-failed',
    )
  } finally {
    candidate = undefined
    options.signal.removeEventListener('abort', onAbort)
    port.removeEventListener('error', onWorkerError)
  }
}

export const pdfjsReader: PdfReader = { read }
