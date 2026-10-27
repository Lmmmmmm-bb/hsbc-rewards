import { useEffect, useEffectEvent, useRef, useState } from 'react'

/** Document-level file dragging also covers portals and the footer; ordinary text/link dragging is untouched. */
export function usePageFileDrop(onFiles: (files: readonly File[]) => void) {
  const [dragging, setDragging] = useState(false)
  const depth = useRef(0)
  const accept = useEffectEvent(onFiles)
  useEffect(() => {
    const files = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes('Files')
    const reset = () => {
      depth.current = 0
      setDragging(false)
    }
    const enter = (event: DragEvent) => {
      if (files(event)) {
        event.preventDefault()
        depth.current++
        setDragging(true)
      }
    }
    const over = (event: DragEvent) => {
      if (files(event)) {
        event.preventDefault()
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
        setDragging(true)
      }
    }
    const leave = (event: DragEvent) => {
      if (depth.current === 0 && !files(event)) return
      depth.current = Math.max(0, depth.current - 1)
      if (depth.current === 0) setDragging(false)
    }
    const drop = (event: DragEvent) => {
      if (!files(event)) return
      event.preventDefault()
      const selected = Array.from(event.dataTransfer?.files ?? [])
      reset()
      if (selected.length) accept(selected)
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') reset()
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragover', over)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    window.addEventListener('blur', reset)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragover', over)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
      window.removeEventListener('blur', reset)
      window.removeEventListener('keydown', key)
    }
  }, [])
  return dragging
}
