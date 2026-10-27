import { usePdfImport } from '@/store/use-pdf-import'
import { Dialog } from '@/components/workspace/Dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ErrorNotice } from '@/components/workspace/ErrorNotice'
import { useI18n } from '@/i18n/use-i18n'
import { FileStatusRow } from './FileStatusRow'

export function FileStatusDialog({
  onClose,
  onCancel,
}: {
  onClose: () => void
  onCancel: () => void
}) {
  const { batch, controller } = usePdfImport()
  const { t, number } = useI18n()
  const items = batch.items.filter((item) => item.status !== 'removed')
  const committed = batch.outcome.status === 'committed'
  const editable = !committed && batch.outcome.status !== 'failed'
  const finished = items.filter((item) =>
    ['extracted', 'parsed', 'imported', 'error', 'duplicate'].includes(
      item.status,
    ),
  ).length
  return (
    <Dialog
      title={t('pdf.dialogTitle')}
      description={t('pdf.dialogHint')}
      onClose={onClose}
      className="sm:max-w-3xl"
      footer={
        <>
          {batch.active && (
            <Button variant="outline" onClick={onCancel}>
              {t('pdf.cancelBatch')}
            </Button>
          )}
          <Button onClick={onClose}>
            {t(committed ? 'pdf.viewRewards' : 'pdf.backToRewards')}
          </Button>
        </>
      }
    >
      <div data-file-status-dialog className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 bg-muted p-3 sm:grid-cols-4">
          {(['imported', 'locked', 'error', 'duplicate'] as const).map(
            (status) => (
              <div key={status} className="space-y-1">
                <dt className="text-xs text-muted-foreground">
                  {t(`pdf.summary.${status}`)}
                </dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {number(
                    items.filter((item) => item.status === status).length,
                    0,
                  )}
                </dd>
              </div>
            ),
          )}
        </dl>
        {batch.active && (
          <div role="status" className="space-y-2">
            <p className="text-sm">
              {t('pdf.batchProgress', {
                completed: finished,
                total: items.length,
              })}
            </p>
            <Progress
              value={items.length ? (finished / items.length) * 100 : 0}
              aria-label={t('pdf.batchTitle')}
            />
            <p className="text-xs text-muted-foreground">
              {t('pdf.inProgressHint')}
            </p>
          </div>
        )}
        {committed && (
          <p role="status" className="text-sm font-medium">
            {t('pdf.committed', batch.outcome)}
          </p>
        )}
        {batch.outcome.status === 'empty' && (
          <p role="status" className="text-muted-foreground">
            {t('pdf.emptyBatch')}
          </p>
        )}
        {batch.outcome.status === 'failed' && (
          <ErrorNotice>
            {t(`pdf.failed.${batch.outcome.problem ?? 'commit-failed'}`)}
          </ErrorNotice>
        )}
        {batch.rejected && (
          <ErrorNotice>{t(`pdf.error.${batch.rejected}`)}</ErrorNotice>
        )}
        {!batch.active && items.some((item) => item.status === 'error') && (
          <p className="text-sm text-muted-foreground">
            {t('pdf.failedFilesHint')}
          </p>
        )}
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
      </div>
    </Dialog>
  )
}
