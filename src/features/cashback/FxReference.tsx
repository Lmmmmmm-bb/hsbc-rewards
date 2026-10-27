import { RiRefreshLine } from '@remixicon/react'
import type { FxSnapshot } from '@/application/session/types'
import type { FxRequestState } from '@/application/fx/controller'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'

export function FxReference({
  fx,
  request,
  onRefresh,
}: {
  fx: FxSnapshot
  request: FxRequestState
  onRefresh: () => void
}) {
  const { t, number, date, dateTime } = useI18n()
  const available = fx.source === 'live' || fx.source === 'cache'
  return (
    <section
      data-fx-reference
      className="space-y-3 border-t pt-4"
      aria-label={t('fx.title')}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{t('fx.title')}</p>
        {fx.source !== 'demo' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={request.status === 'loading'}
          >
            <RiRefreshLine aria-hidden="true" />
            {t(request.status === 'loading' ? 'fx.loading' : 'fx.refresh')}
          </Button>
        )}
      </div>
      {fx.source === 'demo' ? (
        <p>
          {t('rewards.fxDemo', { rate: number(fx.hkdToCnyPpm / 1_000_000, 6) })}
        </p>
      ) : available ? (
        <div className="space-y-2">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-medium tabular-nums">
              1 HKD = {number(fx.hkdToCnyPpm / 1_000_000, 6)} CNY
            </span>
            <Badge variant={fx.stale ? 'secondary' : 'outline'}>
              {t(fx.stale ? 'fx.stale' : 'fx.available')}
            </Badge>
          </p>
          <p className="text-muted-foreground">
            <a
              href="https://frankfurter.dev/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Frankfurter / ECB
            </a>{' '}
            · {t('fx.rateDate', { date: date(fx.rateDate) })}
          </p>
          <p className="text-muted-foreground">
            {t('fx.retrievedAt', { time: dateTime(fx.retrievedAt) })}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground">{t('fx.unavailable')}</p>
      )}
      <div role="status" className="space-y-1 text-muted-foreground">
        {request.status === 'loading' && (
          <p>{t(available ? 'fx.refreshingHint' : 'fx.loadingHint')}</p>
        )}
        {request.status === 'error' && (
          <p>
            {t(
              request.problem === 'timeout'
                ? 'fx.timeout'
                : request.problem === 'invalid-response'
                  ? 'fx.invalid'
                  : 'fx.failed',
            )}
          </p>
        )}
        {available && fx.stale && <p>{t('fx.staleHint')}</p>}
      </div>
      <div className="space-y-1 text-muted-foreground">
        <p>{t('cashback.fxReference')}</p>
        <p>{t('rewards.fxEffect')}</p>
      </div>
    </section>
  )
}
