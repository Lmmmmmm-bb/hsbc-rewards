import { RiCloseLine } from '@remixicon/react'
import type {
  ImportSnapshot,
  PdfImportController,
} from '@/application/import/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  if (batch.items.length === 0) return null
  const committed = batch.outcome.status === 'committed'
  const editable = !committed && batch.outcome.status !== 'failed'
  return (
    <Card data-batch aria-label={t('pdf.batchTitle')}>
      <CardHeader>
        <CardTitle>{t('pdf.batchTitle')}</CardTitle>
        <CardDescription>
          {t(committed ? 'pdf.committedHint' : 'pdf.batchHint')}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" onClick={() => controller.cancel()}>
            {t(committed ? 'pdf.closeBatch' : 'pdf.cancelBatch')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {committed && (
          <Alert role="status">
            <AlertDescription>
              {t('pdf.committed', batch.outcome)}
            </AlertDescription>
          </Alert>
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
        <p className="sr-only" role="status">
          {t('pdf.batchProgress', {
            completed: batch.items.filter((item) =>
              [
                'extracted',
                'parsed',
                'imported',
                'error',
                'duplicate',
                'removed',
              ].includes(item.status),
            ).length,
            total: batch.items.length,
          })}
        </p>
        <ul className="divide-y">
          {batch.items
            .filter((item) => item.status !== 'removed')
            .map((item) => (
              <li
                data-batch-item
                key={item.id}
                className="space-y-4 py-5 first:pt-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <p className="break-all text-sm font-medium">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          item.status === 'error' ? 'default' : 'secondary'
                        }
                      >
                        {t(`pdf.status.${item.status}`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {number(item.size / 1024, 0)} KB
                      </span>
                    </div>
                  </div>
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
                {(item.status === 'reading' || item.status === 'parsing') && (
                  <div role="status" className="space-y-2">
                    <Progress
                      value={
                        item.status === 'parsing' || !item.totalPages
                          ? null
                          : (item.completedPages / item.totalPages) * 100
                      }
                      aria-label={t(
                        item.status === 'parsing'
                          ? 'pdf.parsing'
                          : 'pdf.opening',
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
                    onUnlock={(password) =>
                      controller.unlock(item.id, password)
                    }
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
                {(item.status === 'parsed' || item.status === 'imported') && (
                  <p className="text-xs text-muted-foreground">
                    {t('pdf.parsedSummary', {
                      pages: item.totalPages ?? 0,
                      transactions: item.transactions,
                    })}
                  </p>
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
      </CardContent>
    </Card>
  )
}
