import { useState } from 'react'
import type { ResultDetailsRequest } from '@/application/results/details'
import type { SessionState } from '@/application/session/types'
import type { WorkspaceView } from '@/application/session/selectors'
import { Dialog } from '@/components/workspace/Dialog'
import { DeferredDialogContent } from '@/components/workspace/DeferredDialogContent'
import { useI18n } from '@/i18n/use-i18n'

/** The lightweight shell opens synchronously; the shared boundary loads all detail bodies. */
export function ResultDetailsDialog({
  request,
  session,
  workspace,
  onClose,
}: {
  request: ResultDetailsRequest
  session: SessionState
  workspace: WorkspaceView
  onClose: () => void
}) {
  const { t } = useI18n()
  const [trigger] = useState(() =>
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  )
  return (
    <Dialog
      title={t('details.title')}
      description={t('details.hint')}
      onClose={onClose}
      className="sm:max-w-4xl"
      returnFocus={() =>
        trigger?.isConnected
          ? trigger
          : document.getElementById('cashback-main')
      }
    >
      <DeferredDialogContent>
        {({ ResultDetailsContent }) => (
          <ResultDetailsContent
            request={request}
            session={session}
            workspace={workspace}
          />
        )}
      </DeferredDialogContent>
    </Dialog>
  )
}
