import { RiFileList3Line } from '@remixicon/react'
import type { ImportSnapshot } from '@/application/import/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorNotice } from '@/components/workspace/ErrorNotice'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/i18n/use-i18n'

export function ImportBatch({
  batch,
  onStatus,
}: {
  batch: ImportSnapshot
  onStatus: () => void
}) {
  const { t } = useI18n()
  if (!batch.items.length) return null

  const items = batch.items.filter((item) => item.status !== 'removed')
  const finished = items.filter((item) =>
    ['extracted', 'parsed', 'imported', 'error', 'duplicate'].includes(
      item.status,
    ),
  ).length
  const problems = items.filter((item) =>
    ['locked', 'error'].includes(item.status),
  ).length

  return (
    <section data-batch aria-label={t('pdf.batchTitle')} className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium">
          {t('pdf.batchCount', { count: items.length })}
        </p>
        {problems > 0 && (
          <Badge variant="secondary">
            {t('pdf.needsAttention', { count: problems })}
          </Badge>
        )}
      </div>
      {batch.active && (
        <Progress
          value={items.length ? (finished / items.length) * 100 : 0}
          aria-label={t('pdf.batchProgress', {
            completed: finished,
            total: items.length,
          })}
        />
      )}
      {batch.outcome.status === 'committed' && (
        <p role="status" className="text-xs font-medium">
          {t('pdf.committed', batch.outcome)}
        </p>
      )}
      {batch.outcome.status === 'empty' && (
        <p role="status" className="text-xs text-muted-foreground">
          {t('pdf.emptyBatch')}
        </p>
      )}
      {batch.outcome.status === 'failed' && (
        <ErrorNotice>
          {t(`pdf.failed.${batch.outcome.problem ?? 'commit-failed'}`)}
        </ErrorNotice>
      )}
      <Button
        data-file-status-trigger
        variant="outline"
        size="sm"
        className="w-full justify-between"
        onClick={onStatus}
        aria-haspopup="dialog"
      >
        {t('pdf.showFiles')}
        <RiFileList3Line aria-hidden="true" />
      </Button>
    </section>
  )
}
