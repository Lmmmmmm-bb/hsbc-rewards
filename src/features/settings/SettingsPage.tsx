import { RiArrowRightLine } from '@remixicon/react'
import { usePreferences } from '@/app/preferences-context'
import type { Density, Theme } from '@/app/preferences-context'
import type { SessionState } from '@/application/session/types'
import { PageHeading } from '@/components/workspace/PageHeading'
import { ActionButton } from '@/components/workspace/ActionButton'
import { useI18n } from '@/i18n/use-i18n'
import type { Locale } from '@/i18n/context'

export function SettingsPage({
  session,
  onClear,
  onPrivacy,
}: {
  session: SessionState
  onClear: () => void
  onPrivacy: () => void
}) {
  const { t, locale, setLocale } = useI18n(),
    { theme, setTheme, density, setDensity } = usePreferences()
  return (
    <div className="settings-page">
      <PageHeading title={t('settings.title')} description={t('settings.description')} />
      <section className="surface-panel settings-panel">
        <h2>{t('settings.appearance')}</h2>
        <div className="settings-row">
          <label htmlFor="app-language">
            <strong>{t('settings.language')}</strong>
            <span>{t('settings.languageHint')}</span>
          </label>
          <select
            id="app-language"
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
          >
            <option value="zh-CN">{t('settings.chinese')}</option>
            <option value="en-HK">{t('settings.english')}</option>
          </select>
        </div>
        <div className="settings-row">
          <label htmlFor="app-theme">
            <strong>{t('settings.theme')}</strong>
            <span>{t('settings.themeHint')}</span>
          </label>
          <select
            id="app-theme"
            value={theme}
            onChange={(event) => setTheme(event.target.value as Theme)}
          >
            {(['system', 'light', 'dark'] as const).map((option) => (
              <option key={option} value={option}>
                {t(`settings.${option}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="settings-row">
          <label htmlFor="app-density">
            <strong>{t('settings.density')}</strong>
            <span>{t('settings.densityHint')}</span>
          </label>
          <select
            id="app-density"
            value={density}
            onChange={(event) => setDensity(event.target.value as Density)}
          >
            {(['standard', 'compact'] as const).map((option) => (
              <option key={option} value={option}>
                {t(`settings.${option}`)}
              </option>
            ))}
          </select>
        </div>
      </section>
      <section className="surface-panel settings-panel">
        <h2>{t('settings.data')}</h2>
        <p>{t('settings.dataHint')}</p>
        <div className="settings-row">
          <div>
            <strong>{t('action.clear')}</strong>
            <span>{t('settings.clearHint')}</span>
          </div>
          <ActionButton
            variant="outline"
            onClick={onClear}
            disabled={!session.dataset.statements.length}
          >
            {t('action.clear')}
          </ActionButton>
        </div>
        <div className="settings-row">
          <div>
            <strong>{t('settings.privacy')}</strong>
            <span>{t('app.local')}</span>
          </div>
          <ActionButton variant="ghost" onClick={onPrivacy}>
            {t('action.privacy')}
            <RiArrowRightLine aria-hidden="true" />
          </ActionButton>
        </div>
      </section>
    </div>
  )
}
