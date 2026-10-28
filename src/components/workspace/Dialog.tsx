import { useId, type ReactNode } from 'react'
import { RiCloseLine } from '@remixicon/react'
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'

export function Dialog({
  title,
  children,
  footer,
  onClose,
  className,
  description,
  returnFocus,
}: {
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  className?: string
  description?: string
  returnFocus?: () => HTMLElement | null
}) {
  const { t } = useI18n()
  const descriptionId = useId()

  return (
    <ShadcnDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        finalFocus={returnFocus}
        showCloseButton={false}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'flex max-h-[90svh] flex-col overflow-hidden sm:max-w-xl',
          className,
        )}
      >
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription id={descriptionId} className="text-sm">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3"
              aria-label={t('action.close')}
            />
          }
        >
          <RiCloseLine aria-hidden="true" />
        </DialogClose>
        <div
          role="region"
          aria-label={title}
          tabIndex={0}
          className="min-h-0 space-y-4 overflow-y-auto text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {children}
        </div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </ShadcnDialog>
  )
}
