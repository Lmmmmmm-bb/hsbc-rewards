import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import { getDocument, Util } from 'pdfjs-dist/legacy/build/pdf.mjs'

// Local, opt-in acceptance runner. It never writes PDFs, extracted text, names, accounts or amounts.
const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('Usage: node scripts/verify-pulse-samples.mjs <local.pdf> ...')
  process.exit(1)
}

const root = fileURLToPath(new URL('../', import.meta.url))
const server = await createServer({
  root,
  configFile: resolve(root, 'vite.config.ts'),
  logLevel: 'silent',
  server: { middlewareMode: true, watch: null },
  appType: 'custom',
})
try {
  const { groupTextRows } = await server.ssrLoadModule(
    '/src/domain/parsing/text-layout.ts',
  )
  const { parsePulseStatement } = await server.ssrLoadModule(
    '/src/domain/parsing/pulse/parse.ts',
  )
  const { reconcileStatement } = await server.ssrLoadModule(
    '/src/domain/reconciliation/reconcile.ts',
  )
  for (const [index, path] of files.entries()) {
    const bytes = await readFile(path)
    const hash = createHash('sha256').update(bytes).digest('hex')
    const task = getDocument({
      data: new Uint8Array(bytes),
      verbosity: 0,
      stopAtErrors: true,
      cMapUrl: resolve(root, 'node_modules/pdfjs-dist/cmaps') + '/',
      standardFontDataUrl:
        resolve(root, 'node_modules/pdfjs-dist/standard_fonts') + '/',
    })
    try {
      const pdf = await task.promise
      const pages = []
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1 })
        const content = await page.getTextContent()
        const spans = content.items
          .filter((item) => 'str' in item && item.str.trim())
          .map((item) => {
            const transform = Util.transform(viewport.transform, item.transform)
            const height = Math.hypot(transform[2], transform[3])

            return {
              text: item.str,
              bounds: {
                x: transform[4],
                y: transform[5] - height,
                width: item.width,
                height,
              },
            }
          })
        pages.push({
          page: pageNumber,
          width: viewport.width,
          height: viewport.height,
          rows: groupTextRows(spans),
        })
        page.cleanup()
      }

      const dataset = parsePulseStatement(
        pages,
        {
          id: `sample-${index + 1}`,
          fileHash: hash,
          fileName: `sample-${index + 1}.pdf`,
          size: bytes.length,
        },
        (kind, number) =>
          createHash('sha256').update(`${kind}:${number}`).digest('hex'),
      )
      const reports = reconcileStatement(
        dataset.statements[0],
        dataset.transactions,
      )
      const printedRows = pages
        .flatMap((page) => page.rows)
        .filter((row) =>
          /^\d{1,2}\s*[A-Z]{3}\s+\d{1,2}\s*[A-Z]{3}\s+/.test(row.text),
        ).length
      const rowCountMatches = printedRows === dataset.transactions.length
      const kinds = Object.fromEntries(
        [
          'purchase',
          'repayment',
          'refund',
          'fee',
          'cash-advance',
          'credit',
        ].map((kind) => [
          kind,
          dataset.transactions.filter((row) => row.classification.kind === kind)
            .length,
        ]),
      )
      const sourceLocationsValid = dataset.transactions.every(
        (row) =>
          row.sources.length > 0 &&
          row.sources.every((source) => {
            const page = pages.find((page) => page.page === source.page)
            const bounds = source.bounds

            return (
              page &&
              bounds &&
              bounds.x >= 0 &&
              bounds.y >= 0 &&
              bounds.x + bounds.width <= page.width + 0.1 &&
              bounds.y + bounds.height <= page.height + 0.1 &&
              page.rows.some(
                (row) => row.row === source.row && row.text === source.text,
              )
            )
          }),
      )
      console.log(
        JSON.stringify({
          sample: index + 1,
          pages: pages.length,
          cards: dataset.cards.length,
          transactions: dataset.transactions.length,
          printedRows,
          rowCountMatches,
          kinds,
          accounts: reports.map((account) => ({
            currency: account.currency,
            status: account.status,
          })),
          originalCurrencyUnknown: dataset.transactions.filter(
            (row) => row.original.currency === 'XXX',
          ).length,
          sourceLocationsValid,
        }),
      )

      if (
        !rowCountMatches ||
        !sourceLocationsValid ||
        reports.some((account) => account.status !== 'matched')
      )
        process.exitCode = 1
    } finally {
      await task.destroy()
    }
  }
} catch (error) {
  console.error(
    JSON.stringify({
      error: error.code ?? error.name ?? 'verification-failed',
    }),
  )
  process.exitCode = 1
} finally {
  await server.close()
}
