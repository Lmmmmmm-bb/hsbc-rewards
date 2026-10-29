import { RiArrowRightSLine, RiFileTextLine } from '@remixicon/react'
import type { ResultScope } from '@/application/results/scope'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import {
  statementSummaries,
  statementTransactionPage,
} from '@/application/results/statements'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'
import { DetailPagination } from './DetailPagination'
import { BalanceAccount } from './BalanceAccount'
import { TransactionRow } from './TransactionRow'

export function StatementDetails({
  scope,
  session,
  workspace,
  statementId,
  status,
  onSelect,
  onTransaction,
  onBack,
  page,
  onPage,
}: {
  scope: ResultScope
  session: SessionState
  workspace: WorkspaceView
  statementId: string | null
  status?: 'mismatch' | 'unverified'
  onSelect: (id: string) => void
  onTransaction: (id: string) => void
  page: number
  onPage: (page: number) => void
  onBack: () => void
}) {
  const { t, date } = useI18n()
  if (!statementId) {
    const reports = statementSummaries(scope, status)
    return (
      <div className="space-y-4" data-detail-statements>
        <h3 className="font-semibold text-primary">
          {t('details.statementRecords')}
        </h3>
        {!reports.length && <p>{t('details.empty')}</p>}
        <ul className="divide-y border-y">
          {reports.map(({ statement, currencies, status: balanceStatus }) => (
            <li key={statement.id}>
              <Button
                variant="ghost"
                className="h-auto w-full items-start justify-between gap-3 px-2 py-4 text-left whitespace-normal"
                data-statement-id={statement.id}
                onClick={() => onSelect(statement.id)}
              >
                <span className="flex min-w-0 items-start gap-3">
                  <RiFileTextLine
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 space-y-1.5">
                    <span className="block text-xs font-normal text-muted-foreground">
                      {date(statement.date)} · {currencies.join(' / ')}
                    </span>
                    <span className="block break-all text-sm font-medium">
                      {statement.fileName}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {date(statement.period.from)} —{' '}
                      {date(statement.period.to)}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">
                    {t(`details.balance.${balanceStatus}`)}
                  </Badge>
                  <RiArrowRightSLine
                    className="hidden size-4 text-muted-foreground sm:block"
                    aria-hidden="true"
                  />
                </span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  const report = statementSummaries(scope).find(
    ({ statement }) => statement.id === statementId,
  )
  if (!report) return <p>{t('details.objectMissing')}</p>
  const { entries, count, current, pages } = statementTransactionPage(
    session,
    workspace,
    scope,
    statementId,
    page,
  )
  return (
    <div className="space-y-6" data-statement-detail>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            {t('details.back')}
          </Button>
          <Badge variant="outline">
            {t(`details.balance.${report.status}`)}
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {date(report.statement.date)}
          </p>
          <h3
            className="break-all text-lg font-semibold outline-none"
            tabIndex={-1}
            data-detail-heading
          >
            {report.statement.fileName}
          </h3>
          <p className="text-sm">
            {t('period.range')} · {date(report.statement.period.from)} —{' '}
            {date(report.statement.period.to)}
          </p>
        </div>
        {report.statement.warnings.some(
          (warning) => warning.code === 'statement.period-inferred',
        ) && (
          <p className="text-xs text-muted-foreground">
            {t('rewards.periodInferred')}
          </p>
        )}
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        {report.accounts.map((account) => (
          <BalanceAccount key={account.accountId} account={account} />
        ))}
      </div>
      {!report.accounts.length && <p>{t('quality.noAccounts')}</p>}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-semibold text-primary">
            {t('details.sourceTransactions')}
          </h4>
          <p role="status" className="text-xs text-muted-foreground">
            {t('details.page', { page: current + 1, pages, count })}
          </p>
        </div>
        <ul className="divide-y border-y">
          {entries.map((entry) => (
            <li key={entry.row.id}>
              <TransactionRow entry={entry} source onSelect={onTransaction} />
            </li>
          ))}
        </ul>
        <DetailPagination current={current} pages={pages} onPage={onPage} />
      </section>
    </div>
  )
}
