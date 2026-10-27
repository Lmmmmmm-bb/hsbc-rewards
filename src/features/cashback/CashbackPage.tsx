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
}) {
  const { t } = useI18n()
  const [periodId, setPeriodId] = useState('all')
  const period = view.periods.find((item) => item.id === periodId)
  const scope = period ?? view
  const hasResults = session.dataset.statements.length > 0
  return (
    <WorkspaceShell
      mode={session.mode}
      hasData={hasResults || hasPendingFiles}
      onDemo={onDemo}
      onClear={onClear}
      onRules={onRules}
      onPrivacy={onPrivacy}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t('cashback.subtitle')}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('cashback.title')}
          </h1>
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
          view={scope}
          hasResults={hasResults}
          statementCount={
            period?.statementCount ?? session.dataset.statements.length
          }
          cardCount={period?.cardCount ?? session.dataset.cards.length}
          range={period ? { from: period.from, to: period.to } : view.coverage}
          period={period}
        />
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
      {hasResults && view.mismatchCount > 0 && (
        <ErrorNotice title={t('cashback.checkWarningTitle')} role="status">
          {t('cashback.checkWarning', { count: view.mismatchCount })}
        </ErrorNotice>
      )}
      {hasResults && <RewardQualityAlerts quality={scope.quality} />}
      {view.periods.length > 1 ? (
        <section className="space-y-4" aria-label={t('period.results')}>
          <p className="text-xs text-muted-foreground">{t('period.capHint')}</p>
          {(period ? [period] : view.periods).map((item) => (
            <RewardBreakdown
              key={item.id}
              cards={item.rewardCards}
              period={item}
            />
          ))}
        </section>
      ) : (
        <RewardBreakdown cards={view.rewardCards} period={view.periods[0]} />
      )}
    </WorkspaceShell>
  )
}
