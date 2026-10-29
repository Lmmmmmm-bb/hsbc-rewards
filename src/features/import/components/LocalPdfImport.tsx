import { RiFileUploadLine } from '@remixicon/react'
import { usePdfImport } from '@/store/use-pdf-import'
import { useI18n } from '@/i18n/use-i18n'
import { ErrorNotice } from '@/components/workspace/ErrorNotice'
import { ImportBatch } from './ImportBatch'
import { PdfFilePicker } from './PdfFilePicker'

export function LocalPdfImport({
  onFiles,
  onStatus,
  compact = false,
}: {
  onFiles: (files: readonly File[]) => void
  compact?: boolean
  onStatus: () => void
}) {
  const { batch } = usePdfImport()
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
        <PdfFilePicker
          label={t('pdf.choose')}
          onFiles={onFiles}
          disabled={batch.active}
          pageTrigger
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t(compact ? 'import.additionalHint' : 'import.anywhere')}
      </p>
      <p className="text-xs text-muted-foreground">{t('import.limit')}</p>
      {batch.rejected && (
        <ErrorNotice>{t(`pdf.error.${batch.rejected}`)}</ErrorNotice>
      )}
      <ImportBatch batch={batch} onStatus={onStatus} />
    </div>
  )
}
