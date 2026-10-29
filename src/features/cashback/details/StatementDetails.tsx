import type { ResultScope } from '@/application/results/scope'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import { statementTransactionPage } from '@/application/results/statements'
import { DetailPagination } from './DetailPagination'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'

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
  const { t, date, money, rcSummary } = useI18n()
  const report = scope.reports.find((item) => item.statement.id === statementId)
  const reports = scope.reports.filter(
    (item) =>
      !status ||
      scope.reconciliations.some(
        ({ statement, account }) =>
          statement.id === item.statement.id && account.status === status,
      ),
  )
  const label = (item: ResultScope['reports'][number]) =>
    `${date(item.statement.date)} · ${item.statement.fileName}`
  if (!statementId)
    return (
      <div className="space-y-3" data-detail-statements>
        <p className="text-xs text-muted-foreground">
          {t('details.fullStatement')}
        </p>
        {!reports.length && <p>{t('details.empty')}</p>}
        {reports.map((item) => (
          <Button
            key={item.statement.id}
            variant="outline"
            className="h-auto w-full justify-start py-3 text-left whitespace-normal break-all"
            onClick={() => onSelect(item.statement.id)}
          >
            {label(item)}
          </Button>
        ))}
      </div>
    )
  if (!report) return <p>{t('details.objectMissing')}</p>
  const accounts = scope.reconciliations.filter(
    ({ statement }) => statement.id === statementId,
  )
  const { entries, count, current, pages } = statementTransactionPage(
    session,
    workspace,
    scope,
    statementId,
    page,
  )
  return (
    <div className="space-y-4" data-statement-detail>
      <Button variant="outline" size="sm" onClick={onBack}>
        {t('details.back')}
      </Button>
      <h3
        className="break-all text-base font-semibold"
        tabIndex={-1}
        data-detail-heading
      >
        {label(report)}
      </h3>
      <p>
        {t('card.coverage', {
          count: 1,
          from: date(report.statement.period.from),
          to: date(report.statement.period.to),
        })}
      </p>
      <p className="text-xs text-muted-foreground">
        {t('details.fullStatement')}
      </p>
      {report.statement.warnings.some(
        (warning) => warning.code === 'statement.period-inferred',
      ) && (
        <p className="text-xs text-muted-foreground">
          {t('rewards.periodInferred')}
        </p>
      )}
      {accounts.map(({ account }) => (
        <section key={account.accountId} className="space-y-3 border p-3">
          <div className="flex flex-wrap justify-between gap-2 font-medium">
            <h4>{account.currency}</h4>
            <p>{t(`details.balance.${account.status}`)}</p>
          </div>
          <dl className="space-y-2 tabular-nums">
            {(
              [
                ['opening', account.openingMinor],
                ['debit', account.debitMinor],
                ['credit', account.creditMinor],
                ['expected', account.expectedMinor],
                ['closing', account.closingMinor],
                ['delta', account.deltaMinor],
              ] as const
            ).map(([key, amount]) => (
              <div key={key} className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted-foreground">
                  {t(`details.balance.${key}`)}
                </dt>
                <dd>
                  {amount === null
                    ? t('details.missing')
                    : `${key === 'delta' && amount > 0 ? '+' : ''}${money(amount, account.currency)}`}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            {t('details.deltaHint')}
          </p>
        </section>
      ))}
      <h4 className="font-medium">{t('details.sourceTransactions')}</h4>
      <p role="status" className="text-xs text-muted-foreground">
        {t('details.page', { page: current + 1, pages, count })}
      </p>
      <ul className="divide-y">
        {entries.map(({ row, reward }) => (
          <li key={row.id}>
            <Button
              variant="ghost"
              className="h-auto w-full justify-between gap-3 py-3 text-left whitespace-normal"
              data-source-transaction-id={row.id}
              onClick={() => onTransaction(row.id)}
            >
              <span className="min-w-0 break-all">
                {date(row.transactionDate)} · {row.description}
                <span className="block text-xs text-muted-foreground">
                  {money(row.account.minor, row.account.currency)}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">
                {rcSummary(reward.microRc)}
              </span>
            </Button>
          </li>
        ))}
      </ul>
      <DetailPagination current={current} pages={pages} onPage={onPage} />
    </div>
  )
}
