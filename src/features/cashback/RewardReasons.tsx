import type { ReactNode } from 'react'
import type { WorkspaceView } from '@/application/session/selectors'
import type { RewardTier } from '@/domain/rewards/calculate'
import { Button } from '@/components/ui/button'
import { reasonMessage } from './reason-messages'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/i18n/use-i18n'

const common = (code: string) =>
  code.startsWith('transaction.') ||
  code.startsWith('eligibility.') ||
  code === 'reward.transaction-excluded'

type TierDetails = WorkspaceView['rewardCards'][number]['tiers']

export function RewardReasons({
  tiers,
  children,
  onReason,
}: {
  tiers: TierDetails
  children?: ReactNode
  onReason?: (component: RewardTier, reason: string) => void
}) {
  const { t } = useI18n()
  const shared = tiers[0]?.reasons.filter((reason) => common(reason.code)) ?? []

  const list = (reasons: TierDetails[number]['reasons'], component: RewardTier) => (
    <ul className="space-y-2">
      {reasons.map(({ code, count }) => (
        <li key={code} className="flex items-start justify-between gap-3">
          <Button variant="link" className="h-auto min-w-0 justify-start p-0 text-left whitespace-normal" onClick={() => onReason?.(component, code)}>
            {t(reasonMessage(code))}
          </Button>
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
                {list(shared, 'basic')}
              </section>
            )}
            {tiers.map(({ tier, reasons }) => {
              const specific = reasons.filter((reason) => !common(reason.code))

              return (
                <section key={tier} className="space-y-2">
                  <h4 className="font-medium">{t(`rewards.${tier}`)}</h4>
                  {specific.length ? (
                    list(specific, tier)
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
