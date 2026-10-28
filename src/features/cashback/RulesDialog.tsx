import type { WorkspaceView } from '@/application/session/selectors'
import { Dialog } from '@/components/workspace/Dialog'
import { useI18n } from '@/i18n/use-i18n'
import { DeferredDialogContent } from '@/components/workspace/DeferredDialogContent'

export function RulesDialog({
  rules,
  onClose,
}: {
  rules: WorkspaceView['rules']
  onClose: () => void
}) {
  const { t } = useI18n()

  return (
    <Dialog
      title={t('rules.dialogTitle')}
      onClose={onClose}
      className="sm:max-w-4xl"
    >
      <DeferredDialogContent>
        {({ RewardRules }) => <RewardRules rules={rules} />}
      </DeferredDialogContent>
    </Dialog>
  )
}
