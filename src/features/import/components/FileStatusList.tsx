import type { ImportItem, PdfImportController } from '@/application/import/types'
import { useI18n } from '@/i18n/use-i18n'
import { FileStatusRow } from './FileStatusRow'

export function FileStatusList({
  items,
  controller,
  editable,
}: {
  items: readonly ImportItem[]
  controller: PdfImportController
  editable: boolean
}) {
  const { t } = useI18n()
  return (
    <ul
      data-file-list
      className="space-y-3"
      aria-label={t('pdf.batchTitle')}
    >
      {items.map((item) => (
        <FileStatusRow
          key={item.id}
          item={item}
          controller={controller}
          editable={editable}
        />
      ))}
    </ul>
  )
}
