import type { WorkspaceView } from '../session/selectors'

export type AssumptionKind =
  | 'registration'
  | 'multiplier'
  | 'pool'
  | 'reference-fx'
  | 'role-conflict'
  | 'pool-conflict'
  | 'enrollment-period'

/** Explain missing registration and allocation separately, preserving recognized multipliers. */
export function cardAssumptions(
  card: WorkspaceView['rewardCards'][number],
): AssumptionKind[] {
  const result: AssumptionKind[] = []
  if (card.assumptions.includes('assumption.abroad-five-times')) {
    if (!card.card.abroadEnrollment) result.push('registration')
    if (card.card.abroadMultiplier === undefined) result.push('multiplier')
  }
  if (card.assumptions.includes('assumption.pool-unconfirmed'))
    result.push('pool')
  if (card.assumptions.includes('assumption.cap-reference-fx'))
    result.push('reference-fx')
  if (card.assumptions.includes('card.role-conflict'))
    result.push('role-conflict')
  if (card.assumptions.includes('card.pool-conflict'))
    result.push('pool-conflict')
  if (card.assumptions.includes('assumption.enrollment-period-ignored'))
    result.push('enrollment-period')
  return result
}

export function resultAssumptions(cards: WorkspaceView['rewardCards']) {
  return [...new Set(cards.flatMap(cardAssumptions))]
}
