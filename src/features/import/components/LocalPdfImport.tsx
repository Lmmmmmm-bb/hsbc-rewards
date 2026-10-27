import { useRef, useState } from 'react'
import { RiFileUploadLine, RiInformationLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePdfImport } from '@/store/use-pdf-import'
import { useI18n } from '@/i18n/use-i18n'
import { ImportBatch } from './ImportBatch'
import { ErrorNotice } from '@/components/workspace/ErrorNotice'

export function LocalPdfImport({ beforeRead }: { beforeRead: () => void }) {
  const { t } = useI18n()
  const input = useRef<HTMLInputElement>(null)
  const { batch, controller } = usePdfImport()
  const [dragging, setDragging] = useState(false)
  const start = (files: FileList | null) => {
    if (files?.length && !batch.active) {
      beforeRead()
      controller.start(Array.from(files))
    }
  }
  return (
    <div className="space-y-6">
      <Card
        data-import-drop
        className={dragging ? 'border-primary' : undefined}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          start(event.dataTransfer.files)
        }}
      >
        <CardContent>
          <Empty className="px-0 py-5">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RiFileUploadLine aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t('import.dropTitle')}</EmptyTitle>
              <EmptyDescription>{t('pdf.dropBody')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Input
                ref={input}
                className="hidden"
                type="file"
                multiple
                accept="application/pdf,.pdf"
                aria-label={t('pdf.choose')}
                onChange={(event) => {
                  start(event.target.files)
                  event.target.value = ''
                }}
              />
              <Button
                size="lg"
                onClick={() => input.current?.click()}
                disabled={batch.active}
              >
                <RiFileUploadLine aria-hidden="true" />
                {t('pdf.choose')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t('import.limit')}
              </p>
            </EmptyContent>
          </Empty>
          <Alert>
            <RiInformationLine aria-hidden="true" />
            <AlertDescription>{t('pdf.stageHint')}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      {batch.rejected && (
        <ErrorNotice>{t(`pdf.error.${batch.rejected}`)}</ErrorNotice>
      )}
      <ImportBatch batch={batch} controller={controller} />
    </div>
  )
}
