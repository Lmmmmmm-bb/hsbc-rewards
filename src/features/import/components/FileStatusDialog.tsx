import { useRef } from 'react'
import { usePdfImport } from '@/app/use-pdf-import'
import { Dialog } from '@/components/workspace/Dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ErrorNotice } from '@/components/workspace/ErrorNotice'
import { useI18n } from '@/i18n/use-i18n'
import { DeferredDialogContent } from '@/components/workspace/DeferredDialogContent'
import { PdfFilePicker } from './PdfFilePicker'

export function FileStatusDialog({
  onClose,
  onCancel,
  onFiles,
  focusItemId,
}: {
  onClose: () => void
  onCancel: () => void
  onFiles: (files: readonly File[]) => void
  focusItemId?: string
}) {
  const { batch, controller } = usePdfImport()
  const cancelled = useRef(false)
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
      returnFocus={() =>
        cancelled.current
          ? document.getElementById('cashback-main')
          : (document.querySelector<HTMLElement>(
              '[data-file-status-trigger]',
            ) ?? document.getElementById('cashback-main'))
      }
      className="sm:max-w-3xl"
      footer={
        <>
          <PdfFilePicker
            label={t('pdf.addFiles')}
            onFiles={onFiles}
            disabled={batch.active}
            variant="outline"
          />
          {batch.active && (
            <Button
              variant="outline"
              onClick={() => {
                cancelled.current = true
                onCancel()
              }}
            >
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
                <dt className="text-xs text-foreground">
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
            <p className="text-xs text-muted-foreground">
              {t('pdf.addFilesBusy')}
            </p>
          </div>
        )}
        {committed && (
          <p role="status" className="text-sm font-medium">
            {t('pdf.committed', batch.outcome)}
          </p>
        )}
        {!batch.active && (
          <p className="text-sm text-muted-foreground">
            {t('pdf.addFilesHint')}
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
        <DeferredDialogContent>
          {({ FileStatusList }) => (
            <FileStatusList
              items={items}
              controller={controller}
              editable={editable}
              focusItemId={focusItemId}
            />
          )}
        </DeferredDialogContent>
      </div>
    </Dialog>
  )
}
