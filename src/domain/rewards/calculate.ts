import { DomainError } from '../model/errors'
import type { Card, Transaction } from '../model/types'
import { convertMinorInverse, microRcForSpend, proportionalMicroRc, safeInteger } from '../money/money'
import { requireIsoDate, rewardPeriod } from '../normalization/dates'
import { LATEST_RULES } from './rules'

export type RewardTier = 'basic' | 'abroad' | 'pulse'

export interface TierReward {
  readonly tier: RewardTier
  readonly rateBasisPoints: number
  readonly eligibleMinor: number | null
  readonly cappedMinor: number | null
  readonly microRc: number | null
  readonly capBasisMinor?: number | null
  readonly reasonCodes: readonly string[]
  readonly poolKey?: string
}

export interface TransactionReward {
  readonly transactionId: string
  readonly cardId: string
  readonly microRc: number | null
  readonly knownMicroRc: number
  readonly tiers: readonly TierReward[]
  readonly assumptions: readonly string[]
}

export interface RewardPool {
  readonly key: string
  readonly ownerId: string
  readonly shared: boolean
  readonly tier: 'abroad' | 'pulse'
  readonly period: string
  readonly capMinor: number
  readonly usedMinor: number | null
  readonly remainingMinor: number | null
  readonly verification: 'complete' | 'missing-fx'
}

export interface CardRewards {
  readonly cardId: string
  readonly basicMicroRc: number
  readonly abroadMicroRc: number | null
  readonly pulseMicroRc: number | null
  readonly totalMicroRc: number | null
  readonly knownMicroRc: number
  readonly wholeRc: number | null
  readonly remainderMicroRc: number | null
}

export interface RewardContext {
  readonly hkdToCnyPpm: number | null
}

function sourceOrder(transaction: Transaction): string {
  const source = transaction.sources[0]
  return source ? `${source.fileHash}:${String(source.page).padStart(6, '0')}:${String(source.row).padStart(8, '0')}` : transaction.id
}

function emptyTier(tier: RewardTier, rateBasisPoints: number, reason: string): TierReward {
  return { tier, rateBasisPoints, eligibleMinor: 0, cappedMinor: 0, microRc: 0, reasonCodes: [reason] }
}

