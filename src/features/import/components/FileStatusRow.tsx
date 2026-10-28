import { RiCloseLine, RiFilePdf2Line } from '@remixicon/react'
import type {
  ImportItem,
  PdfImportController,
} from '@/application/import/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ErrorNotice } from '@/components/workspace/ErrorNotice'
import { useI18n } from '@/i18n/use-i18n'
import { PasswordForm } from './PasswordForm'

export function FileStatusRow({
  item,
  controller,
  editable,
}: {
  item: ImportItem
  controller: PdfImportController
  editable: boolean
}) {
  const { t, number } = useI18n()
  return (
    <li data-batch-item>
      <Card size="sm" className="border ring-0">
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <RiFilePdf2Line
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="break-all text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {number(item.size / 1024, 0)} KB
              </p>
            </div>
            <Badge variant={item.status === 'error' ? 'default' : 'secondary'}>
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
          {(item.status === 'parsed' || item.status === 'imported') && (
            <p className="text-sm text-muted-foreground">
              {t('pdf.parsedSummary', {
                pages: item.totalPages ?? 0,
                transactions: item.transactions,
              })}
            </p>
          )}
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
              title={item.problem ? t(`pdf.error.${item.problem}`) : undefined}
            >
              {editable &&
                ['read-failed', 'invalid-pdf', 'engine-unavailable'].includes(
                  item.problem ?? '',
                ) && (
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
            <p className="text-sm text-muted-foreground">
              {t('pdf.extractedSummary', {
                pages: item.totalPages ?? 0,
              })}
            </p>
          )}
          {item.status === 'duplicate' && (
            <p className="text-sm text-muted-foreground">
              {t('pdf.error.duplicate')}
            </p>
          )}
        </CardContent>
      </Card>
    </li>
  )
}
