import { useEffect, type ReactNode } from 'react'
import { useAnimate, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

/** Keep server HTML visible and animate committed results without remounting them. */
export function ResultReveal({
  children,
  trigger,
  delay = 0,
  className,
}: {
  children: ReactNode
  trigger: string | null
  delay?: number
  className?: string
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (trigger === null || reducedMotion !== false) return

    const animation = animate(
      scope.current,
      { opacity: [0, 1], y: [6, 0] },
      { duration: 0.24, delay, ease: [0.22, 1, 0.36, 1] },
    )

    return () => animation.stop()
  }, [animate, scope, reducedMotion, trigger, delay])

  return (
    <div
      ref={scope}
      className={cn('motion-reduce:transform-none! motion-reduce:opacity-100!', className)}
    >
      {children}
    </div>
  )
}
