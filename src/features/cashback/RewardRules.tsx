import type { WorkspaceView } from '@/application/session/selectors'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useI18n } from '@/i18n/use-i18n'
import { RuleEligibility } from './rules/RuleEligibility'
import { CalculationDetails } from './rules/CalculationDetails'
import { OfficialSources } from './rules/OfficialSources'

export function RewardRules({ rules }: { rules: WorkspaceView['rules'] }) {
  const { t } = useI18n()

  return (
    <Tabs defaultValue="rewards" data-reward-rules className="gap-4">
      <TabsList
        className="sticky top-0 z-10 grid w-full grid-cols-3 items-stretch group-data-horizontal/tabs:h-auto"
        aria-label={t('rules.dialogTitle')}
      >
        <TabsTrigger value="rewards" className="h-auto min-w-0 py-1 whitespace-normal">
          {t('rules.tabRewards')}
        </TabsTrigger>
        <TabsTrigger value="calculation" className="h-auto min-w-0 py-1 whitespace-normal">
          {t('rules.tabCalculation')}
        </TabsTrigger>
        <TabsTrigger value="sources" className="h-auto min-w-0 py-1 whitespace-normal">
          {t('rules.tabSources')}
        </TabsTrigger>
      </TabsList>
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
