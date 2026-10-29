import type { ResultTransaction } from '@/application/results/transactions'
import { componentExplanation } from '@/application/results/transactions'
import type { Statement } from '@/domain/model/types'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { InfoSection } from '@/components/workspace/InfoSection'
import { TransactionSources } from './TransactionSources'
import { useI18n } from '@/i18n/use-i18n'
import { reasonMessage } from '../reason-messages'

export function TransactionDetails({
  entry,
  statements,
}: {
  entry: Pick<ResultTransaction, 'row' | 'reward'>
  statements: readonly Statement[]
}) {
  const { t, date, money, rc, number, locale } = useI18n()
  const { row, reward } = entry
  const fields = [
    [t('details.transactionDate'), date(row.transactionDate)],
    [t('details.postingDate'), date(row.postingDate)],
    [
      t('details.original'),
      row.original.currency === 'XXX'
        ? t('details.unknown')
        : money(row.original.minor, row.original.currency),
    ],
    [t('details.account'), money(row.account.minor, row.account.currency)],
    [
      t('details.region'),
      row.classification.region
        ? (new Intl.DisplayNames([locale], { type: 'region' }).of(
            row.classification.region,
          ) ?? row.classification.region)
        : t('details.unknown'),
    ],
    [
      t('details.payment'),
      t(`details.payment.${row.classification.paymentMethod}`),
    ],
  ]
  return (
    <div className="space-y-3" data-transaction-detail>
      <Card size="sm" className="border bg-muted/30 ring-0">
        <CardHeader>
          <h3
            className="break-words text-lg font-semibold outline-none"
            tabIndex={-1}
            data-detail-heading
          >
            {row.description}
          </h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium">
            {t('details.transactionReward')}
          </p>
          <p className="break-words text-2xl font-semibold text-primary tabular-nums">
            {rc(reward.microRc ?? reward.knownMicroRc)}
          </p>
          {reward.microRc === null && (
            <p className="text-xs">{t('cashback.knownHint')}</p>
          )}
        </CardContent>
      </Card>
      <InfoSection title={t('details.transactionInfo')}>
        <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="space-y-1">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </InfoSection>
      <InfoSection title={t('details.componentRewards')}>
        <div className="grid items-stretch gap-2 sm:grid-cols-3">
          {reward.tiers.map((tier) => {
            const capping = componentExplanation(tier)
            return (
              <section
                key={tier.tier}
                className="flex min-w-0 flex-col gap-3 border p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-sm font-medium">
                    {t(`rewards.${tier.tier}`)}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {number(tier.rateBasisPoints / 100)}%
                  </span>
                </div>
                <p className="break-words text-xl font-semibold tabular-nums">
                  {rc(tier.microRc)}
                </p>
                <dl className="space-y-2 border-t pt-3 text-xs">
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">
                      {t('card.eligible')}
                    </dt>
                    <dd>{money(tier.eligibleMinor, row.account.currency)}</dd>
                  </div>
                  {tier.cappedMinor !== null && tier.cappedMinor > 0 && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground">
                        {t('details.cappedAmount')}
                      </dt>
                      <dd>{money(tier.cappedMinor, row.account.currency)}</dd>
                    </div>
                  )}
                </dl>
                <ul className="mt-auto space-y-2 text-xs leading-relaxed">
                  {tier.reasonCodes.map((code) => (
                    <li key={code}>
                      {t(
                        code === 'reward.cap-applied' && capping
                          ? `details.cap.${capping}`
                          : reasonMessage(code),
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </InfoSection>
      <TransactionSources sources={row.sources} statements={statements} />
    </div>
  )
}
