import { messagesFor } from '../i18n/messages.ts'
import { DEFAULT_LOCALE } from '../i18n/locale.ts'
import type { Locale } from '../i18n/locale.ts'

export const SITE_URL = 'https://rewards.lmmmmmm.dev/'
const imageFile = 'social-card.png'
export const SOCIAL_IMAGE = {
  fileName: imageFile,
  url: new URL(imageFile, SITE_URL).href,
  width: 1200,
  height: 630,
  type: 'image/png',
} as const

export function pageMetadata(locale: Locale = DEFAULT_LOCALE) {
  const messages = messagesFor(locale)
  return {
    locale,
    siteName: messages['app.brand'],
    title: messages['seo.title'],
    description: messages['seo.description'],
    imageAlt: messages['seo.imageAlt'],
    socialLocale: locale.replace('-', '_'),
  }
}
