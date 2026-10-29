import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'

export function DetailPagination({
  current,
  pages,
  onPage,
}: {
  current: number
  pages: number
  onPage: (page: number) => void
}) {
  const { t, number } = useI18n()
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={current === 0}
        onClick={() => onPage(current - 1)}
      >
        {t('details.previous')}
      </Button>
      <span className="text-xs tabular-nums">
        {number(current + 1, 0)} / {number(pages, 0)}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={current + 1 >= pages}
        onClick={() => onPage(current + 1)}
      >
        {t('details.next')}
      </Button>
    </div>
  )
}
