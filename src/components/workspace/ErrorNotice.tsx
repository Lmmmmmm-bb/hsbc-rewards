import type { ReactNode } from 'react'
import { RiErrorWarningLine } from '@remixicon/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

/** Keep warning headings readable against the preset's light and dark cards. */
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
      {title && <AlertTitle className="text-primary dark:text-destructive">{title}</AlertTitle>}
      {children && <AlertDescription>{children}</AlertDescription>}
    </Alert>
  )
}
