import { RiFileUploadLine, RiArrowRightLine } from '@remixicon/react'
import { useI18n } from '@/i18n/use-i18n'
import { ActionButton } from './ActionButton'
import { navigate } from '@/app/routes'

export function EmptyState({
  title,
  body,
  onDemo,
}: {
  title: string
  body: string
  onDemo: () => void
}) {
  const { t } = useI18n()
  return (
    <section className="workspace-empty">
      <div className="empty-mark">
        <RiFileUploadLine aria-hidden="true" />
      </div>
      <h2>{title}</h2>
      <p>{body}</p>
      <div className="action-row">
        <ActionButton onClick={() => navigate('import')}>
          {t('action.import')}
          <RiArrowRightLine aria-hidden="true" />
        </ActionButton>
        <ActionButton variant="outline" onClick={onDemo}>
          {t('action.demo')}
        </ActionButton>
      </div>
    </section>
  )
}
