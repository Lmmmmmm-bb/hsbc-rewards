import type { ReactNode } from 'react'
import { RiFileUploadLine, RiTimeLine } from '@remixicon/react'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { usePageFileDrop } from '../use-page-file-drop'

export function PageFileDrop({
  children,
  onFiles,
  busy,
}: {
  children: ReactNode
  onFiles: (files: readonly File[]) => void
  busy: boolean
}) {
  const dragging = usePageFileDrop(onFiles)
  const { t } = useI18n()
  const Icon = busy ? RiTimeLine : RiFileUploadLine
  return (
    <>
      {children}
      <div
        data-page-drop-overlay={dragging ? '' : undefined}
        data-drop-surface
        data-active={dragging}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-hidden={!dragging}
        className={cn(
          'pointer-events-none fixed inset-0 z-100 grid place-items-center bg-background/95 p-6 backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:transition-none',
          dragging ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div
          aria-hidden="true"
          className="absolute inset-3 border border-dashed border-primary/40 sm:inset-6"
        />
        <Card
          className={cn(
            'w-full max-w-lg ring-primary/20 transition-transform duration-250 ease-out motion-reduce:transform-none motion-reduce:transition-none',
            dragging ? 'translate-y-0 scale-100' : 'translate-y-3 scale-95',
          )}
        >
          <CardContent className="space-y-4 py-4 text-center">
            <div className="mx-auto grid size-16 place-items-center bg-primary/10">
              <Icon className="size-9 text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-semibold tracking-tight">
                {t(busy ? 'drop.busy' : 'drop.title')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(busy ? 'drop.busyHint' : 'drop.hint')}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{t('import.limit')}</p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
