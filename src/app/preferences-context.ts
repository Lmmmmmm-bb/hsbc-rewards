import { createContext, useContext } from 'react'

export type Theme = 'system' | 'light' | 'dark'
export type Density = 'standard' | 'compact'
export const PreferencesContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
  density: Density
  setDensity: (density: Density) => void
} | null>(null)

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('preferences.provider-missing')
  return context
}
