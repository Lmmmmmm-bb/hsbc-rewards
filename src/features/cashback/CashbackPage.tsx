import { useState } from 'react'
import {
  RiBankCardLine,
  RiShieldCheckLine,
  RiArrowGoBackLine,
  RiBookOpenLine,
} from '@remixicon/react'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import type { FxRequestState } from '@/application/fx/controller'
import { Button } from '@/components/ui/button'
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
}) {
  const { t } = useI18n()
  const [periodId, setPeriodId] = useState('all')
  const period = view.periods.find((item) => item.id === periodId)
  const scope = period ?? view
  const hasResults = session.dataset.statements.length > 0
  return (
    <div className="relative isolate min-h-svh">
      <div
        aria-hidden="true"
        data-fixed-dots
        className="pointer-events-none fixed inset-0 -z-10 bg-background"
      >
        <div className="absolute inset-0 bg-[radial-gradient(var(--muted-foreground)_0.8px,transparent_0.8px)] bg-size-[18px_18px] opacity-15" />
      </div>
      <Button
        variant="outline"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        onClick={() => document.getElementById('cashback-main')?.focus()}
      >
        {t('action.skip')}
      </Button>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
        <a
          href="#"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <RiBankCardLine className="size-6 text-primary" aria-hidden="true" />
          <span>Pulse Rewards</span>
        </a>
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="outline" size="sm" onClick={onRules}>
            <RiBookOpenLine aria-hidden="true" />
            {t('rules.dialogTitle')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDemo}
            disabled={session.mode === 'real'}
          >
            {t('cashback.tryExample')}
          </Button>
          {(hasResults || hasPendingFiles) && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <RiArrowGoBackLine aria-hidden="true" />
              {t('cashback.restart')}
            </Button>
          )}
        </div>
      </header>
      <main
        id="cashback-main"
        tabIndex={-1}
        className="mx-auto max-w-6xl space-y-5 px-4 py-3 outline-none sm:px-6 sm:py-5"
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
          <Badge variant="outline">
            {t(
              session.mode === 'demo'
                ? 'cashback.example'
                : 'cashback.currentRules',
            )}
          </Badge>
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
            range={
              period ? { from: period.from, to: period.to } : view.coverage
            }
            period={period}
          />
          <aside
            className="min-w-0 space-y-3"
            aria-label={t('import.dropTitle')}
          >
            <Card size="sm">
              <CardContent>
                <LocalPdfImport onFiles={onFiles} />
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
              <RiShieldCheckLine
                className="size-4 shrink-0"
                aria-hidden="true"
              />
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
            <p className="text-xs text-muted-foreground">
              {t('period.capHint')}
            </p>
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
      </main>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <p>{t('footer.independent')}</p>
        <Button variant="link" size="sm" onClick={onPrivacy}>
          {t('action.privacy')}
        </Button>
      </footer>
    </div>
  )
}
