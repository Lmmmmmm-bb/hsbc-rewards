import hsbcLogo from '@/assets/hsbc/hsbc-hexagon.svg'
import { cn } from '@/lib/utils'

/** User-selected hexagon, bundled locally with its original geometry and colours. */
export function HsbcLogo({ className }: { className?: string }) {
  return (
    <img
      src={hsbcLogo}
      alt="HSBC"
      width={1701}
      height={851}
      className={cn('h-auto w-12 shrink-0', className)}
    />
  )
}
