import type { ReactNode } from 'react'
import { RiErrorWarningLine } from '@remixicon/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

/** Use the preset's high-contrast primary title and default description instead of its pale destructive variant. */
export function ErrorNotice({
  title,
  children,
  role = 'alert',
}: {
  title?: string
  children?: ReactNode
  role?: 'alert' | 'status'
}) {
  return (
    <Alert role={role}>
      <RiErrorWarningLine aria-hidden="true" />
      {title && <AlertTitle className="text-primary">{title}</AlertTitle>}
      {children && <AlertDescription>{children}</AlertDescription>}
    </Alert>
  )
}
