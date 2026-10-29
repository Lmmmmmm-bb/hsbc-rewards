import { useId } from 'react'
import * as m from 'motion/react-m'
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
  const { t, rcSummary } = useI18n()
  const selectionId = useId()
  const options = [
    { id: 'all', label: t('period.all'), amount: null },
    ...periods.map((period) => ({
      id: period.id,
      label: t(period.half === 1 ? 'period.h1' : 'period.h2', {
        year: period.year,
      }),
      amount: rcSummary(period.totalRewardMicroRc),
    })),
  ]

  return (
    <nav
      data-reward-periods
      aria-label={t('period.results')}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => (
        <Button
          key={option.id}
          variant="outline"
          size="sm"
          className="relative isolate h-auto max-w-full flex-wrap py-1 aria-pressed:border-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-transparent"
          aria-pressed={selected === option.id}
          onClick={() => onSelect(option.id)}
        >
          {selected === option.id && (
            <m.span
              aria-hidden="true"
              layoutId={selectionId}
              className="pointer-events-none absolute inset-0 -z-10 bg-primary"
              transition={{
                type: 'tween',
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          )}
          <span>{option.label}</span>
          {option.amount !== null && (
            <span className="whitespace-nowrap tabular-nums">
              {option.amount}
            </span>
          )}
        </Button>
      ))}
    </nav>
  )
}
