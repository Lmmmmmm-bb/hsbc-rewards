import { useState } from 'react'
import type { ResultDetailsRequest } from '@/application/results/details'
import { selectResultScope } from '@/application/results/scope'
import { resultSections } from '@/application/results/sections'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import type { FxRequestState } from '@/application/fx/controller'
import { Badge } from '@/components/ui/badge'
import { usePdfImport } from '@/app/use-pdf-import'
import { useI18n } from '@/i18n/use-i18n'
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'
import { RewardBreakdown } from './RewardBreakdown'
import { RewardSummary } from './RewardSummary'
import { RewardPeriods } from './RewardPeriods'
import { RewardEvidence } from './RewardEvidence'
import { ResultNotices } from './ResultNotices'
import { ResultImportPanel } from './ResultImportPanel'

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
  const { batch } = usePdfImport()
  const [periodId, setPeriodId] = useState('all')
  const period = view.periods.find((item) => item.id === periodId)
  const selectedId = period?.id ?? 'all'
  const scope = selectResultScope(session, view, { periodId: selectedId })
  const hasResults = session.dataset.statements.length > 0
  const revealKey = `${session.revision}:${selectedId}`
  const sections = resultSections(session, view, selectedId)

  return (
    <WorkspaceShell
      mode={session.mode}
      onDemo={onDemo}
      hasData={hasResults || hasPendingFiles}
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
          selected={selectedId}
          onSelect={setPeriodId}
        />
      )}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <RewardSummary
          revealKey={revealKey}
          view={scope.view}
          hasResults={hasResults}
          statementCount={
            period?.statementCount ?? session.dataset.statements.length
          }
          cardCount={period?.cardCount ?? session.dataset.cards.length}
          range={period ? { from: period.from, to: period.to } : view.coverage}
          period={period}
        >
          {hasResults && (
            <>
              <RewardEvidence
                scope={scope}
                onDetails={() => onDetails({ periodId: selectedId })}
              />
              <ResultNotices
                scope={scope}
                importActive={batch.active}
                onDetails={onDetails}
              />
            </>
          )}
        </RewardSummary>
        <ResultImportPanel
          session={session}
          hasResults={hasResults}
          fxRequest={fxRequest}
          onFiles={onFiles}
          onStatus={onFileStatus}
        />
      </div>
      {!hasResults && (
        <RewardBreakdown
          revealKey={revealKey}
          cards={[]}
          pools={[]}
          onDetails={onDetails}
        />
      )}
      {hasResults && (
        <section className="space-y-6" aria-label={t('period.results')}>
          {view.periods.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {t('period.capHint')}
            </p>
          )}
          <div className="divide-y divide-border" data-period-groups>
            {sections.map(({ period: item, cards, pools }) => (
              <div key={item.id} className="py-6 first:pt-0 last:pb-0">
                <RewardBreakdown
                  revealKey={revealKey}
                  cards={cards}
                  pools={pools}
                  period={item}
                  onDetails={(request) =>
                    onDetails({ ...request, periodId: item.id })
                  }
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </WorkspaceShell>
  )
}
