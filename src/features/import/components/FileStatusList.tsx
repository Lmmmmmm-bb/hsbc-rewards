import type { ImportItem, PdfImportController } from '@/application/import/types'
import { useI18n } from '@/i18n/use-i18n'
import { FileStatusRow } from './FileStatusRow'

export function FileStatusList({
  items,
  controller,
  editable,
  focusItemId,
}: {
  items: readonly ImportItem[]
  controller: PdfImportController
  editable: boolean
  focusItemId?: string
}) {
  const { t } = useI18n()
  const host = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!focusItemId) return

    const item = [...(host.current?.querySelectorAll<HTMLElement>('[data-file-id]') ?? [])]
      .find((element) => element.dataset.fileId === focusItemId)
    const password = item?.querySelector<HTMLInputElement>('input[type="password"]:not(:disabled)')
    const target = password ?? item
    target?.focus()
  }, [focusItemId])

  return (
    <ul
      ref={host}
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

import { useEffect, useRef } from 'react'
