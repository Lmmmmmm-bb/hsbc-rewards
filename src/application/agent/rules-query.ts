import { LATEST_RULES } from '@/domain/rewards/rules'
import type { Translate } from '@/i18n/message-types'
import type { AgentToolInputs } from './inputs'
import { BASELINE_ASSUMPTIONS } from './projections'

export function getAgentRules(input: AgentToolInputs['reward_get_rules'], t: Translate) {
  const topic = input.topic ?? 'overview'
  const components = (['basic', 'abroad', 'pulse'] as const).map((component) => ({ component,
    rateBasisPoints: component === 'basic' ? LATEST_RULES.basicRateBasisPoints : component === 'abroad'
      ? LATEST_RULES.basicRateBasisPoints * LATEST_RULES.maximumAbroadMultiplier : LATEST_RULES.pulse.rateBasisPoints,
    eligibility: t(`rules.${component}.body`), cap: t(`rules.${component}.cap`) }))

  return {
    id: LATEST_RULES.id, verifiedAt: LATEST_RULES.verifiedAt, topic,
    ...(['overview', 'eligibility', 'caps'].includes(topic) ? { components } : {}),
    ...(topic === 'overview' || topic === 'assumptions' ? {
      assumptionCodes: BASELINE_ASSUMPTIONS,
      notes: [t('rewards.latest'), t('rewards.imported'), t('rules.sharingBody'), t('rewards.enrollment'), t('rewards.enrollmentPeriodIgnored'), t('rewards.fxEffect'), t('rules.exclusions')],
    } : {}),
    ...(topic === 'overview' || topic === 'sources' ? { sources: LATEST_RULES.sources } : {}),
  }
}
