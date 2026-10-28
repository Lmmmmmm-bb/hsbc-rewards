import type { CardRewardInput, SummaryInput } from './reward-queries'
import type { TransactionInput } from './transaction-query'
import type { QualityInput } from './quality-query'

/** Typed service inputs stay separate from the environment-independent public catalog. */
export interface AgentToolInputs {
  reward_get_context: Record<string, never>
  reward_get_rules: { topic?: 'overview' | 'eligibility' | 'caps' | 'assumptions' | 'sources' }
  reward_request_access: Record<string, never>
  reward_open_import: { fileRef?: string }
  reward_get_import_status: { batchRef?: string }
  reward_cancel_import: { batchRef: string }
  reward_get_summary: SummaryInput
  reward_get_card_rewards: CardRewardInput
  reward_list_transactions: TransactionInput
  reward_get_quality: QualityInput
}
