import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { RiCloseLine } from '@remixicon/react'
import { useI18n } from '@/i18n/use-i18n'
import { ActionButton } from './ActionButton'

export function Dialog({
  title,
  children,
  footer,
  onClose,
}: {
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId()
  const { t } = useI18n()
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="app-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <ActionButton variant="ghost" size="icon" onClick={onClose} aria-label={t('action.close')}>
          <RiCloseLine aria-hidden="true" />
        </ActionButton>
      </div>
      <div className="dialog-body">{children}</div>
      {footer && <div className="dialog-footer">{footer}</div>}
    </dialog>
  )
}
