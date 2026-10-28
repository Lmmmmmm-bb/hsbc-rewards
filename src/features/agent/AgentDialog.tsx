import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'
import type { AgentConnectionState } from '@/app/agent-runtime'
import { Dialog } from '@/components/workspace/Dialog'

export function AgentDialog({ status, shared, onGrant, onRevoke, onClose }: {
  status: AgentConnectionState; shared: boolean; onGrant: () => void; onRevoke: () => void; onClose: () => void
}) {
  const { t } = useI18n()
  return (
    <Dialog title={t('agent.dialogTitle')} description={t('agent.dialogHint')} onClose={onClose}
      returnFocus={() => document.querySelector<HTMLElement>('[data-agent-access-trigger]') ?? document.getElementById('cashback-main')}
      footer={<>
        {shared
          ? <Button variant="outline" onClick={onRevoke}>{t('agent.revoke')}</Button>
          : <Button disabled={status !== 'ready'} onClick={onGrant}>{t('agent.allow')}</Button>}
        <Button variant="outline" onClick={onClose}>{t('action.close')}</Button>
      </>}
    >
      <p role="status" className="font-medium">{t(shared ? 'agent.shared' : 'agent.notShared')}</p>
      {status !== 'ready' && <p role="status" className="text-muted-foreground">{t(status === 'idle' ? 'agent.connecting' : 'agent.unsupported')}</p>}
      <p>{t('agent.scope')}</p>
      <p>{t('agent.modelPrivacy')}</p>
      <p className="text-muted-foreground">{t('agent.lifetime')}</p>
      <p className="text-muted-foreground">{t('agent.boundary')}</p>
    </Dialog>
  )
}
