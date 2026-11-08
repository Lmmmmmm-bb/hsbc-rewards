import type { WorkspaceView } from '@/application/session/selectors'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/i18n/use-i18n'

export function RewardQuality({
  quality,
  compact = false,
}: {
  quality: WorkspaceView['quality']
  compact?: boolean
}) {
  const { t } = useI18n()
  const items = [
    ['mismatchAccounts', 'quality.mismatch'],
    ['unverifiedAccounts', 'quality.unverified'],
    ['uncertainEligibilityCount', 'quality.uncertain'],
    ['possibleDuplicateCount', 'quality.duplicate'],
  ] as const
  const visibleItems = items.filter(([key]) => quality[key] > 0)
  const noAccounts = quality.matchedAccounts + quality.mismatchAccounts + quality.unverifiedAccounts === 0
  if (!visibleItems.length && !noAccounts) return null
  return (
    <section className="space-y-2" aria-label={t('quality.title')}>
      {!compact && <p className="font-medium">{t('quality.title')}</p>}
      <div className="flex flex-wrap gap-2">
        {visibleItems
          .map(([key, label]) => (
            <Badge key={key} variant="outline">
              {t(label, { count: quality[key] })}
            </Badge>
          ))}
      </div>
      {noAccounts && <p className="text-muted-foreground">{t('quality.noAccounts')}</p>}
    </section>
  )
}
