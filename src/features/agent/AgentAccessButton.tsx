import { useEffect, useId, useState } from 'react'
import type { AgentConnectionState } from '@/app/agent-runtime'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n/use-i18n'

export function AgentAccessButton({ status, onGrant }: {
  status: AgentConnectionState; onGrant: () => void
}) {
  const { t } = useI18n()
  const tooltipId = useId()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const closeTooltip = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing) return
      event.preventDefault()
      event.stopImmediatePropagation()
      setOpen(false)
    }
    document.addEventListener('keydown', closeTooltip, true)
    return () => document.removeEventListener('keydown', closeTooltip, true)
  }, [open])

  if (status === 'ready') return <Button onClick={onGrant}>{t('agent.allow')}</Button>

  const message = status === 'idle' ? 'agent.allowPreparing'
    : status === 'error' ? 'agent.allowFailed' : 'agent.unsupported'

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          render={<span role="button" tabIndex={0} aria-disabled="true" aria-label={t('agent.allow')} aria-describedby={tooltipId}
            className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-ring" />}
          closeOnClick={false}
          onClick={() => setOpen(true)}
        >
          <Button disabled tabIndex={-1} aria-hidden="true" className="w-full">{t('agent.allow')}</Button>
        </TooltipTrigger>
        <TooltipContent id={tooltipId} role="tooltip" className="max-w-[min(20rem,calc(100vw-2rem))] leading-relaxed">
          {t(message)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
