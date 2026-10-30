import { useEffect, useSyncExternalStore } from 'react'
import { workspace } from '@/app/runtime/workspace'

const { fx: fxController } = workspace

export function useFx() {
  useEffect(() => {
    const disconnect = fxController.connect()

    const check = () => {
      if (document.visibilityState === 'visible') void fxController.ensure()
    }

    window.addEventListener('online', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      disconnect()
      window.removeEventListener('online', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  const request = useSyncExternalStore(
    fxController.subscribe,
    fxController.getSnapshot,
    fxController.getSnapshot,
  )

  return { request }
}