/** Accrued RC is retained precisely; whole RC and the uncredited remainder are separate. */
export function calculateRewards(input: readonly Transaction[], cards: readonly Card[], context: RewardContext = { hkdToCnyPpm: null }) {
  const cardMap = new Map(cards.map(card => [card.id, card]))
  if (cardMap.size !== cards.length) throw new DomainError('card.duplicate-id')
  if (new Set(input.map(t => t.id)).size !== input.length) throw new DomainError('transaction.duplicate-id')
  const poolMap = new Map<string, RewardPool>()
  const transactions: TransactionReward[] = []
  const sorted = [...input].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate) || a.postingDate.localeCompare(b.postingDate) || sourceOrder(a).localeCompare(sourceOrder(b)) || a.id.localeCompare(b.id))

  function capBasis(tier: 'abroad' | 'pulse', transaction: Transaction): { minor: number | null; estimated: boolean } {
    if (tier === 'pulse' && transaction.original.currency === 'CNY') return { minor: transaction.account.minor, estimated: false }
    if (transaction.bankHkdEquivalentMinor !== undefined) {
      safeInteger(transaction.bankHkdEquivalentMinor)
      if (transaction.bankHkdEquivalentMinor < 0) throw new DomainError('rewards.invalid-basis')
      return { minor: transaction.bankHkdEquivalentMinor, estimated: false }
    }
    if (transaction.account.currency === 'HKD') return { minor: transaction.account.minor, estimated: false }
    return { minor: convertMinorInverse(transaction.account.minor, context.hkdToCnyPpm), estimated: true }
  }

  function cappedTier(tier: 'abroad' | 'pulse', transaction: Transaction, card: Card, rateBasisPoints: number, assumptions: string[]): TierReward {
    const rule = LATEST_RULES[tier]
    const period = rewardPeriod(transaction.transactionDate, rule.period)
    const ownerId = card.pool?.id ?? card.id
    const key = JSON.stringify([card.pool ? 'shared' : 'card', ownerId, tier, period])
    const prior = poolMap.get(key)
    if (prior?.remainingMinor === 0) return { tier, rateBasisPoints, eligibleMinor: 0, cappedMinor: transaction.account.minor, capBasisMinor: null, microRc: 0, reasonCodes: ['reward.cap-applied'], poolKey: key }
    const basis = capBasis(tier, transaction)
    if (basis.estimated) assumptions.push('assumption.cap-reference-fx')
    if (basis.minor === null || prior?.verification === 'missing-fx') {
      poolMap.set(key, { key, ownerId, shared: Boolean(card.pool), tier, period, capMinor: rule.capMinor, usedMinor: null, remainingMinor: null, verification: 'missing-fx' })
      return { tier, rateBasisPoints, eligibleMinor: null, cappedMinor: null, capBasisMinor: basis.minor, microRc: null, reasonCodes: ['fx.required-for-cap'], poolKey: key }
    }
    const remaining = prior?.remainingMinor ?? rule.capMinor
    const usedBasisMinor = Math.min(basis.minor, remaining)
    const eligibleMinor = basis.minor === 0 ? remaining > 0 ? transaction.account.minor : 0 : Number(BigInt(transaction.account.minor) * BigInt(usedBasisMinor) / BigInt(basis.minor))
    const cappedMinor = transaction.account.minor - eligibleMinor
    const usedMinor = safeInteger((prior?.usedMinor ?? 0) + usedBasisMinor)
    poolMap.set(key, { key, ownerId, shared: Boolean(card.pool), tier, period, capMinor: rule.capMinor, usedMinor, remainingMinor: rule.capMinor - usedMinor, verification: 'complete' })
    const microRc = basis.minor === 0 && remaining === 0 ? 0 : proportionalMicroRc(transaction.account.minor, rateBasisPoints, usedBasisMinor, basis.minor)
    return { tier, rateBasisPoints, eligibleMinor, cappedMinor, capBasisMinor: basis.minor, microRc, reasonCodes: cappedMinor > 0 ? ['reward.cap-applied'] : ['reward.eligible'], poolKey: key }
  }

  for (const transaction of sorted) {
    requireIsoDate(transaction.transactionDate)
    requireIsoDate(transaction.postingDate)
    safeInteger(transaction.account.minor)
    const card = cardMap.get(transaction.cardId)
    if (!card) throw new DomainError('card.not-found')
    const multiplier = card.abroadMultiplier ?? LATEST_RULES.maximumAbroadMultiplier
    if (!Number.isInteger(multiplier) || multiplier < 0 || multiplier > LATEST_RULES.maximumAbroadMultiplier) throw new DomainError('reward.invalid-multiplier')
    const abroadRate = LATEST_RULES.basicRateBasisPoints * multiplier
    const classification = transaction.classification
    const assumptions: string[] = []
    let tiers: TierReward[]

    if (!classification.eligible || classification.kind !== 'purchase' || transaction.account.minor <= 0) {
      tiers = [emptyTier('basic', LATEST_RULES.basicRateBasisPoints, `transaction.${classification.kind}`), emptyTier('abroad', abroadRate, 'reward.transaction-excluded'), emptyTier('pulse', LATEST_RULES.pulse.rateBasisPoints, 'reward.transaction-excluded')]
    } else {
      const basic: TierReward = { tier: 'basic', rateBasisPoints: LATEST_RULES.basicRateBasisPoints, eligibleMinor: transaction.account.minor, cappedMinor: 0, microRc: microRcForSpend(transaction.account.minor, LATEST_RULES.basicRateBasisPoints), reasonCodes: ['reward.eligible'] }
      const abroadCandidate = classification.region !== null && classification.region !== 'HK' && transaction.original.currency !== 'HKD'
      const abroadEnrolled = card.abroadEnrollment !== 'not-registered' && multiplier > 0
      if (abroadCandidate && abroadEnrolled && (!card.abroadEnrollment || card.abroadMultiplier === undefined)) assumptions.push('assumption.abroad-five-times')
      const abroad = abroadCandidate && abroadEnrolled
        ? cappedTier('abroad', transaction, card, abroadRate, assumptions)
        : emptyTier('abroad', abroadRate, !abroadEnrolled ? 'reward.not-enrolled' : classification.region === null ? 'region.unknown' : transaction.original.currency === 'HKD' ? 'reward.original-hkd' : 'reward.region-excluded')
      const pulseRegion = classification.region === 'CN' || classification.region === 'MO'
      const pulseCurrency = transaction.original.currency === 'CNY' || transaction.original.currency === 'MOP'
      const mobile = ['apple-pay', 'google-pay', 'samsung-pay', 'unionpay-qr'].includes(classification.paymentMethod)
      const pulse = pulseRegion && pulseCurrency && mobile
        ? cappedTier('pulse', transaction, card, LATEST_RULES.pulse.rateBasisPoints, assumptions)
        : emptyTier('pulse', LATEST_RULES.pulse.rateBasisPoints, !pulseRegion ? 'reward.region-excluded' : !pulseCurrency ? 'reward.currency-excluded' : 'reward.payment-excluded')
      tiers = [basic, abroad, pulse]
      if (!card.pool) assumptions.push('assumption.pool-unconfirmed')
    }
    const knownMicroRc = tiers.reduce((sum, tier) => safeInteger(sum + (tier.microRc ?? 0)), 0)
    transactions.push({ transactionId: transaction.id, cardId: card.id, tiers, microRc: tiers.some(tier => tier.microRc === null) ? null : knownMicroRc, knownMicroRc, assumptions })
  }

  const byTransaction = new Map(transactions.map(result => [result.transactionId, result]))
  const summaries: CardRewards[] = cards.map(card => {
    const rows = transactions.filter(result => result.cardId === card.id)
    const totalFor = (tier: RewardTier) => {
      const amounts = rows.map(result => result.tiers.find(item => item.tier === tier)?.microRc ?? null)
      return amounts.some(amount => amount === null) ? null : amounts.reduce<number>((sum, amount) => safeInteger(sum + (amount ?? 0)), 0)
    }
    const basicMicroRc = totalFor('basic') ?? 0, abroadMicroRc = totalFor('abroad'), pulseMicroRc = totalFor('pulse')
    const knownMicroRc = rows.reduce((sum, result) => safeInteger(sum + result.knownMicroRc), 0)
    const totalMicroRc = abroadMicroRc === null || pulseMicroRc === null ? null : safeInteger(basicMicroRc + abroadMicroRc + pulseMicroRc)
    return { cardId: card.id, basicMicroRc, abroadMicroRc, pulseMicroRc, totalMicroRc, knownMicroRc, wholeRc: totalMicroRc === null ? null : Math.floor(totalMicroRc / 1_000_000), remainderMicroRc: totalMicroRc === null ? null : totalMicroRc % 1_000_000 }
  })
  return { ruleId: LATEST_RULES.id, transactions, byTransaction, cards: summaries, pools: [...poolMap.values()].sort((a, b) => a.key.localeCompare(b.key)) }
}
