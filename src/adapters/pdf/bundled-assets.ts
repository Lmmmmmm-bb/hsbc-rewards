const assetUrls = import.meta.glob<string>(
  [
    '/node_modules/pdfjs-dist/cmaps/*.bcmap',
    '/node_modules/pdfjs-dist/standard_fonts/*.{pfb,ttf}',
    '/node_modules/pdfjs-dist/wasm/*.{wasm,js}',
  ],
  { query: '?url', import: 'default', eager: true },
)

/** Only bundled allowlisted resources, never a URL or filename supplied by a PDF. */
export class BundledPdfAssets {
  async fetch({ kind, filename }: { kind: string; filename: string }): Promise<Uint8Array> {
    const directory = (
      { cMapUrl: 'cmaps', standardFontDataUrl: 'standard_fonts', wasmUrl: 'wasm' } as Record<
        string,
        string
      >
    )[kind]
    const url = directory && assetUrls[`/node_modules/pdfjs-dist/${directory}/${filename}`]
    if (!url) throw new Error('pdf-resource-unavailable')
    const response = await fetch(url, { credentials: 'omit' })
    if (!response.ok) throw new Error('pdf-resource-unavailable')
    return new Uint8Array(await response.arrayBuffer())
  }
}
