import type { AccountReconciliation } from '@/domain/reconciliation/reconcile'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/i18n/use-i18n'

export function BalanceAccount({
  account,
}: {
  account: AccountReconciliation
}) {
  const { t, money } = useI18n()
  return (
    <section className="border" data-balance-account>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
        <h4 className="font-semibold">{account.currency}</h4>
        <Badge variant="outline">
          {t(`details.balance.${account.status}`)}
        </Badge>
      </div>
      <dl className="space-y-3 p-4 text-sm tabular-nums">
        {(
          [
            ['opening', account.openingMinor],
            ['debit', account.debitMinor],
            ['credit', account.creditMinor],
          ] as const
        ).map(([key, amount]) => (
          <div key={key} className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">
              {t(`details.balance.${key}`)}
            </dt>
            <dd className="whitespace-nowrap">
              {amount === null
                ? t('details.missing')
                : money(amount, account.currency)}
            </dd>
          </div>
        ))}
        <div className="space-y-3 border-t pt-3">
          {(
            [
              ['expected', account.expectedMinor],
              ['closing', account.closingMinor],
            ] as const
          ).map(([key, amount]) => (
            <div key={key} className="flex flex-wrap justify-between gap-2">
              <dt>{t(`details.balance.${key}`)}</dt>
              <dd className="font-semibold whitespace-nowrap">
                {amount === null
                  ? t('details.missing')
                  : money(amount, account.currency)}
              </dd>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t pt-3">
          <dt className="font-medium">{t('details.balance.delta')}</dt>
          <dd
            className={
              account.status === 'mismatch'
                ? 'text-lg font-semibold text-primary'
                : 'text-lg font-semibold'
            }
          >
            {account.deltaMinor === null
              ? t('details.missing')
              : `${account.deltaMinor > 0 ? '+' : ''}${money(account.deltaMinor, account.currency)}`}
          </dd>
        </div>
      </dl>
    </section>
  )
}
