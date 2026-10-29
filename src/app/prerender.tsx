import { renderToString } from 'react-dom/server'
import { AppRoot } from './AppRoot'
import type { Locale } from '../i18n/locale'

// Build-time only: render the same empty session that the browser hydrates.
// React effects never run here, so no PDF, FX request or browser cache is opened.
export function renderPage(locale: Locale = 'zh-CN') {
  return renderToString(<AppRoot initialLocale={locale} />)
}
