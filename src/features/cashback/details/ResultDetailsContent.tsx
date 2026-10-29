import { useLayoutEffect, useRef, useState } from 'react'
import type {
  ResultDetailsRequest,
  DetailTab,
} from '@/application/results/details'
import { selectResultScope } from '@/application/results/scope'
import { selectTransactions } from '@/application/results/transactions'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import { DialogTabsList, DialogTab } from '@/components/workspace/DialogTabs'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { usePdfImport } from '@/store/use-pdf-import'
import { useI18n } from '@/i18n/use-i18n'
import { CalculationDetails } from './CalculationDetails'
import { TransactionList } from './TransactionList'
import { TransactionDetails } from './TransactionDetails'
import { StatementDetails } from './StatementDetails'
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
  const listPosition = useRef({ scroll: 0, focusId: '' })
  const sourcePosition = useRef({ scroll: 0, focusId: '', restore: false })
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
  const cardExists =
    !state.cardId || scope.cards.some((card) => card.cardId === state.cardId)
  const selectedScope = cardExists
    ? selectResultScope(session, workspace, {
        periodId: scope.periodId,
        cardId: state.cardId,
      })
    : null
  const entry = state.transactionId
    ? selectTransactions(selectResultScope(session, workspace)).find(
        ({ row }) => row.id === state.transactionId,
      )
    : undefined
  const tabs: readonly DetailTab[] = [
    'calculation',
    'transactions',
    'statements',
  ]

  useLayoutEffect(() => {
    if (sourcePosition.current.restore && state.statementId) {
      sourcePosition.current.restore = false
      const item = [
        ...(host.current?.querySelectorAll<HTMLElement>(
          '[data-source-transaction-id]',
        ) ?? []),
      ].find(
        (element) =>
          element.dataset.sourceTransactionId ===
          sourcePosition.current.focusId,
      )
      item?.focus({ preventScroll: true })
      const region = host.current?.closest<HTMLElement>('[role="region"]')
      if (region) region.scrollTop = sourcePosition.current.scroll
      return
    }
    const heading = host.current?.querySelector<HTMLElement>(
      '[data-detail-heading]',
    )
    if (heading) heading.focus({ preventScroll: false })
    else if (
      state.tab === 'transactions' &&
      !state.transactionId &&
      !state.statementId &&
      listPosition.current.focusId
    ) {
      const item = [
        ...(host.current?.querySelectorAll<HTMLElement>(
          '[data-transaction-id]',
        ) ?? []),
      ].find(
        (element) =>
          element.dataset.transactionId === listPosition.current.focusId,
      )
      item?.focus({ preventScroll: true })
      const region = host.current?.closest<HTMLElement>('[role="region"]')
      if (region) region.scrollTop = listPosition.current.scroll
    }
  }, [state.transactionId, state.statementId, state.tab])

  if (!periodExists) return <p>{t('details.objectMissing')}</p>
  return (
    <div ref={host} className="space-y-4" data-result-details>
      <p className="text-xs text-muted-foreground">
        {t('details.scope')} ·{' '}
        {scope.period
          ? t(scope.period.half === 1 ? 'period.h1' : 'period.h2', {
              year: scope.period.year,
            })
          : t('period.all')}
      </p>
      {state.updated && (
        <p role="status" className="text-xs">
          {t('details.updated')}
        </p>
      )}
      {batch.active && (
        <p role="status" className="text-xs">
          {t('basis.pendingImport')}
        </p>
      )}
      <Tabs
        className="gap-4"
        value={state.tab}
        onValueChange={(value) =>
          set({
            ...state,
            tab: value as DetailTab,
            transactionId: null,
            statementId: null,
            returnTransactionId: null,
            returnStatementId: null,
          })
        }
      >
        <DialogTabsList aria-label={t('details.title')}>
          {tabs.map((tab) => (
            <DialogTab key={tab} value={tab}>
              {t(`details.tab.${tab}`)}
            </DialogTab>
          ))}
        </DialogTabsList>
        <TabsContent value="calculation" className="text-sm">
          {selectedScope ? (
            <CalculationDetails scope={selectedScope} />
          ) : (
            <p>{t('details.objectMissing')}</p>
          )}
        </TabsContent>
        <TabsContent value="transactions" className="text-sm">
          {state.transactionId ? (
            entry ? (
              <>
                {!scope.rows.some((row) => row.id === entry.row.id) && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {t('details.outsideScope')}
                  </p>
                )}
                <TransactionDetails
                  entry={entry}
                  statements={session.dataset.statements}
                  onBack={() => {
                    sourcePosition.current.restore = Boolean(
                      state.returnStatementId,
                    )
                    set({
                      ...state,
                      transactionId: null,
                      statementId: state.returnStatementId,
                      tab: state.returnStatementId
                        ? 'statements'
                        : 'transactions',
                      returnStatementId: null,
                    })
                  }}
                  onStatement={(id) =>
                    set({
                      ...state,
                      tab: 'statements',
                      statementId: id,
                      sourcePage: 0,
                      returnTransactionId: state.transactionId,
                      transactionId: null,
                    })
                  }
                />
              </>
            ) : (
              <p>{t('details.objectMissing')}</p>
            )
          ) : (
            <TransactionList
              scope={scope}
              cardId={state.cardId}
              filter={state.filter}
              page={state.page}
              onCard={(cardId) => set({ ...state, cardId, page: 0 })}
              onFilter={(filter) => set({ ...state, filter, page: 0 })}
              onPage={(page) => set({ ...state, page })}
              onSelect={(id) => {
                listPosition.current = {
                  scroll:
                    host.current?.closest<HTMLElement>('[role="region"]')
                      ?.scrollTop ?? 0,
                  focusId: id,
                }
                set({ ...state, transactionId: id })
              }}
            />
          )}
        </TabsContent>
        <TabsContent value="statements" className="text-sm">
          {selectedScope ? (
            <StatementDetails
              scope={selectedScope}
              session={session}
              workspace={workspace}
              statementId={state.statementId}
              status={request.reconciliation}
              page={state.sourcePage}
              onPage={(sourcePage) => set({ ...state, sourcePage })}
              onSelect={(id) =>
                set({
                  ...state,
                  statementId: id,
                  sourcePage: 0,
                  returnTransactionId: null,
                })
              }
              onBack={() =>
                set({
                  ...state,
                  statementId: null,
                  transactionId: state.returnTransactionId,
                  tab: state.returnTransactionId
                    ? 'transactions'
                    : 'statements',
                  returnTransactionId: null,
                })
              }
              onTransaction={(id) => {
                sourcePosition.current = {
                  scroll:
                    host.current?.closest<HTMLElement>('[role="region"]')
                      ?.scrollTop ?? 0,
                  focusId: id,
                  restore: false,
                }
                set({
                  ...state,
                  tab: 'transactions',
                  transactionId: id,
                  returnStatementId: state.statementId,
                  statementId: null,
                })
              }}
            />
          ) : (
            <p>{t('details.objectMissing')}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
