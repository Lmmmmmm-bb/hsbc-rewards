import type { ResultTransaction } from '@/application/results/transactions'
import { componentExplanation } from '@/application/results/transactions'
import type { Statement } from '@/domain/model/types'
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
    [t('details.kind'), t(`details.kind.${row.classification.kind}`)],
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
    <div className="space-y-4" data-transaction-detail>
      <Button variant="outline" size="sm" onClick={onBack}>
        {t('details.back')}
      </Button>
      <h3
        className="break-all text-base font-semibold"
        tabIndex={-1}
        data-detail-heading
      >
        {row.description}
      </h3>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-3">
        {reward.tiers.map((tier) => {
          const capping = componentExplanation(tier)
          return (
            <section key={tier.tier} className="space-y-2 border p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 font-medium">
                <h4>
                  {t(`rewards.${tier.tier}`)} ·{' '}
                  {number(tier.rateBasisPoints / 100)}%
                </h4>
                <p className="tabular-nums">{rc(tier.microRc)}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('card.eligible')}{' '}
                {money(tier.eligibleMinor, row.account.currency)}
                {tier.cappedMinor !== null && tier.cappedMinor > 0 && (
                  <>
                    {' '}
                    · {t('details.cappedAmount')}{' '}
                    {money(tier.cappedMinor, row.account.currency)}
                  </>
                )}
              </p>
              <ul className="space-y-1 text-xs">
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
      <section className="space-y-2">
        <h4 className="font-medium">{t('details.sources')}</h4>
        {row.sources.map((source, index) => {
          const statement = statements.find(
            (item) => item.id === source.statementId,
          )
          return (
            <div key={index} className="space-y-2 border p-3">
              <Button
                variant="link"
                className="h-auto max-w-full p-0 text-left whitespace-normal break-all"
                onClick={() => onStatement(source.statementId)}
              >
                {statement
                  ? `${date(statement.date)} · ${statement.fileName}`
                  : t('details.sourceUnavailable')}{' '}
                · {t('details.sourcePage', { page: source.page })}
              </Button>
              <details>
                <summary className="cursor-pointer text-xs">
                  {t('details.sourceText')}
                </summary>
                <p className="mt-2 text-xs whitespace-pre-wrap break-all">
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
