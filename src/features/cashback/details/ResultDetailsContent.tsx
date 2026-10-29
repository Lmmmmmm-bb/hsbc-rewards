import { useLayoutEffect, useRef, useState } from 'react'
import type { ResultDetailsRequest } from '@/application/results/details'
import { selectResultScope } from '@/application/results/scope'
import { selectTransactions } from '@/application/results/transactions'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePdfImport } from '@/store/use-pdf-import'
import { useI18n } from '@/i18n/use-i18n'
import { TransactionList } from './TransactionList'
import { TransactionDetails } from './TransactionDetails'
import { initialNavigation, synchronizeNavigation } from './navigation'

export function ResultDetailsContent({
  request,
  session,
  workspace,
}: {
  request: ResultDetailsRequest
  session: SessionState
  workspace: WorkspaceView
}) {
  const { t } = useI18n()
  const { batch } = usePdfImport()
  const host = useRef<HTMLDivElement>(null)
  const listPosition = useRef({ scroll: 0, focusId: '', restore: false })
  const [stored, set] = useState(() => initialNavigation(request, session))
  const state = synchronizeNavigation(stored, session)
  if (state !== stored) set(state)
  const periodExists =
    !request.periodId ||
    request.periodId === 'all' ||
    workspace.periods.some((period) => period.id === request.periodId)
  const scope = selectResultScope(session, workspace, {
    periodId: periodExists ? request.periodId : 'all',
  })
  const entry = state.transactionId
    ? selectTransactions(scope).find(
        ({ row }) => row.id === state.transactionId,
      )
    : undefined

  useLayoutEffect(() => {
    const region = host.current?.querySelector<HTMLElement>(
      '[data-details-scroll] [role="region"]',
    )
    if (state.transactionId) {
      if (region) region.scrollTop = 0
      host.current
        ?.querySelector<HTMLElement>('[data-detail-heading]')
        ?.focus({ preventScroll: true })
    } else if (listPosition.current.restore) {
      listPosition.current.restore = false
      const item = [
        ...(host.current?.querySelectorAll<HTMLElement>(
          '[data-transaction-id]',
        ) ?? []),
      ].find(
        (element) =>
          element.dataset.transactionId === listPosition.current.focusId,
      )
      item?.focus({ preventScroll: true })
      if (region) region.scrollTop = listPosition.current.scroll
    } else if (region) region.scrollTop = 0
  }, [
    state.transactionId,
    state.page,
    state.cardId,
    state.filter,
    state.dataset,
    state.fxIdentity,
  ])

  if (!periodExists) return <p>{t('details.objectMissing')}</p>
  return (
    <div
      ref={host}
      className="flex min-h-0 flex-1 flex-col gap-3"
      data-result-details
    >
      <p className="shrink-0 text-xs text-muted-foreground">
        {t('details.scope')} ·{' '}
        {scope.period
          ? t(scope.period.half === 1 ? 'period.h1' : 'period.h2', {
              year: scope.period.year,
            })
          : t('period.all')}
      </p>
      {state.updated && (
        <p role="status" className="shrink-0 text-xs">
          {t('details.updated')}
        </p>
      )}
      {batch.active && (
        <p role="status" className="shrink-0 text-xs">
          {t('basis.pendingImport')}
        </p>
      )}
      {state.transactionId ? (
        <>
          <div className="flex shrink-0 items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                listPosition.current.restore = true
                set({ ...state, transactionId: null })
              }}
            >
              {t('details.back')}
            </Button>
            {entry && (
              <Badge variant="outline">
                {t(`details.kind.${entry.row.classification.kind}`)}
              </Badge>
            )}
          </div>
          <ScrollArea
            className="min-h-0 flex-1"
            data-details-scroll
            viewportProps={{
              role: 'region',
              'aria-label': t('details.transactionInfo'),
              tabIndex: 0,
              className: 'overscroll-y-contain',
            }}
          >
            <div className="pr-3 text-sm leading-relaxed">
              {entry ? (
                <TransactionDetails
                  entry={entry}
                  statements={session.dataset.statements}
                />
              ) : (
                <p>{t('details.objectMissing')}</p>
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <TransactionList
          scope={scope}
          cardId={state.cardId}
          filter={state.filter}
          page={state.page}
          resultVersion={`${session.revision}:${state.fxIdentity}`}
          onCard={(cardId) => set({ ...state, cardId, page: 0 })}
          onFilter={(filter) => set({ ...state, filter, page: 0 })}
          onPage={(page) => set({ ...state, page })}
          onSelect={(id) => {
            listPosition.current = {
              scroll:
                host.current?.querySelector<HTMLElement>(
                  '[data-details-scroll] [role="region"]',
                )?.scrollTop ?? 0,
              focusId: id,
              restore: false,
            }
            set({ ...state, transactionId: id })
          }}
        />
      )}
      <aside
        data-detail-footnote
        className="shrink-0 border-t pt-3 text-xs leading-relaxed text-muted-foreground"
      >
        <p>{t('details.note.transactions')}</p>
      </aside>
    </div>
  )
}
