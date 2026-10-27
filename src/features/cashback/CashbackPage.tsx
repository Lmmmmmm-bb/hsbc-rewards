import {
  RiBankCardLine,
  RiShieldCheckLine,
  RiArrowGoBackLine,
  RiArrowRightLine,
} from '@remixicon/react'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LocalPdfImport } from '@/features/import/components/LocalPdfImport'
import { RewardBreakdown } from './RewardBreakdown'
import { RewardRules } from './RewardRules'
import { RewardQualityAlerts } from './RewardQualityAlerts'
import type { FxRequestState } from '@/application/fx/controller'
import { FxReference } from './FxReference'
import { ErrorNotice } from '@/components/workspace/ErrorNotice'
import { useI18n } from '@/i18n/use-i18n'

export function CashbackPage({
  session,
  view,
  fxRequest,
  onRefreshFx,
  hasPendingFiles,
  onDemo,
  beforeRead,
  onClear,
  onPrivacy,
}: {
  session: SessionState
  view: WorkspaceView
  fxRequest: FxRequestState
  onRefreshFx: () => void
  hasPendingFiles: boolean
  onDemo: () => void
  beforeRead: () => void
  onClear: () => void
  onPrivacy: () => void
}) {
  const { t, money, number, rc, date } = useI18n()
  const hasResults = session.dataset.statements.length > 0
  const stats = [
    { label: 'cashback.statements', value: session.dataset.statements.length },
    { label: 'cashback.cards', value: session.dataset.cards.length },
    { label: 'cashback.purchases', value: view.expenseCount },
  ] as const
  return (
    <div className="min-h-svh bg-background">
      <Button
        variant="outline"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        onClick={() => document.getElementById('cashback-main')?.focus()}
      >
        {t('action.skip')}
      </Button>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-b px-5 py-5 sm:px-8">
        <a
          href="#"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <RiBankCardLine className="size-6 text-primary" aria-hidden="true" />
          <span>Pulse Rewards</span>
        </a>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDemo}
            disabled={session.mode === 'real'}
          >
            {t('cashback.tryExample')}
            <RiArrowRightLine aria-hidden="true" />
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
        className="mx-auto max-w-6xl space-y-8 px-5 py-8 outline-none sm:px-8 sm:py-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t('cashback.subtitle')}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
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
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          <div className="min-w-0 space-y-4 lg:col-span-2">
            <Card data-reward-summary>
              <CardHeader>
                <CardTitle>
                  <h2>
                    {t(
                      hasResults && view.totalRewardMicroRc === null
                        ? 'cashback.knownHeading'
                        : 'cashback.total',
                    )}
                  </h2>
                </CardTitle>
                <CardDescription>
                  {t(
                    hasResults
                      ? view.totalRewardMicroRc === null
                        ? 'cashback.knownHint'
                        : 'cashback.totalHint'
                      : 'cashback.emptyHint',
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <p
                    data-reward-total
                    className="min-w-0 break-words text-4xl leading-none font-semibold tracking-tight text-primary tabular-nums sm:text-6xl"
                  >
                    {hasResults
                      ? number(
                          (view.totalRewardMicroRc ?? view.knownRewardMicroRc) /
                            1_000_000,
                          2,
                        )
                      : '—'}
                    <span className="ml-2 text-lg font-medium text-foreground">
                      RC
                    </span>
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {t('cashback.reference')}
                    </p>
                    <p className="text-xl font-medium tabular-nums">
                      {hasResults
                        ? view.totalRewardCnyMinor === null
                          ? t('rewards.fxMissing')
                          : money(view.totalRewardCnyMinor)
                        : '—'}
                    </p>
                  </div>
                </div>
                <dl className="grid gap-4 border-y py-5 sm:grid-cols-3">
                  {view.tierTotals.map(({ tier, microRc, knownMicroRc }) => (
                    <div
                      key={tier}
                      className="flex flex-wrap items-baseline justify-between gap-3 sm:block sm:space-y-2"
                    >
                      <dt className="text-muted-foreground">
                        {t(`rewards.${tier}`)}
                      </dt>
                      <dd className="font-mono text-base tabular-nums">
                        {hasResults ? rc(microRc) : '— RC'}
                      </dd>
                      {hasResults && microRc === null && knownMicroRc > 0 && (
                        <dd className="basis-full text-right text-muted-foreground sm:text-left">
                          {t('rewards.knownPortion', {
                            amount: rc(knownMicroRc),
                          })}
                        </dd>
                      )}
                    </div>
                  ))}
                </dl>
                {hasResults && view.totalRewardMicroRc === null && (
                  <Badge variant="outline">
                    {t('cashback.pendingRewards')}
                  </Badge>
                )}
                <dl className="flex flex-wrap gap-x-8 gap-y-4">
                  {stats.map(({ label, value }) => (
                    <div key={label} className="space-y-1">
                      <dt className="text-muted-foreground">{t(label)}</dt>
                      <dd className="text-base font-medium tabular-nums">
                        {hasResults ? number(value, 0) : '—'}
                      </dd>
                    </div>
                  ))}
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">
                      {t('cashback.coverage')}
                    </dt>
                    <dd className="font-medium">
                      {view.coverage
                        ? `${date(view.coverage.from)} — ${date(view.coverage.to)}`
                        : '—'}
                    </dd>
                  </div>
                </dl>
                <div className="space-y-1 text-muted-foreground">
                  {hasResults && view.periodInferred && (
                    <p>{t('rewards.periodInferred')}</p>
                  )}
                  {hasResults && view.totalRewardMicroRc === null && (
                    <p>
                      {t('cashback.known', {
                        amount: rc(view.knownRewardMicroRc),
                      })}
                    </p>
                  )}
                </div>
                {hasResults && (
                  <FxReference
                    fx={session.fx}
                    request={fxRequest}
                    onRefresh={onRefreshFx}
                  />
                )}
              </CardContent>
            </Card>
            {session.mode === 'demo' && (
              <Alert role="status">
                <AlertDescription>{t('cashback.demoNotice')}</AlertDescription>
              </Alert>
            )}
            {hasResults && view.mismatchCount > 0 && (
              <ErrorNotice
                title={t('cashback.checkWarningTitle')}
                role="status"
              >
                {t('cashback.checkWarning', { count: view.mismatchCount })}
              </ErrorNotice>
            )}
            {hasResults && <RewardQualityAlerts quality={view.quality} />}
          </div>
          <aside
            className="order-first min-w-0 space-y-4 lg:order-last"
            aria-label={t('import.dropTitle')}
          >
            <LocalPdfImport beforeRead={beforeRead} />
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <RiShieldCheckLine
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>{t('cashback.memory')}</span>
            </p>
          </aside>
        </div>
        <RewardBreakdown cards={view.rewardCards} />
        <RewardRules rules={view.rules} />
      </main>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t px-5 py-5 text-xs text-muted-foreground sm:px-8">
        <p>{t('footer.independent')}</p>
        <Button variant="link" size="sm" onClick={onPrivacy}>
          {t('action.privacy')}
        </Button>
      </footer>
    </div>
  )
}
