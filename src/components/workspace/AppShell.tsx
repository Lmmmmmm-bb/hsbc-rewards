import type { ReactNode } from 'react'
import {
  RiBankCardLine,
  RiFileUploadLine,
  RiListCheck2,
  RiSettings3Line,
  RiShieldCheckLine,
  RiArrowRightLine,
} from '@remixicon/react'
import { pageIds } from '@/app/routes'
import type { PageId } from '@/app/routes'
import type { SessionState } from '@/application/session/types'
import { useI18n } from '@/i18n/use-i18n'

const icons = {
  import: RiFileUploadLine,
  ledger: RiListCheck2,
  rewards: RiBankCardLine,
  settings: RiSettings3Line,
}

export function AppShell({
  page,
  session,
  onDemo,
  onClear,
  onPrivacy,
  children,
}: {
  page: PageId
  session: SessionState
  onDemo: () => void
  onClear: () => void
  onPrivacy: () => void
  children: ReactNode
}) {
  const { t } = useI18n()
  const nav = pageIds.map((id) => {
    const Icon = icons[id]
    return (
      <a
        key={id}
        href={`#/${id}`}
        className="workspace-navlink"
        aria-current={page === id ? 'page' : undefined}
        data-page-id={id}
      >
        <Icon aria-hidden="true" />
        <span>{t(`nav.${id}`)}</span>
      </a>
    )
  })
  return (
    <div className="workspace-shell">
      <button
        className="skip-link"
        onClick={() => document.getElementById('workspace-main')?.focus()}
      >
        {t('action.skip')}
      </button>
      <aside className="workspace-sidebar">
        <a className="workspace-brand" href="#/import">
          <span className="brand-symbol">
            P<span />
          </span>
          <span>
            Pulse Rewards<small>{t('nav.workspace')}</small>
          </span>
        </a>
        <div className="workspace-navtitle">{t('app.title')}</div>
        <nav aria-label={t('nav.workspace')}>{nav}</nav>
        <div className="sidebar-local">
          <RiShieldCheckLine aria-hidden="true" />
          <strong>{t('app.local')}</strong>
          <p>{t('footer.memory')}</p>
          <button className="text-action" onClick={onPrivacy}>
            {t('action.privacy')}
            <RiArrowRightLine aria-hidden="true" />
          </button>
        </div>
      </aside>
      <div className="workspace-content">
        <header className="workspace-header">
          <div className="header-location">
            <span className="mobile-brand">Pulse Rewards</span>
            <span className="desktop-location">
              {t('nav.workspace')}
              <span aria-hidden="true">/</span>
              {t(`nav.${page}`)}
            </span>
          </div>
          <div className="header-actions">
            <span className="session-pill">
              <i aria-hidden="true" />
              {session.mode === 'demo' ? t('demo.label') : t('app.memory')}
            </span>
            <span className="preview-pill">{t('app.preview')}</span>
          </div>
        </header>
        <nav className="mobile-navigation" aria-label={t('nav.workspace')}>
          {nav}
        </nav>
        {session.mode === 'demo' && (
          <div className="demo-notice" role="status">
            <span className="demo-tag">{t('label.demo')}</span>
            <span>{t('demo.notice')}</span>
            <button onClick={onClear}>{t('action.exitDemo')}</button>
          </div>
        )}
        <main id="workspace-main" tabIndex={-1} className="workspace-main">
          {children}
        </main>
        <footer className="workspace-footer">
          <span>
            <RiShieldCheckLine aria-hidden="true" />
            {t('footer.independent')}
          </span>
          <button className="text-action" onClick={onPrivacy}>
            {t('action.privacy')}
          </button>
          <span className="session-count">
            {t('app.session', {
              files: session.dataset.statements.length,
              transactions: session.dataset.transactions.length,
            })}
          </span>
          {session.mode === 'empty' && (
            <button className="text-action" onClick={onDemo}>
              {t('action.demo')}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
