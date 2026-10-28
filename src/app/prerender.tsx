import { renderToString } from 'react-dom/server'
import { AppRoot } from './AppRoot'

// Build-time only: render the same empty session that the browser hydrates.
// React effects never run here, so no PDF, FX request or browser cache is opened.
export function renderPage() {
  return renderToString(<AppRoot />)
}
