import { useState } from 'react'
import { RiCloseLine, RiArrowDownSLine, RiArrowUpSLine } from '@remixicon/react'
import type {
  ImportSnapshot,
  PdfImportController,
} from '@/application/import/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorNotice } from '@/components/workspace/ErrorNotice'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/i18n/use-i18n'
import { PasswordForm } from './PasswordForm'

export function ImportBatch({
  batch,
  controller,
}: {
  batch: ImportSnapshot
  controller: PdfImportController
}) {
  const { t, number } = useI18n()
  const [expanded, setExpanded] = useState<boolean | null>(null)
  if (!batch.items.length) return null
  const committed = batch.outcome.status === 'committed'
  const editable = !committed && batch.outcome.status !== 'failed'
  const items = batch.items.filter((item) => item.status !== 'removed')
  const finished = items.filter((item) =>
    ['extracted', 'parsed', 'imported', 'error', 'duplicate'].includes(
      item.status,
    ),
  ).length
  const problems = items.filter((item) =>
    ['locked', 'error'].includes(item.status),
  ).length
  const open = expanded ?? (batch.active || problems > 0)
  return (
    <section data-batch aria-label={t('pdf.batchTitle')} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">
          {t('pdf.batchCount', { count: items.length })}
          {problems > 0 && (
            <Badge className="ml-2" variant="secondary">
              {t('pdf.needsAttention', { count: problems })}
            </Badge>
          )}
        </p>
        <Button variant="ghost" size="sm" onClick={() => controller.cancel()}>
          {t(committed ? 'pdf.closeBatch' : 'pdf.cancelBatch')}
        </Button>
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
      {committed && (
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
        variant="ghost"
        size="sm"
        className="w-full justify-between"
        aria-expanded={open}
        onClick={() => setExpanded(!open)}
      >
        {t(open ? 'pdf.hideFiles' : 'pdf.showFiles')}
        {open ? (
          <RiArrowUpSLine aria-hidden="true" />
        ) : (
          <RiArrowDownSLine aria-hidden="true" />
        )}
      </Button>
      {open && (
        <ul
          data-file-list
          className="max-h-64 space-y-3 overflow-y-auto overscroll-contain"
          aria-label={t('pdf.batchTitle')}
        >
          {items.map((item) => (
            <li data-batch-item key={item.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <p
                  className="min-w-0 flex-1 truncate text-xs font-medium"
                  title={item.name}
                >
                  {item.name}
                </p>
                <Badge
                  variant={item.status === 'error' ? 'default' : 'secondary'}
                >
                  {t(`pdf.status.${item.status}`)}
                </Badge>
                {editable && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('pdf.remove', { name: item.name })}
                    onClick={() => controller.remove(item.id)}
                  >
                    <RiCloseLine aria-hidden="true" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {number(item.size / 1024, 0)} KB
                {(item.status === 'parsed' || item.status === 'imported') &&
                  ` · ${t('pdf.parsedSummary', { pages: item.totalPages ?? 0, transactions: item.transactions })}`}
              </p>
              {(item.status === 'reading' || item.status === 'parsing') && (
                <div role="status" className="space-y-1">
                  <Progress
                    value={
                      item.status === 'parsing' || !item.totalPages
                        ? null
                        : (item.completedPages / item.totalPages) * 100
                    }
                    aria-label={t(
                      item.status === 'parsing' ? 'pdf.parsing' : 'pdf.opening',
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    {item.status === 'parsing'
                      ? t('pdf.parsing')
                      : item.totalPages
                        ? t('pdf.pageProgress', {
                            completed: item.completedPages,
                            total: item.totalPages,
                          })
                        : t('pdf.opening')}
                  </p>
                </div>
              )}
              {item.status === 'locked' && (
                <PasswordForm
                  item={item}
                  onUnlock={(password) => controller.unlock(item.id, password)}
                />
              )}
              {item.status === 'error' && (
                <ErrorNotice
                  title={
                    item.problem ? t(`pdf.error.${item.problem}`) : undefined
                  }
                >
                  {editable &&
                    [
                      'read-failed',
                      'invalid-pdf',
                      'engine-unavailable',
                    ].includes(item.problem ?? '') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => controller.retry(item.id)}
                      >
                        {t('pdf.retry')}
                      </Button>
                    )}
                </ErrorNotice>
              )}
              {item.status === 'extracted' && (
                <p className="text-xs text-muted-foreground">
                  {t('pdf.extractedSummary', {
                    pages: item.totalPages ?? 0,
                    rows: item.textRows,
                  })}
                </p>
              )}
              {item.status === 'duplicate' && (
                <p className="text-xs text-muted-foreground">
                  {t('pdf.error.duplicate')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
