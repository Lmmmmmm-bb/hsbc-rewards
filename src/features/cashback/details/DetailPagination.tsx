import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'
import { useLayoutEffect, useRef } from 'react'

export function DetailPagination({
  current,
  pages,
  onPage,
}: {
  current: number
  pages: number
  onPage: (page: number) => void
}) {
  const { t } = useI18n()
  const pageLabel = useRef<HTMLSpanElement>(null)
  const focusPageLabel = useRef(false)
  useLayoutEffect(() => {
    if (!focusPageLabel.current) return
    focusPageLabel.current = false
    pageLabel.current?.focus({ preventScroll: true })
  }, [current])
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={current === 0}
        onClick={() => {
          focusPageLabel.current = current === 1
          onPage(current - 1)
        }}
      >
        {t('details.previous')}
      </Button>
      <span
        ref={pageLabel}
        tabIndex={-1}
        className="text-xs tabular-nums outline-none"
      >
        {t('details.pageNumber', { page: current + 1, pages })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={current + 1 >= pages}
        onClick={() => {
          focusPageLabel.current = current + 2 === pages
          onPage(current + 1)
        }}
      >
        {t('details.next')}
      </Button>
    </div>
  )
}
