import {
  RiArrowRightLine,
  RiFileUploadLine,
  RiShieldCheckLine,
  RiListCheck2,
  RiBankCardLine,
} from '@remixicon/react'
import { navigate } from '@/app/routes'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import { ActionButton } from '@/components/workspace/ActionButton'
import { useI18n } from '@/i18n/use-i18n'

export function ImportPage({
  session,
  view,
  onDemo,
}: {
  session: SessionState
  view: WorkspaceView
  onDemo: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="import-page">
      <section className="import-intro">
        <div className="import-copy">
          <div className="eyebrow">{t('import.eyebrow')}</div>
          <h1>{t('import.title')}</h1>
          <p>{t('import.description')}</p>
          <div className="action-row">
            <ActionButton onClick={session.mode === 'empty' ? onDemo : () => navigate('ledger')}>
              {t(session.mode === 'empty' ? 'action.demo' : 'action.ledger')}
              <RiArrowRightLine aria-hidden="true" />
            </ActionButton>
          </div>
          <div className="import-local">
            <RiShieldCheckLine aria-hidden="true" />
            <span>{t('app.local')}</span>
          </div>
        </div>
        <div className="statement-illustration" aria-hidden="true">
          <div className="paper-tab">PULSE</div>
          <div className="paper-document">
            <div className="paper-header">
              <strong>Pulse Rewards</strong>
              <span>HKD / CNY</span>
            </div>
            <div className="paper-line wide" />
            <div className="paper-line medium" />
            <div className="paper-account">
              <span>{t('balance.opening')}</span>
              <strong>—</strong>
            </div>
            <div className="paper-account">
              <span>{t('balance.debit')}</span>
              <strong>—</strong>
            </div>
            <div className="paper-account">
              <span>{t('balance.credit')}</span>
              <strong>—</strong>
            </div>
            <div className="paper-total">
              <span>{t('balance.closing')}</span>
              <strong>—</strong>
            </div>
            <div className="paper-line medium" />
            <div className="paper-line short" />
          </div>
          <div className="paper-check">
            <RiShieldCheckLine />
            {t('app.local')}
          </div>
        </div>
      </section>
      <section className="import-drop">
        <div className="upload-mark">
          <RiFileUploadLine aria-hidden="true" />
        </div>
        <div>
          <h2>{t('import.dropTitle')}</h2>
          <p>{t('import.dropBody')}</p>
          <span className="limit-label">{t('import.limit')}</span>
        </div>
      </section>
      <div className="privacy-note">
        <RiShieldCheckLine aria-hidden="true" />
        <p>{t('import.privacy')}</p>
      </div>
      {session.dataset.statements.length > 0 && (
        <section className="surface-panel current-files">
          <div className="section-heading">
            <h2>{t('import.files')}</h2>
            <span>
              {t('import.coverage', {
                files: session.dataset.statements.length,
                transactions: session.dataset.transactions.length,
              })}
            </span>
          </div>
          {view.reports.map(({ statement, accounts }) => (
            <div className="statement-row" key={statement.id}>
              <div className="file-symbol">
                <RiFileUploadLine aria-hidden="true" />
              </div>
              <div className="file-description">
                <strong>{statement.fileName}</strong>
                <span>
                  {t('import.pages', { pages: statement.pageCount })}
                  {session.mode === 'demo' ? ` · ${t('import.synthetic')}` : ''}
                </span>
              </div>
              <span
                className={`status-badge ${accounts.some((account) => account.status === 'mismatch') ? 'is-warning' : ''}`}
              >
                {t(
                  accounts.some((account) => account.status === 'mismatch')
                    ? 'status.mismatch'
                    : 'status.matched',
                )}
              </span>
            </div>
          ))}
        </section>
      )}
      <div className="feature-columns">
        {(
          [
            { key: 'ledger', Icon: RiListCheck2 },
            { key: 'balance', Icon: RiShieldCheckLine },
            { key: 'rewards', Icon: RiBankCardLine },
          ] as const
        ).map(({ key, Icon }) => (
          <section key={key}>
            <Icon aria-hidden="true" />
            <h2>{t(`feature.${key}`)}</h2>
            <p>{t(`feature.${key}Body`)}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
