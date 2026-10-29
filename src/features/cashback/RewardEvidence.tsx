import type { ResultScope } from '@/application/results/scope'
import { resultAssumptions } from '@/application/results/assumptions'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { useI18n } from '@/i18n/use-i18n'
import { AssumptionNotes } from './AssumptionNotes'
import { CalculationDetails } from './CalculationDetails'

export function RewardEvidence({ scope }: { scope: ResultScope }) {
  const { t } = useI18n()
  return <section className="space-y-2" aria-label={t('basis.title')} data-reward-evidence>
    <p className="text-xs text-muted-foreground">{t('basis.baseline')}</p>
    <AssumptionNotes items={resultAssumptions(scope.cards)} />
    <Accordion><AccordionItem value="calculation">
      <AccordionTrigger>{t('basis.details')}</AccordionTrigger>
      <AccordionContent><CalculationDetails scope={scope} /></AccordionContent>
    </AccordionItem></Accordion>
  </section>
}
