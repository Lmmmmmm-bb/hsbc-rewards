import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { AppRoot } from './app/AppRoot'

const root = document.getElementById('root')!
if (root.hasChildNodes()) hydrateRoot(root, <AppRoot />)
else createRoot(root).render(<AppRoot />)
