import type { ReactNode } from 'react'
import { RiErrorWarningLine } from '@remixicon/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

/** Keep warning headings readable against the preset's light cards. */
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
    <Alert role={role} className="gap-y-1 p-3">
      <RiErrorWarningLine aria-hidden="true" />
      {title && <AlertTitle className="text-primary">{title}</AlertTitle>}
      {children && (
        <AlertDescription className="flex flex-col items-start gap-2 [&_p:not(:last-child)]:mb-0">
          {children}
        </AlertDescription>
      )}
    </Alert>
  )
}
