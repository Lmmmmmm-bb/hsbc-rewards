import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { I18nProvider } from '@/i18n/I18nProvider'
import { PreferencesContext } from './preferences-context'
import type { Density, Theme } from './preferences-context'

export function AppProviders({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [density, setDensity] = useState<Density>('standard')
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () =>
      document.documentElement.classList.toggle(
        'dark',
        theme === 'dark' || (theme === 'system' && media.matches),
      )
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => {
    document.documentElement.dataset.density = density
  }, [density])
  return (
    <I18nProvider>
      <PreferencesContext.Provider value={{ theme, setTheme, density, setDensity }}>
        {children}
      </PreferencesContext.Provider>
    </I18nProvider>
  )
}
