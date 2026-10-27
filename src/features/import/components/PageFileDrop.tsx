import type { ReactNode } from 'react'
import { RiFileUploadLine } from '@remixicon/react'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/i18n/use-i18n'
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
  return (
    <>
      {children}
      {dragging && (
        <div
          data-page-drop-overlay
          role="status"
          className="pointer-events-none fixed inset-0 z-100 grid place-items-center bg-background/90 p-5 backdrop-blur-xs"
        >
          <Card className="w-full max-w-lg border-2 border-dashed border-primary ring-0">
            <CardContent className="space-y-3 text-center">
              <RiFileUploadLine
                className="mx-auto size-12 text-primary"
                aria-hidden="true"
              />
              <p className="text-2xl font-semibold">
                {t(busy ? 'drop.busy' : 'drop.title')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(busy ? 'drop.busyHint' : 'drop.hint')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
