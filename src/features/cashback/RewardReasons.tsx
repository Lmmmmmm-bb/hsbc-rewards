import type { ReactNode } from 'react'
import type { WorkspaceView } from '@/application/session/selectors'
import type { MessageKey } from '@/i18n/zh'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/i18n/use-i18n'

const labels = {
  'reward.eligible': 'reason.eligible',
  'reward.cap-applied': 'reason.cap',
  'fx.required-for-cap': 'reason.fx',
  'region.unknown': 'reason.region',
  'currency.original-unknown': 'reason.currency',
  'reward.original-hkd': 'reason.originalHkd',
  'reward.region-excluded': 'reason.regionExcluded',
  'reward.currency-excluded': 'reason.currencyExcluded',
  'reward.payment-excluded': 'reason.payment',
  'reward.not-enrolled': 'reason.enrollment',
  'transaction.refund': 'reason.refund',
  'transaction.repayment': 'reason.repayment',
  'transaction.fee': 'reason.fee',
  'transaction.cash-advance': 'reason.cash',
  'transaction.credit': 'reason.credit',
  'transaction.non-positive': 'reason.nonpositive',
  'eligibility.excluded-merchant': 'reason.excluded',
} as const satisfies Readonly<Record<string, MessageKey>>

const common = (code: string) =>
  code.startsWith('transaction.') ||
  code.startsWith('eligibility.') ||
  code === 'reward.transaction-excluded'

type TierDetails = WorkspaceView['rewardCards'][number]['tiers']

export function RewardReasons({
  tiers,
  children,
}: {
  tiers: TierDetails
  children?: ReactNode
}) {
  const { t } = useI18n()
  const shared = tiers[0]?.reasons.filter((reason) => common(reason.code)) ?? []

  const list = (reasons: TierDetails[number]['reasons']) => (
    <ul className="space-y-2">
      {reasons.map(({ code, count }) => (
        <li key={code} className="flex items-start justify-between gap-3">
          <span className="min-w-0 text-muted-foreground">
            {t(
              Object.hasOwn(labels, code)
                ? labels[code as keyof typeof labels]
                : 'reason.other',
            )}
          </span>
          <Badge variant="secondary">{t('reasons.count', { count })}</Badge>
        </li>
      ))}
    </ul>
  )

  return (
    <Accordion data-reward-reasons>
      <AccordionItem value="reasons">
        <AccordionTrigger>{t('reasons.title')}</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            {children}
            {shared.length > 0 && (
              <section className="space-y-3">
                <h4 className="font-medium">{t('reasons.common')}</h4>
                {list(shared)}
              </section>
            )}
            {tiers.map(({ tier, reasons }) => {
              const specific = reasons.filter((reason) => !common(reason.code))

              return (
                <section key={tier} className="space-y-2">
                  <h4 className="font-medium">{t(`rewards.${tier}`)}</h4>
                  {specific.length ? (
                    list(specific)
                  ) : (
                    <p className="text-muted-foreground">
                      {t('reasons.empty')}
                    </p>
                  )}
                </section>
              )
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
