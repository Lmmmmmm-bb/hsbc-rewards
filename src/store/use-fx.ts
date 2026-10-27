import { useEffect, useSyncExternalStore } from 'react'
import { fxController } from '@/application/fx/runtime'

export function useFx() {
  useEffect(() => fxController.connect(), [])
  const request = useSyncExternalStore(
    fxController.subscribe,
    fxController.getSnapshot,
    fxController.getSnapshot,
  )
  return { request, refresh: fxController.refresh }
}
