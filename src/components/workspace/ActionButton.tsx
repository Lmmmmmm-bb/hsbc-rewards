import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'

export function ActionButton({ className = '', ...props }: ComponentProps<typeof Button>) {
  return <Button className={`app-action ${className}`} {...props} />
}
