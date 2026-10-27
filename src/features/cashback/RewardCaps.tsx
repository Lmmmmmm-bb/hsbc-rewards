import type { WorkspaceView } from '@/application/session/selectors'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/i18n/use-i18n'

export function RewardCaps({
  pools,
}: {
  pools: WorkspaceView['rewardCards'][number]['pools']
}) {
  const { t, number } = useI18n()
  return (
    <section className="space-y-4 border-t pt-4" aria-label={t('card.caps')}>
      <h4 className="font-medium">{t('card.caps')}</h4>
      {pools.length === 0 && (
        <p className="text-muted-foreground">{t('rewards.noPool')}</p>
      )}
      {pools.some((pool) => pool.shared) && (
        <p className="text-muted-foreground">{t('card.sharedPool')}</p>
      )}
      <div className="grid grid-cols-1 gap-5 @2xl/reward:grid-cols-2">
        {pools.map((pool) => (
          <section key={pool.key} className="space-y-2">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-medium">{t(`rewards.${pool.tier}`)}</p>
              <p className="text-muted-foreground">
                {t(pool.tier === 'abroad' ? 'rewards.annual' : 'rewards.half', {
                  period: pool.period,
                })}
              </p>
            </div>
            <Progress
              value={
                pool.usedMinor === null
                  ? null
                  : (pool.usedMinor / pool.capMinor) * 100
              }
              aria-label={t(`rewards.${pool.tier}`) + ' ' + pool.period}
            />
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 tabular-nums">
              <p>
                {t('rewards.used', {
                  used:
                    pool.usedMinor === null
                      ? t('rewards.pending')
                      : number(pool.usedMinor / 100),
                  cap: number(pool.capMinor / 100),
                })}
              </p>
              <p>
                {t('rewards.remaining')}{' '}
                {pool.remainingMinor === null
                  ? t('rewards.pending')
                  : number(pool.remainingMinor / 100)}
              </p>
            </div>
            <p className="text-muted-foreground">
              {t(pool.tier === 'abroad' ? 'card.capAbroad' : 'card.capPulse')}
            </p>
          </section>
        ))}
      </div>
      <p className="text-muted-foreground">{t('rewards.imported')}</p>
    </section>
  )
}
