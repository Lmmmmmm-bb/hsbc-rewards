import { RiShieldCheckLine } from '@remixicon/react'
import type { SessionState } from '@/application/session/types'
import type { FxRequestState } from '@/application/fx/controller'
import { Card, CardContent } from '@/components/ui/card'
import { LocalPdfImport } from '@/features/import/components/LocalPdfImport'
import { useI18n } from '@/i18n/use-i18n'
import { FxReference } from './FxReference'

export function ResultImportPanel({
  session,
  fxRequest,
  onFiles,
  onStatus,
  hasResults,
}: {
  session: SessionState
  fxRequest: FxRequestState
  onFiles: (files: readonly File[]) => void
  onStatus: () => void
  hasResults: boolean
}) {
  const { t } = useI18n()
  return (
    <aside className="min-w-0 space-y-3" aria-label={t('import.dropTitle')}>
      <Card size="sm">
        <CardContent>
          <LocalPdfImport
            compact={hasResults}
            onFiles={onFiles}
            onStatus={onStatus}
          />
        </CardContent>
      </Card>
      {hasResults && (
        <Card size="sm">
          <CardContent>
            <FxReference fx={session.fx} request={fxRequest} />
          </CardContent>
        </Card>
      )}
      {session.mode === 'demo' && (
        <p className="text-xs text-muted-foreground">
          {t('cashback.demoNotice')}
        </p>
      )}
      <p className="flex gap-2 text-xs text-muted-foreground">
        <RiShieldCheckLine className="size-4 shrink-0" aria-hidden="true" />
        <span>{t('cashback.memory')}</span>
      </p>
    </aside>
  )
}
