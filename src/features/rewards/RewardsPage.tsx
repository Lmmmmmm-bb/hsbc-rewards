import { RiInformationLine, RiExternalLinkLine } from '@remixicon/react'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import { EmptyState } from '@/components/workspace/EmptyState'
import { PageHeading } from '@/components/workspace/PageHeading'
import { useI18n } from '@/i18n/use-i18n'

export function RewardsPage({
  session,
  view,
  onDemo,
}: {
  session: SessionState
  view: WorkspaceView
  onDemo: () => void
}) {
  const { t, money, number } = useI18n()
  return (
    <div>
      <PageHeading title={t('rewards.title')} description={t('rewards.description')} />
      {!session.dataset.transactions.length ? (
        <EmptyState title={t('rewards.emptyTitle')} body={t('rewards.emptyBody')} onDemo={onDemo} />
      ) : (
        <>
          <div className="workspace-info">
            <RiInformationLine aria-hidden="true" />
            <div>
              <strong>{t('rewards.poolUnconfirmed')}</strong>
              <p>
                {session.fx.source === 'demo'
                  ? t('rewards.fxDemo', { rate: number((session.fx.hkdToCnyPpm ?? 0) / 1000000) })
                  : t('rewards.fxMissing')}
              </p>
              <p>{t('rewards.fxEffect')}</p>
            </div>
          </div>
          <div className="reward-cards">
            {view.rewardCards.map((card) => (
              <article className="surface-panel reward-card" key={card.cardId}>
                <div className="reward-card-heading">
                  <span className="card-symbol" aria-hidden="true">
                    <i />
                  </span>
                  <div>
                    <strong>
                      {t(`card.${card.card.role}`)} · {card.card.lastFour}
                    </strong>
                    <small>{t('rewards.estimate')}</small>
                  </div>
                  {session.mode === 'demo' && (
                    <span className="status-badge">{t('label.demo')}</span>
                  )}
                </div>
                <div className="reward-total amount">{money(card.cnyMinor)}</div>
                <div className="reward-native amount">
                  {card.totalMicroRc === null
                    ? t('rewards.pending')
                    : `${number(card.totalMicroRc / 1000000, 6)} RC`}
                  <span>{t('rewards.original')}</span>
                </div>
                <div className="reward-tier-grid">
                  {(['basic', 'abroad', 'pulse'] as const).map((tier) => (
                    <div key={tier}>
                      <span>{t(`rewards.${tier}`)}</span>
                      <strong className="amount">
                        {card[`${tier}MicroRc`] === null
                          ? t('rewards.pending')
                          : `${number((card[`${tier}MicroRc`] ?? 0) / 1000000, 6)}`}
                      </strong>
                      <small>RC</small>
                    </div>
                  ))}
                </div>
                <div className="cap-list">
                  {card.pools.map((pool) => (
                    <div className="cap-item" key={pool.key}>
                      <div>
                        <strong>{t(`rewards.${pool.tier}`)}</strong>
                        <span>
                          {t(pool.tier === 'abroad' ? 'rewards.annual' : 'rewards.half', {
                            period: pool.period,
                          })}
                        </span>
                      </div>
                      {pool.usedMinor !== null && (
                        <progress
                          value={pool.usedMinor}
                          max={pool.capMinor}
                          aria-label={`${t(`rewards.${pool.tier}`)} ${pool.period}`}
                        />
                      )}
                      <div className="cap-amounts">
                        <span>
                          {t('rewards.remaining')}:{' '}
                          <strong className="amount">
                            {pool.remainingMinor === null
                              ? t('rewards.pending')
                              : number(pool.remainingMinor / 100)}
                          </strong>
                        </span>
                        <small>
                          {t('rewards.used', {
                            used:
                              pool.usedMinor === null
                                ? t('rewards.pending')
                                : number(pool.usedMinor / 100),
                            cap: number(pool.capMinor / 100),
                          })}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <details className="surface-panel rules-details">
        <summary>
          <span>{t('rewards.rules')}</span>
          <span>{t('rewards.readonly', { version: view.rules.id })}</span>
        </summary>
        <div>
          <p className="rules-verified">{t('rewards.date', { date: view.rules.verifiedAt })}</p>
          <ul>
            {(['latest', 'imported', 'refund', 'enrollment'] as const).map((key) => (
              <li key={key}>{t(`rewards.${key}`)}</li>
            ))}
          </ul>
          <div className="rules-sources">
            {view.rules.sources.map((url, index) => (
              <a href={url} key={url} target="_blank" rel="noreferrer">
                {t('rewards.source', { number: index + 1 })}
                <RiExternalLinkLine aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </details>
      <p className="estimate-disclaimer">{t('rewards.disclaimer')}</p>
    </div>
  )
}
