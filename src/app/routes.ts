import { useSyncExternalStore } from 'react'

export type PageId = 'import' | 'ledger' | 'rewards' | 'settings'
export const pageIds: readonly PageId[] = ['import', 'ledger', 'rewards', 'settings']

const subscribe = (listener: () => void) => {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}
const snapshot = () => {
  const value = window.location.hash.replace(/^#\/?/, '')
  return pageIds.includes(value as PageId) ? (value as PageId) : 'import'
}

export function useRoute(): PageId {
  return useSyncExternalStore(subscribe, snapshot, () => 'import')
}

export function navigate(page: PageId): void {
  window.location.hash = `/${page}`
}
