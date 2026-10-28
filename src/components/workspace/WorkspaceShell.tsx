import type { ReactNode } from 'react'
import * as m from 'motion/react-m'
import { RiArrowGoBackLine, RiBookOpenLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'
import { HsbcLogo } from './HsbcLogo'
import { LanguageSwitcher } from './LanguageSwitcher'

export function WorkspaceShell({
  children,
  mode,
  hasData,
  onRules,
  onDemo,
  onClear,
  onPrivacy,
  onAgent,
}: {
  children: ReactNode
  mode: 'empty' | 'demo' | 'real'
  hasData: boolean
  onRules: () => void
  onDemo: () => void
  onClear: () => void
  onPrivacy: () => void
  onAgent: () => void
}) {
  const { t } = useI18n()
  return (
    <div
      data-workspace-shell
      className="relative isolate grid h-svh grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
    >
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
      <header
        data-shell-header
        className="z-10 border-b bg-background/95 backdrop-blur-xs"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <a
            href="#cashback-main"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <HsbcLogo />
            <span data-brand-title className="font-brand text-lg font-medium">
              {t('app.brand')}
            </span>
          </a>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRules}>
              <RiBookOpenLine aria-hidden="true" />
              {t('rules.dialogTitle')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDemo}
              disabled={mode === 'real'}
            >
              {t('cashback.tryExample')}
            </Button>
            {hasData && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                <RiArrowGoBackLine aria-hidden="true" />
                {t('cashback.restart')}
              </Button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <m.main
        layoutScroll
        id="cashback-main"
        tabIndex={-1}
        className="min-h-0 overflow-y-auto overscroll-y-contain outline-none"
      >
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
          {children}
        </div>
      </m.main>
      <footer
        data-shell-footer
        className="z-10 border-t bg-background/95 backdrop-blur-xs"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 text-xs text-muted-foreground sm:px-6">
          <p>{t('footer.independent')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="link" size="sm" onClick={onAgent} data-agent-access-trigger>
              {t('agent.dialogTitle')}
            </Button>
            <Button variant="link" size="sm" onClick={onPrivacy}>
              {t('action.privacy')}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
