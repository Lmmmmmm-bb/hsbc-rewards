import type { ResultScope } from '@/application/results/scope'
import {
  resultAssumptions,
  type AssumptionKind,
} from '@/application/results/assumptions'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'
import { AssumptionNotes } from './AssumptionNotes'

const omittedOverviewAssumptions = new Set<AssumptionKind>([
  'registration',
  'multiplier',
  'pool',
  'reference-fx',
])

export function RewardEvidence({
  scope,
  onDetails,
}: {
  scope: ResultScope
  onDetails: () => void
}) {
  const { t } = useI18n()
  return (
    <section
      className="space-y-2"
      aria-label={t('basis.title')}
      data-reward-evidence
    >
      <p className="text-xs text-muted-foreground">{t('basis.baseline')}</p>
      <AssumptionNotes
        items={resultAssumptions(scope.cards).filter(
          (item) => !omittedOverviewAssumptions.has(item),
        )}
      />
      <Button
        variant="link"
        className="h-auto p-0"
        onClick={onDetails}
        aria-haspopup="dialog"
      >
        {t('basis.details')}
      </Button>
    </section>
  )
}
