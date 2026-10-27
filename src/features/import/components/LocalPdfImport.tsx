import { useRef, useState } from 'react'
import { RiFileUploadLine, RiCloseLine, RiInformationLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { usePdfImport } from '@/store/use-pdf-import'
import { useI18n } from '@/i18n/use-i18n'
import { PasswordForm } from './PasswordForm'

export function LocalPdfImport({
  beforeRead,
}: {
  beforeRead: () => void
}) {
  const { t, number } = useI18n()
  const input = useRef<HTMLInputElement>(null)
  const { batch, controller } = usePdfImport()
  const [dragging, setDragging] = useState(false)
  const start = (files: FileList | null) => {
    if (files?.length && !batch.active) {
      beforeRead()
      controller.start(Array.from(files))
    }
  }
  return (
    <div className="space-y-6">
      <Card
        data-import-drop
        className={dragging ? 'border-primary' : undefined}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          start(event.dataTransfer.files)
        }}
      >
        <CardContent>
          <Empty className="px-0 py-5">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RiFileUploadLine aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t('import.dropTitle')}</EmptyTitle>
              <EmptyDescription>{t('pdf.dropBody')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Input
                ref={input}
                className="hidden"
                type="file"
                multiple
                accept="application/pdf,.pdf"
                aria-label={t('pdf.choose')}
                onChange={(event) => {
                  start(event.target.files)
                  event.target.value = ''
                }}
              />
              <Button size="lg" onClick={() => input.current?.click()} disabled={batch.active}>
                <RiFileUploadLine aria-hidden="true" />
                {t('pdf.choose')}
              </Button>
              <p className="text-xs text-muted-foreground">{t('import.limit')}</p>
            </EmptyContent>
          </Empty>
          <Alert>
            <RiInformationLine aria-hidden="true" />
            <AlertDescription>{t('pdf.stageHint')}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      {batch.rejected && (
        <Alert variant="destructive">
          <AlertDescription>{t(`pdf.error.${batch.rejected}`)}</AlertDescription>
        </Alert>
      )}
      {batch.items.length > 0 && (
        <Card data-batch aria-label={t('pdf.batchTitle')}>
          <CardHeader>
            <CardTitle>{t('pdf.batchTitle')}</CardTitle>
            <CardDescription>{t('pdf.batchHint')}</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" onClick={() => controller.cancel()}>
                {t('pdf.cancelBatch')}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="sr-only" role="status">
              {t('pdf.batchProgress', {
                completed: batch.items.filter((item) =>
                  ['extracted', 'error', 'duplicate', 'removed'].includes(item.status),
                ).length,
                total: batch.items.length,
              })}
            </p>
            <ul className="divide-y">
              {batch.items
                .filter((item) => item.status !== 'removed')
                .map((item) => (
                  <li data-batch-item key={item.id} className="space-y-4 py-5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <p className="break-all text-sm font-medium">{item.name}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={item.status === 'error' ? 'destructive' : 'secondary'}>
                            {t(`pdf.status.${item.status}`)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {number(item.size / 1024, 0)} KB
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('pdf.remove', { name: item.name })}
                        onClick={() => controller.remove(item.id)}
                      >
                        <RiCloseLine aria-hidden="true" />
                      </Button>
                    </div>
                    {item.status === 'reading' && (
                      <div role="status" className="space-y-2">
                        <Progress
                          value={
                            item.totalPages ? (item.completedPages / item.totalPages) * 100 : null
                          }
                          aria-label={t('pdf.opening')}
                        />
                        <p className="text-xs text-muted-foreground">
                          {item.totalPages
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
                      <Alert variant="destructive">
                        <AlertTitle>{item.problem && t(`pdf.error.${item.problem}`)}</AlertTitle>
                        {['read-failed', 'invalid-pdf', 'engine-unavailable'].includes(
                          item.problem ?? '',
                        ) && (
                          <AlertDescription>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => controller.retry(item.id)}
                            >
                              {t('pdf.retry')}
                            </Button>
                          </AlertDescription>
                        )}
                      </Alert>
                    )}
                    {item.status === 'extracted' && (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          {t('pdf.extractedSummary', {
                            pages: item.totalPages ?? 0,
                            rows: item.textRows,
                          })}
                        </p>
                      </div>
                    )}
                    {item.status === 'duplicate' && (
                      <p className="text-xs text-muted-foreground">{t('pdf.error.duplicate')}</p>
                    )}
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
