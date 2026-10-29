import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { AppRoot } from './app/AppRoot'
import { claimInitialLocale } from './app/locale-startup/claim'

const root = document.getElementById('root')!
const initialLocale = claimInitialLocale(root)
if (root.hasChildNodes()) hydrateRoot(root, <AppRoot initialLocale={initialLocale} />)
else createRoot(root).render(<AppRoot initialLocale={initialLocale} />)
