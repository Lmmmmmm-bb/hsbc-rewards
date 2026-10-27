import { useRef } from 'react'
import { RiFileUploadLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePdfImport } from '@/store/use-pdf-import'
import { useI18n } from '@/i18n/use-i18n'
import { ErrorNotice } from '@/components/workspace/ErrorNotice'
import { ImportBatch } from './ImportBatch'

export function LocalPdfImport({
  onFiles,
}: {
  onFiles: (files: readonly File[]) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const { batch, controller } = usePdfImport()
  const { t } = useI18n()
  return (
    <div data-import-drop className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <RiFileUploadLine
            className="size-5 text-primary"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold">{t('import.dropTitle')}</h2>
        </div>
        <Input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          aria-label={t('pdf.choose')}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            event.target.value = ''
            onFiles(files)
          }}
        />
        <Button onClick={() => input.current?.click()} disabled={batch.active}>
          <RiFileUploadLine aria-hidden="true" />
          {t('pdf.choose')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t('import.anywhere')}</p>
      <p className="text-xs text-muted-foreground">{t('import.limit')}</p>
      {batch.rejected && (
        <ErrorNotice>{t(`pdf.error.${batch.rejected}`)}</ErrorNotice>
      )}
      <ImportBatch key={batch.batch} batch={batch} controller={controller} />
    </div>
  )
}
