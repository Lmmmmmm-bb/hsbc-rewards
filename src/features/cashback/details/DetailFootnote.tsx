import type { DetailTab } from '@/application/results/details'
import { useI18n } from '@/i18n/use-i18n'

/** Contextual reading notes stay outside the scroll viewport and use one text scale. */
export function DetailFootnote({ tab }: { tab: DetailTab }) {
  const { t } = useI18n()
  return (
    <aside
      data-detail-footnote
      className="shrink-0 border-t pt-3 text-xs leading-relaxed text-muted-foreground"
    >
      <p>{t(`details.note.${tab}`)}</p>
    </aside>
  )
}
