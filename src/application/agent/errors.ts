export type AgentProblem =
  | 'invalid_arguments'
  | 'access_required'
  | 'no_results'
  | 'period_not_found'
  | 'card_not_found'
  | 'file_not_found'
  | 'batch_changed'
  | 'batch_not_active'
  | 'result_changed'
  | 'cursor_invalid'
  | 'ui_busy'
  | 'cancelled'
  | 'unavailable'
  | 'query_too_broad'

export class AgentError extends Error {
  readonly code: AgentProblem
  constructor(code: AgentProblem) {
    super(`agent.${code}`)
    this.name = 'AgentError'
    this.code = code
  }
}
