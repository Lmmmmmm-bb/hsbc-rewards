import type { ResultDetailsRequest } from '@/application/results/details'
import { Button } from '@/components/ui/button'
import type { WorkspaceView } from '@/application/session/selectors'
import type { MessageKey } from '@/i18n/zh'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useI18n } from '@/i18n/use-i18n'

const hints = [
  ['possibleDuplicateCount', 'quality.duplicateHint'],
  ['referenceConflictCount', 'quality.referenceHint'],
  ['unverifiedAccounts', 'quality.unverifiedHint'],
  ['uncertainEligibilityCount', 'quality.uncertainHint'],
] as const satisfies readonly (readonly [
  keyof WorkspaceView['quality'],
  MessageKey,
])[]

export function RewardQualityAlerts({
  quality,
  onDetails,
}: {
  quality: WorkspaceView['quality']
  onDetails: (request: ResultDetailsRequest) => void
}) {
  const { t } = useI18n()
  const active = hints.filter(([key]) => quality[key] > 0)
  if (active.length === 0) return null
  return (
    <Alert role="status">
      <AlertDescription>
        <ul className="space-y-2">
          {active.map(([key, message]) => (
            <li key={key} className="space-y-1">{t(message, { count: quality[key] })}{' '}
              <Button variant="link" className="h-auto p-0" onClick={() => onDetails(key === 'unverifiedAccounts'
                ? { tab: 'statements', reconciliation: 'unverified' }
                : { tab: 'transactions', ...(key === 'uncertainEligibilityCount' ? { flags: ['uncertain'] as const }
                  : { warning: key === 'possibleDuplicateCount' ? 'transaction.possible-duplicate' : 'transaction.reference-conflict' }) })}>{t('details.inspect')}</Button>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
