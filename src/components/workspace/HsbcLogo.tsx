import hsbcLogo from '@/assets/hsbc/hongkong-hsbc-logo-en.svg'
import { cn } from '@/lib/utils'

/** Original SVG from HSBC Hong Kong, bundled locally without an external image request. */
export function HsbcLogo({ className }: { className?: string }) {
  return (
    <img
      src={hsbcLogo}
      alt="HSBC"
      width={177}
      height={38}
      className={cn('h-auto w-28 shrink-0', className)}
    />
  )
}
