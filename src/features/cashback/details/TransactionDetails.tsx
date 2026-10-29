import { RiArrowRightSLine, RiFileTextLine } from '@remixicon/react'
import type { ResultTransaction } from '@/application/results/transactions'
import { componentExplanation } from '@/application/results/transactions'
import type { Statement } from '@/domain/model/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'
import { reasonMessage } from '../reason-messages'

export function TransactionDetails({
  entry,
  statements,
  onStatement,
  onBack,
}: {
  entry: Pick<ResultTransaction, 'row' | 'reward'>
  statements: readonly Statement[]
  onStatement: (id: string) => void
  onBack: () => void
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
    <div className="space-y-6" data-transaction-detail>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            {t('details.back')}
          </Button>
          <Badge variant="outline">
            {t(`details.kind.${row.classification.kind}`)}
          </Badge>
        </div>
        <h3
          className="break-words text-lg font-semibold outline-none"
          tabIndex={-1}
          data-detail-heading
        >
          {row.description}
        </h3>
        <div className="space-y-2 border bg-muted/30 p-4">
          <p className="text-sm font-medium">
            {t('details.transactionReward')}
          </p>
          <p className="break-words text-2xl font-semibold text-primary tabular-nums">
            {rc(reward.microRc ?? reward.knownMicroRc)}
          </p>
          {reward.microRc === null && (
            <p className="text-xs">{t('cashback.knownHint')}</p>
          )}
        </div>
      </div>
      <section className="space-y-3">
        <h4 className="font-semibold text-primary">
          {t('details.transactionInfo')}
        </h4>
        <dl className="grid gap-x-6 gap-y-4 border-t pt-3 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="space-y-1">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="space-y-3">
        <h4 className="font-semibold text-primary">
          {t('details.componentRewards')}
        </h4>
        <div className="grid items-start gap-3 sm:grid-cols-3">
          {reward.tiers.map((tier) => {
            const capping = componentExplanation(tier)
            return (
              <section key={tier.tier} className="space-y-3 border p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h5 className="text-sm font-medium">
                    {t(`rewards.${tier.tier}`)}
                  </h5>
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
                <ul className="space-y-2 text-xs leading-relaxed">
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
      </section>
      <section className="space-y-3">
        <h4 className="font-semibold text-primary">{t('details.sources')}</h4>
        {row.sources.map((source, index) => {
          const statement = statements.find(
            (item) => item.id === source.statementId,
          )
          return (
            <div key={index} className="border">
              <Button
                variant="ghost"
                className="h-auto w-full items-start justify-between gap-3 p-3 text-left whitespace-normal"
                onClick={() => onStatement(source.statementId)}
              >
                <span className="flex min-w-0 items-start gap-3">
                  <RiFileTextLine
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="block break-all text-sm font-medium">
                      {statement?.fileName ?? t('details.sourceUnavailable')}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {statement && `${date(statement.date)} · `}
                      {t('details.sourcePage', { page: source.page })}
                    </span>
                  </span>
                </span>
                <RiArrowRightSLine
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </Button>
              <details className="border-t bg-muted/20 p-3">
                <summary className="cursor-pointer text-xs font-medium">
                  {t('details.sourceText')}
                </summary>
                <p className="mt-3 text-xs leading-relaxed whitespace-pre-wrap break-all">
                  {source.text}
                </p>
              </details>
            </div>
          )
        })}
      </section>
    </div>
  )
}
