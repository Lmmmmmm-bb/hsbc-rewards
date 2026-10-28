import openGraph from 'vite-plugin-open-graph'
import type { HtmlTagDescriptor, PluginOption } from 'vite'
import { pageMetadata, SITE_URL, SOCIAL_IMAGE } from '../../src/app/seo.ts'
import { messagesFor } from '../../src/i18n/messages.ts'
import { DEFAULT_LOCALE } from '../../src/i18n/locale.ts'

function structuredData(metadata: ReturnType<typeof pageMetadata>) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: metadata.siteName,
        inLanguage: metadata.locale,
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}#application`,
        url: SITE_URL,
        name: metadata.siteName,
        description: metadata.description,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        inLanguage: metadata.locale,
        isAccessibleForFree: true,
        isPartOf: { '@id': `${SITE_URL}#website` },
      },
    ],
  }
}

/** Build adapters for document metadata, social tags and crawler discovery. */
export function seo({ indexable }: { indexable: boolean }): PluginOption[] {
  const metadata = pageMetadata()
  const meta = (name: string, content: string): HtmlTagDescriptor => ({
    tag: 'meta', attrs: { name, content }, injectTo: 'head',
  })
  return [
    {
      name: 'reward-seo',
      transformIndexHtml: {
        order: 'pre',
        handler(): HtmlTagDescriptor[] {
          return [
            { tag: 'title', children: metadata.title, injectTo: 'head' },
            meta('description', metadata.description),
            meta('robots', indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow'),
            { tag: 'link', attrs: { rel: 'canonical', href: SITE_URL }, injectTo: 'head' },
            {
              tag: 'script',
              injectTo: 'head',
              attrs: { type: 'application/ld+json' },
              children: JSON.stringify(structuredData(metadata)).replace(/</g, '\\u003c'),
            },
            {
              tag: 'noscript',
              injectTo: 'body-prepend',
              children: messagesFor(DEFAULT_LOCALE)['seo.noScript'],
            },
          ]
        },
      },
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`,
        })
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}</loc></url>\n</urlset>\n`,
        })
      },
    },
    openGraph({
      basic: {
        type: 'website',
        siteName: metadata.siteName,
        locale: metadata.socialLocale,
        url: SITE_URL,
        title: metadata.title,
        description: metadata.description,
        image: {
          url: SOCIAL_IMAGE.url,
          type: SOCIAL_IMAGE.type,
          width: SOCIAL_IMAGE.width,
          height: SOCIAL_IMAGE.height,
          alt: metadata.imageAlt,
        },
      },
      twitter: {
        card: 'summary_large_image',
        title: metadata.title,
        description: metadata.description,
        image: SOCIAL_IMAGE.url,
        imageAlt: metadata.imageAlt,
      },
    }),
  ]
}
