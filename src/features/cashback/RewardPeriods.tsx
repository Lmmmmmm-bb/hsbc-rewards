import type { WorkspaceView } from '@/application/session/selectors'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'

export function RewardPeriods({
  periods,
  selected,
  onSelect,
}: {
  periods: WorkspaceView['periods']
  selected: string
  onSelect: (id: string) => void
}) {
  const { t, rc } = useI18n()
  return (
    <nav
      data-reward-periods
      aria-label={t('period.results')}
      className="flex flex-wrap gap-2"
    >
      <Button
        variant={selected === 'all' ? 'default' : 'outline'}
        size="sm"
        aria-pressed={selected === 'all'}
        onClick={() => onSelect('all')}
      >
        {t('period.all')}
      </Button>
      {periods.map((period) => (
        <Button
          key={period.id}
          variant={selected === period.id ? 'default' : 'outline'}
          size="sm"
          aria-pressed={selected === period.id}
          onClick={() => onSelect(period.id)}
        >
          {t(period.half === 1 ? 'period.h1' : 'period.h2', {
            year: period.year,
          })}
          <span className="tabular-nums">{rc(period.totalRewardMicroRc)}</span>
        </Button>
      ))}
    </nav>
  )
}
