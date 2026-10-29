import type { ComponentProps } from 'react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

/** Three-column navigation for the rule dialog. */
export function DialogTabsList({
  className,
  ...props
}: ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      {...props}
      className={cn(
        'sticky top-0 z-10 grid w-full grid-cols-3 items-stretch group-data-horizontal/tabs:h-auto',
        className,
      )}
    />
  )
}

export function DialogTab({
  className,
  ...props
}: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      {...props}
      className={cn('h-auto min-w-0 py-1 whitespace-normal', className)}
    />
  )
}
