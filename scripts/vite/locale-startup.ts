import { build } from 'vite'
import type { Plugin, ResolvedConfig } from 'vite'
import { pageMetadata } from '../../src/app/seo.ts'

const activationOutlet = '<!--locale-activate-->'

/** Compile a dependency-free classic script; never ship build tools or dictionaries. */
async function bootstrapScript(config: ResolvedConfig) {
  // Library entry resolution is path-based; this virtual absolute path has no file.
  const entry = config.root + '/.reward-locale-bootstrap.js'
  const snapshots = Object.fromEntries((['zh-CN', 'en-US'] as const).map(locale => {
    const { title, description, imageAlt, socialLocale } = pageMetadata(locale)
    return [locale, { locale, title, description, imageAlt, socialLocale }]
  }))
  const result = await build({
    configFile: false,
    root: config.root,
    logLevel: 'silent',
    plugins: [{
      name: 'reward-locale-bootstrap-entry',
      resolveId(id) { if (id === entry) return '\0' + entry },
      load(id) {
        if (id === '\0' + entry) return `import { startLocaleBootstrap } from ${JSON.stringify(config.root + '/src/app/locale-startup/bootstrap.ts')}; startLocaleBootstrap(${JSON.stringify(snapshots)});`
      },
    }],
    build: {
      write: false,
      minify: true,
      lib: { entry, formats: ['iife'], name: 'RewardLocaleBootstrap' },
    },
  })
  const output = Array.isArray(result) ? result[0] : result
  if (!output || !('output' in output)) throw new Error('Missing locale bootstrap output.')
  const chunks = output.output.filter(item => item.type === 'chunk')
  if (chunks.length !== 1 || chunks[0].imports.length || chunks[0].dynamicImports.length)
    throw new Error('Locale bootstrap must be self-contained.')
  for (const id of Object.keys(chunks[0].modules)) {
    if (id.includes('node_modules') || /[\\/](?:messages|zh|en|seo)\.ts$/.test(id))
      throw new Error('Locale bootstrap must not include dependencies or message dictionaries.')
  }
  return chunks[0].code.replace(/<\/script/gi, '<\\/script')
}

export function localeStartup(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'reward-locale-startup',
    configResolved(resolved) { config = resolved },
    transformIndexHtml: {
      order: 'post',
      async handler(html) {
        if (!html.includes(activationOutlet)) throw new Error('Missing locale activation outlet.')
        if (config.command !== 'build') return html.replace(activationOutlet, '')
        const script = await bootstrapScript(config)
        return html.replace('</head>', `<script data-locale-prepare>${script}</script>\n</head>`)
          .replace(activationOutlet, '<script data-locale-activate>window.__rewardLocaleStartup?.activate()</script>')
      },
    },
  }
}
