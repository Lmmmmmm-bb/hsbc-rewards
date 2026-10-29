import type { AgentSnapshot } from './snapshots'
import { AgentError } from './errors'
import { selectResultScope, ResultSelectionError } from '../results/scope'

export interface ResultScope {
  readonly periodId?: string
  readonly cardRef?: string
}

export function agentScope(snapshot: AgentSnapshot, input: ResultScope) {
  const cardId = input.cardRef ? snapshot.references.resolve('card', input.cardRef) : null
  try {
    return selectResultScope(snapshot.session, snapshot.view, { periodId: input.periodId, cardId })
  } catch (error) {
    if (error instanceof ResultSelectionError) throw new AgentError(error.code)
    throw error
  }
}

export type AgentScope = ReturnType<typeof agentScope>
