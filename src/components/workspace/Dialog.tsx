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
import { ScrollArea } from '@/components/ui/scroll-area'
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
  size = 'content',
  scrollBody = true,
}: {
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  className?: string
  description?: string
  returnFocus?: () => HTMLElement | null
  size?: 'content' | 'confirmation'
  scrollBody?: boolean
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
        data-dialog-size={size}
        className={cn(
          'flex max-h-[90svh] flex-col overflow-hidden sm:max-w-xl',
          size === 'confirmation'
            ? ''
            : 'h-[min(42rem,90svh)] min-h-[min(24rem,90svh)]',
          className,
        )}
      >
        <DialogHeader className="shrink-0 pr-8">
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
        {scrollBody ? (
          <ScrollArea
            className="min-h-0 flex-1"
            viewportProps={{
              role: 'region',
              'aria-label': title,
              tabIndex: 0,
              className: 'overscroll-y-contain',
            }}
          >
            <div className="space-y-4 pr-3 text-sm leading-relaxed">
              {children}
            </div>
          </ScrollArea>
        ) : (
          <div
            data-dialog-body
            tabIndex={-1}
            className="flex min-h-0 flex-1 flex-col outline-none"
          >
            {children}
          </div>
        )}
        {footer && <DialogFooter className="shrink-0">{footer}</DialogFooter>}
      </DialogContent>
    </ShadcnDialog>
  )
}
