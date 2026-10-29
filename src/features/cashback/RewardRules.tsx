import type { WorkspaceView } from '@/application/session/selectors'
import { DialogTabsList, DialogTab } from '@/components/workspace/DialogTabs'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { useI18n } from '@/i18n/use-i18n'
import { RuleEligibility } from './rules/RuleEligibility'
import { CalculationDetails } from './rules/CalculationDetails'
import { OfficialSources } from './rules/OfficialSources'

export function RewardRules({ rules }: { rules: WorkspaceView['rules'] }) {
  const { t } = useI18n()

  return (
    <Tabs defaultValue="rewards" data-reward-rules className="gap-4">
      <DialogTabsList
        aria-label={t('rules.dialogTitle')}
      >
        <DialogTab value="rewards">
          {t('rules.tabRewards')}
        </DialogTab>
        <DialogTab value="calculation">
          {t('rules.tabCalculation')}
        </DialogTab>
        <DialogTab value="sources">
          {t('rules.tabSources')}
        </DialogTab>
      </DialogTabsList>
      <TabsContent value="rewards">
        <RuleEligibility rules={rules} />
      </TabsContent>
      <TabsContent value="calculation">
        <CalculationDetails />
      </TabsContent>
      <TabsContent value="sources">
        <OfficialSources rules={rules} />
      </TabsContent>
    </Tabs>
  )
}
