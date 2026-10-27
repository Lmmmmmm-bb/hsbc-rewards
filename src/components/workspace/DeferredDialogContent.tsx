import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'
import { ErrorNotice } from './ErrorNotice'

type Contents = typeof import('@/app/DialogContents')
type ContentState =
  | { status: 'loading' | 'error' }
  | { status: 'ready'; contents: Contents }

// Cache only component code. Session data and dialog props stay in React.
let contents: Contents | undefined
let pending: Promise<Contents> | undefined

function loadContents(): Promise<Contents> {
  pending ??= import('@/app/DialogContents').then(
    (loaded) => {
      contents = loaded
      return loaded
    },
    (error: unknown) => {
      pending = undefined
      throw error
    },
  )
  return pending
}

export function DeferredDialogContent({
  children,
}: {
  children: (contents: Contents) => ReactNode
}) {
  const { t } = useI18n()
  const host = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<ContentState>(() =>
    contents ? { status: 'ready', contents } : { status: 'loading' },
  )
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    void loadContents().then(
      (loaded) => {
        if (current) setState({ status: 'ready', contents: loaded })
      },
      () => {
        if (current) setState({ status: 'error' })
      },
    )
    return () => {
      current = false
    }
  }, [attempt])

  return (
    <div ref={host} data-dialog-content-state={state.status}>
      {state.status === 'ready' ? (
        children(state.contents)
      ) : state.status === 'loading' ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t('dialogContent.loading')}
        </p>
      ) : (
        <ErrorNotice title={t('dialogContent.failed')}>
          <p>{t('dialogContent.retained')}</p>
          <Button
            variant="outline"
            onClick={() => {
              // The retry button is about to disappear; retain focus in the
              // existing dialog region instead of dropping it onto the page.
              host.current
                ?.closest<HTMLElement>('[role="region"]')
                ?.focus({ preventScroll: true })
              setState({ status: 'loading' })
              setAttempt((value) => value + 1)
            }}
          >
            {t('dialogContent.retry')}
          </Button>
        </ErrorNotice>
      )}
    </div>
  )
}
