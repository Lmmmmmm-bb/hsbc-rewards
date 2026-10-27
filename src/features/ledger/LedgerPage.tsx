import { RiAlertLine } from '@remixicon/react'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import { EmptyState } from '@/components/workspace/EmptyState'
import { PageHeading } from '@/components/workspace/PageHeading'
import { useI18n } from '@/i18n/use-i18n'

export function LedgerPage({
  session,
  view,
  onDemo,
}: {
  session: SessionState
  view: WorkspaceView
  onDemo: () => void
}) {
  const { t, money, date } = useI18n()
  const { dataset } = session
  return (
    <div>
      <PageHeading title={t('ledger.title')} description={t('ledger.description')} />
      {!dataset.transactions.length ? (
        <EmptyState title={t('ledger.emptyTitle')} body={t('ledger.emptyBody')} onDemo={onDemo} />
      ) : (
        <>
          {view.mismatchCount > 0 && (
            <div className="workspace-alert" role="status">
              <RiAlertLine aria-hidden="true" />
              <span>{t('ledger.mismatch', { count: view.mismatchCount })}</span>
            </div>
          )}
          <div className="summary-grid">
            <section className="summary-card">
              <span>{t('ledger.spending')}</span>
              <strong className="amount">{money(view.spendCnyMinor)}</strong>
              <div className="summary-sub amount">{money(view.spendHkdMinor, 'HKD')}</div>
              <small>
                {t('ledger.expenses', { count: view.expenseCount, cards: dataset.cards.length })}
              </small>
            </section>
            <section className="summary-card">
              <span>{t('ledger.cashback')}</span>
              <strong className="amount">{money(view.totalRewardCnyMinor)}</strong>
              <div className="summary-sub">{t('ledger.tiers')}</div>
              <small>{t('rewards.disclaimer')}</small>
            </section>
            <section className="summary-card">
              <span>{t('ledger.pools')}</span>
              <strong>{t('ledger.poolCount', { count: dataset.cards.length })}</strong>
              <div className="summary-sub">{t('rewards.poolUnconfirmed')}</div>
              <small>{t('ledger.poolHint')}</small>
            </section>
          </div>
          <section className="surface-panel ledger-panel">
            <div className="section-heading">
              <h2>{t('ledger.rows')}</h2>
              <span>{t('ledger.count', { count: dataset.transactions.length })}</span>
            </div>
            <div className="ledger-table-scroll">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t('ledger.posted')}</th>
                    <th>{t('ledger.card')}</th>
                    <th>{t('ledger.merchant')}</th>
                    <th className="numeric">{t('ledger.original')}</th>
                    <th className="numeric">{t('ledger.account')}</th>
                    <th>{t('ledger.confidence')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.transactions.map((row) => {
                    const card = dataset.cards.find((card) => card.id === row.cardId)
                    return (
                      <tr key={row.id}>
                        <td>
                          <span>{date(row.postingDate)}</span>
                          <small>
                            {t('ledger.transactionDate', { date: date(row.transactionDate) })}
                          </small>
                        </td>
                        <td>
                          <span>{t(`card.${card?.role ?? 'unknown'}`)}</span>
                          <small className="amount">·· {card?.lastFour}</small>
                        </td>
                        <td>
                          <span className="merchant-name">{row.description}</span>
                          <small>{t(`category.${row.classification.category}`)}</small>
                        </td>
                        <td className="numeric amount">
                          {money(row.original.minor, row.original.currency)}
                        </td>
                        <td className="numeric amount">
                          {money(row.account.minor, row.account.currency)}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${row.confidence < 0.85 ? 'is-warning' : ''}`}
                          >
                            {t(
                              row.confidence >= 0.85
                                ? 'confidence.high'
                                : row.confidence >= 0.65
                                  ? 'confidence.medium'
                                  : 'confidence.low',
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mobile-ledger">
              {dataset.transactions.map((row) => (
                <article className="mobile-transaction" key={row.id}>
                  <div>
                    <strong>{row.description}</strong>
                    <span className="amount">{money(row.account.minor, row.account.currency)}</span>
                  </div>
                  <p>
                    {date(row.postingDate)} · {t(`category.${row.classification.category}`)}
                    <span>
                      {t(
                        row.confidence >= 0.85
                          ? 'confidence.high'
                          : row.confidence >= 0.65
                            ? 'confidence.medium'
                            : 'confidence.low',
                      )}
                    </span>
                  </p>
                  <small>
                    {t('ledger.original')}: {money(row.original.minor, row.original.currency)}
                  </small>
                </article>
              ))}
            </div>
          </section>
          <section className="balance-section">
            <div className="section-heading">
              <h2>{t('balance.title')}</h2>
            </div>
            <div className="balance-grid">
              {view.reports.flatMap((report) =>
                report.accounts.map((account) => (
                  <article
                    className="surface-panel balance-card"
                    key={`${report.statement.id}-${account.accountId}`}
                  >
                    <div className="balance-heading">
                      <strong>{account.currency}</strong>
                      <span
                        className={`status-badge ${account.status === 'mismatch' ? 'is-warning' : ''}`}
                      >
                        {t(`status.${account.status}`)}
                      </span>
                    </div>
                    <p className="balance-file">{report.statement.fileName}</p>
                    <dl>
                      {(
                        ['opening', 'debit', 'credit', 'expected', 'closing', 'delta'] as const
                      ).map((key) => (
                        <div key={key} className={key === 'delta' ? 'balance-final' : ''}>
                          <dt>{t(`balance.${key}`)}</dt>
                          <dd className="amount">
                            {money(account[`${key}Minor`], account.currency)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                )),
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
