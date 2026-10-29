import type { WorkspaceView } from '@/application/session/selectors'
import type { ResultDetailsRequest } from '@/application/results/details'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'

export function RewardQuality({
  quality,
  compact = false,
  onDetails,
}: {
  quality: WorkspaceView['quality']
  compact?: boolean
  onDetails?: (request: ResultDetailsRequest) => void
}) {
  const { t } = useI18n()
  const items = [
    ['matchedAccounts', 'quality.matched', { tab: 'statements' }],
    [
      'mismatchAccounts',
      'quality.mismatch',
      { tab: 'statements', reconciliation: 'mismatch' },
    ],
    [
      'unverifiedAccounts',
      'quality.unverified',
      { tab: 'statements', reconciliation: 'unverified' },
    ],
    [
      'excludedCount',
      'quality.excluded',
      { tab: 'transactions', component: 'basic', flags: ['excluded'] },
    ],
    [
      'uncertainEligibilityCount',
      'quality.uncertain',
      { tab: 'transactions', flags: ['uncertain'] },
    ],
    [
      'possibleDuplicateCount',
      'quality.duplicate',
      { tab: 'transactions', warning: 'transaction.possible-duplicate' },
    ],
  ] as const
  return (
    <section className="space-y-2" aria-label={t('quality.title')}>
      {!compact && <p className="font-medium">{t('quality.title')}</p>}
      <div className="flex flex-wrap gap-2">
        {items
          .filter(([key]) => quality[key] > 0)
          .map(([key, label, request]) =>
            onDetails ? (
              <Button
                key={key}
                variant="outline"
                size="sm"
                className="h-auto py-1 whitespace-normal"
                onClick={() => onDetails(request)}
                aria-haspopup="dialog"
              >
                {t(label, { count: quality[key] })}
              </Button>
            ) : (
              <Badge key={key} variant="outline">
                {t(label, { count: quality[key] })}
              </Badge>
            ),
          )}
      </div>
      {quality.matchedAccounts +
        quality.mismatchAccounts +
        quality.unverifiedAccounts ===
        0 && <p className="text-muted-foreground">{t('quality.noAccounts')}</p>}
    </section>
  )
}
