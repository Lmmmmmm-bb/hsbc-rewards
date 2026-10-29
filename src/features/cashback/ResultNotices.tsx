import type { ResultScope } from '@/application/results/scope'
import type { ResultDetailsRequest } from '@/application/results/details'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ErrorNotice } from '@/components/workspace/ErrorNotice'
import { useI18n } from '@/i18n/use-i18n'
import { RewardQualityAlerts } from './RewardQualityAlerts'

export function ResultNotices({
  scope,
  importActive,
  onDetails,
}: {
  scope: ResultScope
  importActive: boolean
  onDetails: (request: ResultDetailsRequest) => void
}) {
  const { t } = useI18n()
  const open = (request: ResultDetailsRequest) =>
    onDetails({ ...request, periodId: scope.periodId })
  return (
    <>
      {importActive && (
        <Alert role="status">
          <AlertDescription>{t('basis.pendingImport')}</AlertDescription>
        </Alert>
      )}
      {scope.mismatchStatementCount > 0 && (
        <ErrorNotice title={t('cashback.checkWarningTitle')} role="status">
          {t('cashback.checkWarning', { count: scope.mismatchStatementCount })}{' '}
          <Button
            variant="link"
            className="h-auto p-0"
            onClick={() => open({ reconciliation: 'mismatch' })}
          >
            {t('details.inspect')}
          </Button>
        </ErrorNotice>
      )}
      <RewardQualityAlerts quality={scope.view.quality} onDetails={open} />
    </>
  )
}
