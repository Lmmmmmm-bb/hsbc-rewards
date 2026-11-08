import type { ReactNode } from 'react'
import * as m from 'motion/react-m'
import {
  RiArrowGoBackLine,
  RiBookOpenLine,
  RiGithubLine,
  RiFileListLine,
  RiRobotLine,
  RiShieldCheckLine,
} from '@remixicon/react'
import { Button, buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useI18n } from '@/i18n/use-i18n'
import { HsbcLogo } from './HsbcLogo'
import { LanguageSwitcher } from './LanguageSwitcher'

export function WorkspaceShell({
  children,
  mode,
  hasData,
  onDemo,
  onRules,
  onClear,
  onPrivacy,
  onAgent,
}: {
  children: ReactNode
  mode: 'empty' | 'demo' | 'real'
  hasData: boolean
  onDemo: () => void
  onRules: () => void
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_9px_9px,var(--muted-foreground)_0.8px,transparent_0.8px),radial-gradient(circle_at_9px_9px,var(--muted-foreground)_0.8px,transparent_0.8px)] bg-size-[18px_36px] bg-position-[0_0,9px_18px] opacity-15" />
      </div>
      <Button
        variant="outline"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        onClick={() =>
          document
            .querySelector<HTMLElement>(
              '[data-shell-scroll] [data-slot="scroll-area-viewport"]',
            )
            ?.focus()
        }
      >
        {t('action.skip')}
      </Button>
      <header
        data-shell-header
        className="z-10 border-b bg-background/95 backdrop-blur-xs"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <a
            href="#cashback-main"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <HsbcLogo />
            <span data-brand-title className="font-sans text-lg font-semibold tracking-normal">
              {t('app.brand')}
            </span>
          </a>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button variant="outline" size="sm" className="size-7 p-0 sm:w-auto sm:px-2" onClick={onRules}>
              <RiBookOpenLine className="size-3" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t('rules.dialogTitle')}</span>
            </Button>
            {mode === 'empty' && !hasData && (
              <Button variant="ghost" size="sm" className="size-7 p-0 sm:w-auto sm:px-2" onClick={onDemo}>
                <RiFileListLine className="size-3 sm:hidden" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">{t('cashback.tryExample')}</span>
              </Button>
            )}
            {hasData && (
              <Button variant="ghost" size="sm" className="size-7 p-0 sm:w-auto sm:px-2" onClick={onClear}>
                <RiArrowGoBackLine className="size-3" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">{t('cashback.restart')}</span>
              </Button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main
        id="cashback-main"
        tabIndex={-1}
        className="min-h-0 overflow-hidden outline-none"
      >
        <ScrollArea
          className="h-full"
          data-shell-scroll
          viewportProps={{
            render: <m.div layoutScroll />,
            tabIndex: 0,
            className: 'overscroll-y-contain',
          }}
        >
          <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
            {children}
          </div>
        </ScrollArea>
      </main>
      <footer
        data-shell-footer
        className="z-10 border-t bg-background/95 backdrop-blur-xs"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-xs text-muted-foreground sm:px-6">
          <p className="flex min-h-7 min-w-0 flex-1 items-center">{t('footer.independent')}</p>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              variant="link"
              size="sm"
              onClick={onAgent}
              data-agent-access-trigger
              className="size-7 p-0 sm:w-auto sm:px-2"
            >
              <RiRobotLine className="size-3 sm:hidden" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t('agent.dialogTitle')}</span>
            </Button>
            <Button variant="link" size="sm" className="size-7 p-0 sm:w-auto sm:px-2" onClick={onPrivacy}>
              <RiShieldCheckLine className="size-3 sm:hidden" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t('action.privacy')}</span>
            </Button>
            <a
              className={buttonVariants({ variant: 'link', size: 'sm', className: 'size-7 p-0 sm:w-auto sm:px-2' })}
              href="https://github.com/Lmmmmmm-bb/hsbc-rewards"
              target="_blank"
              rel="noopener noreferrer"
            >
              <RiGithubLine className="size-3" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t('footer.github')}</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
