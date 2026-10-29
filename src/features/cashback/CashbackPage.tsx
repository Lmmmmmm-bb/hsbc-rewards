import type { ResultDetailsRequest } from '@/application/results/details'
import { Button } from '@/components/ui/button'
import { selectResultScope } from '@/application/results/scope'
import { RewardEvidence } from './RewardEvidence'
import { usePdfImport } from '@/store/use-pdf-import'
import { useState } from 'react'
import { RiShieldCheckLine } from '@remixicon/react'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import type { FxRequestState } from '@/application/fx/controller'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LocalPdfImport } from '@/features/import/components/LocalPdfImport'
import { RewardBreakdown } from './RewardBreakdown'
import { RewardSummary } from './RewardSummary'
import { RewardPeriods } from './RewardPeriods'
import { RewardQualityAlerts } from './RewardQualityAlerts'
import { FxReference } from './FxReference'
import { ErrorNotice } from '@/components/workspace/ErrorNotice'
import { useI18n } from '@/i18n/use-i18n'
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'

export function CashbackPage({
  session,
  view,
  fxRequest,
  hasPendingFiles,
  onDemo,
  onFiles,
  onClear,
  onPrivacy,
  onRules,
  onFileStatus,
  onAgent,
  onDetails,
}: {
  session: SessionState
  view: WorkspaceView
  fxRequest: FxRequestState
  hasPendingFiles: boolean
  onDemo: () => void
  onFiles: (files: readonly File[]) => void
  onClear: () => void
  onPrivacy: () => void
  onRules: () => void
  onFileStatus: () => void
  onAgent: () => void
  onDetails: (request: ResultDetailsRequest) => void
}) {
  const { t } = useI18n()
  const [periodId, setPeriodId] = useState('all')
  const period = view.periods.find((item) => item.id === periodId)
  const resultScope = selectResultScope(session, view, { periodId: period?.id ?? 'all' })
  const scope = resultScope.view
  const { batch } = usePdfImport()
  const hasResults = session.dataset.statements.length > 0
  const revealKey = `${session.revision}:${period?.id ?? 'all'}`

  return (
    <WorkspaceShell
      mode={session.mode}
      hasData={hasResults || hasPendingFiles}
      onDemo={onDemo}
      onClear={onClear}
      onRules={onRules}
      onPrivacy={onPrivacy}
      onAgent={onAgent}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t('cashback.subtitle')}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t(hasResults ? 'cashback.title' : 'cashback.emptyTitle')}
          </h1>
          {!hasResults && (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t('cashback.intro')}
            </p>
          )}
        </div>
        {session.mode === 'demo' && (
          <Badge variant="outline">{t('cashback.example')}</Badge>
        )}
      </div>
      {view.periods.length > 1 && (
        <RewardPeriods
          periods={view.periods}
          selected={period?.id ?? 'all'}
          onSelect={setPeriodId}
        />
      )}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <RewardSummary
          revealKey={revealKey}
          view={scope}
          hasResults={hasResults}
          statementCount={
            period?.statementCount ?? session.dataset.statements.length
          }
          cardCount={period?.cardCount ?? session.dataset.cards.length}
          range={period ? { from: period.from, to: period.to } : view.coverage}
          period={period}
        >
          {hasResults && <RewardEvidence scope={resultScope} onDetails={() => onDetails({ tab: 'calculation', periodId: resultScope.periodId })} />}
        </RewardSummary>
        <aside className="min-w-0 space-y-3" aria-label={t('import.dropTitle')}>
          <Card size="sm">
            <CardContent>
              <LocalPdfImport onFiles={onFiles} onStatus={onFileStatus} />
            </CardContent>
          </Card>
          {hasResults && (
            <Card size="sm">
              <CardContent>
                <FxReference fx={session.fx} request={fxRequest} />
              </CardContent>
            </Card>
          )}
          <p className="flex gap-2 text-xs text-muted-foreground">
            <RiShieldCheckLine className="size-4 shrink-0" aria-hidden="true" />
            <span>{t('cashback.memory')}</span>
          </p>
        </aside>
      </div>
      {session.mode === 'demo' && (
        <Alert role="status">
          <AlertDescription>{t('cashback.demoNotice')}</AlertDescription>
        </Alert>
      )}
      {hasResults && batch.active && <Alert role="status"><AlertDescription>{t('basis.pendingImport')}</AlertDescription></Alert>}
      {hasResults && resultScope.mismatchStatementCount > 0 && (
        <ErrorNotice title={t('cashback.checkWarningTitle')} role="status">
          {t('cashback.checkWarning', { count: resultScope.mismatchStatementCount })}
          <Button variant="link" className="h-auto p-0" onClick={() => onDetails({ tab: 'statements', periodId: resultScope.periodId, reconciliation: 'mismatch' })}>{t('details.inspect')}</Button>
        </ErrorNotice>
      )}
      {hasResults && <RewardQualityAlerts quality={scope.quality} onDetails={(request) => onDetails({ ...request, periodId: resultScope.periodId })} />}
      {view.periods.length > 1 ? (
        <section className="space-y-4" aria-label={t('period.results')}>
          <p className="text-xs text-muted-foreground">{t('period.capHint')}</p>
          {(period ? [period] : view.periods).map((item) => (
            <RewardBreakdown
              key={item.id}
              revealKey={revealKey}
              onDetails={(request) => onDetails({ ...request, periodId: item.id })}
              cards={item.rewardCards}
              period={item}
            />
          ))}
        </section>
      ) : (
        <RewardBreakdown
          revealKey={revealKey}
          onDetails={(request) => onDetails({ ...request, periodId: view.periods[0]?.id ?? 'all' })}
          cards={view.rewardCards}
          period={view.periods[0]}
        />
      )}
    </WorkspaceShell>
  )
}
