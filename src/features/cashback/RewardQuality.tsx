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

  return (
    <section className="space-y-2" aria-label={t('quality.title')}>
      {!compact && <p className="font-medium">{t('quality.title')}</p>}
      <div className="flex flex-wrap gap-2">
        {quality.matchedAccounts > 0 && (
          <Badge variant="outline">
            {t('quality.matched', { count: quality.matchedAccounts })}
          </Badge>
        )}
        {quality.mismatchAccounts > 0 && (
          <Badge>
            {t('quality.mismatch', { count: quality.mismatchAccounts })}
          </Badge>
        )}
        {quality.unverifiedAccounts > 0 && (
          <Badge variant="secondary">
            {t('quality.unverified', { count: quality.unverifiedAccounts })}
          </Badge>
        )}
        {quality.excludedCount > 0 && (
          <Badge variant="secondary">
            {t('quality.excluded', { count: quality.excludedCount })}
          </Badge>
        )}
        {quality.uncertainEligibilityCount > 0 && (
          <Badge variant="secondary">
            {t('quality.uncertain', {
              count: quality.uncertainEligibilityCount,
            })}
          </Badge>
        )}
        {quality.possibleDuplicateCount > 0 && (
          <Badge variant="secondary">
            {t('quality.duplicate', { count: quality.possibleDuplicateCount })}
          </Badge>
        )}
      </div>
      {quality.matchedAccounts +
        quality.mismatchAccounts +
        quality.unverifiedAccounts ===
        0 && <p className="text-muted-foreground">{t('quality.noAccounts')}</p>}
    </section>
  )
}
