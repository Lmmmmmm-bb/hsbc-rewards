import { describe, expect, it } from 'vitest'
import { classifyTransaction } from '@/domain/classification/classify'
import { testCard, transaction } from '@/tests/fixtures/dataset'
import { calculateRewards } from './calculate'
import { LATEST_RULES } from './rules'

const run: typeof calculateRewards = (rows, cards, context = { hkdToCnyPpm: 1_000_000 }) => calculateRewards(rows, cards, context)

describe('three-tier reward accrual and independent cap pools', () => {
  it('stacks all three tiers and exposes the enrollment assumption', () => {
    const result = run([transaction()], [testCard])
    expect(result.cards[0]).toMatchObject({ basicMicroRc: 1000000, abroadMicroRc: 5000000, pulseMicroRc: 5000000, totalMicroRc: 11000000 })
    expect(result.transactions[0].assumptions).toContain('assumption.abroad-five-times')
  })
  it('does not confuse a HKD account with original transaction currency', () => {
    const row = transaction({ original: { currency: 'MOP', minor: 25773 }, account: { currency: 'HKD', minor: 25000 }, classification: { ...transaction().classification, region: 'MO', paymentMethod: 'apple-pay' } })
    expect(run([row], [testCard]).cards[0].totalMicroRc).toBe(11000000)
    const originalHkd = { ...row, original: { currency: 'HKD', minor: 25000 } }
    expect(run([originalHkd], [testCard]).cards[0].totalMicroRc).toBe(1000000)
  })
  it('does not reward unknown regions, standard payment or non-enrollment as qualified extras', () => {
    const standard = transaction({ classification: { ...transaction().classification, paymentMethod: 'standard' } })
    expect(run([standard], [testCard]).cards[0].pulseMicroRc).toBe(0)
    expect(run([transaction({ classification: { ...transaction().classification, region: null } })], [testCard]).cards[0].totalMicroRc).toBe(1000000)
    expect(run([transaction()], [{ ...testCard, abroadEnrollment: 'not-registered' }]).cards[0]).toMatchObject({ abroadMicroRc: 0, pulseMicroRc: 5000000 })
  })
  it('clips only the portion crossing the cap, preserving basic rewards', () => {
    const prior = transaction({ id: 'prior', transactionDate: '2026-01-01', account: { currency: 'CNY', minor: LATEST_RULES.abroad.capMinor - 10000 }, classification: { ...transaction().classification, paymentMethod: 'standard' } })
    const result = run([transaction(), prior], [testCard])
    const row = result.byTransaction.get('transaction-a')!
    expect(row.tiers.find(t => t.tier === 'abroad')).toMatchObject({ eligibleMinor: 10000, cappedMinor: 15000, microRc: 2000000 })
    expect(row.tiers.find(t => t.tier === 'basic')?.microRc).toBe(1000000)
  })
  it('ignores refunds without releasing consumed cap', () => {
    const purchase = transaction({ id: 'purchase', transactionDate: '2026-01-01', account: { currency: 'CNY', minor: LATEST_RULES.abroad.capMinor } })
    const refund = transaction({ id: 'refund', transactionDate: '2026-02-01', account: { currency: 'CNY', minor: -100000 }, classification: { ...transaction().classification, kind: 'refund', eligible: false } })
    const result = run([purchase, refund, transaction()], [testCard])
    expect(result.byTransaction.get('refund')?.microRc).toBe(0)
    expect(result.byTransaction.get('transaction-a')?.tiers.find(t => t.tier === 'abroad')?.microRc).toBe(0)
    expect(result.pools.find(pool => pool.tier === 'abroad')?.remainingMinor).toBe(0)
  })
  it('shares a confirmed pool but keeps individual card rewards', () => {
    const pool = { id: 'proven-account', evidence: 'statement-account' as const }
    const cards = [{ ...testCard, pool }, { ...testCard, id: 'card-b', lastFour: '5678', role: 'additional' as const, pool }]
    const prior = transaction({ id: 'prior', transactionDate: '2026-01-01', account: { currency: 'CNY', minor: LATEST_RULES.abroad.capMinor } })
    const result = run([prior, transaction({ cardId: 'card-b' })], cards)
    expect(result.cards.find(card => card.cardId === 'card-b')?.abroadMicroRc).toBe(0)
    expect(result.pools.filter(pool => pool.tier === 'abroad')).toHaveLength(1)
    const independent = run([prior, transaction({ cardId: 'card-b' })], cards.map(card => ({ ...card, pool: undefined })))
    expect(independent.cards.find(card => card.cardId === 'card-b')?.abroadMicroRc).toBe(5000000)
  })
  it('resets historical annual and half-year buckets using transaction dates', () => {
    const rows = ['2024-12-31', '2025-06-30', '2025-07-01', '2026-01-01'].map((date, index) => transaction({ id: `row-${index}`, transactionDate: date, account: { currency: 'CNY', minor: 8000000 } }))
    const result = run(rows, [testCard])
    expect(result.pools.filter(pool => pool.tier === 'pulse').map(pool => pool.period)).toEqual(['2024-H2', '2025-H1', '2025-H2', '2026-H1'])
    expect(result.pools.filter(pool => pool.tier === 'abroad')).toHaveLength(3)
  })
  it('keeps sub-RC accrual without rounding away each transaction', () => {
    const rows = Array.from({ length: 250 }, (_, index) => transaction({ id: `cent-${index}`, original: { currency: 'HKD', minor: 100 }, account: { currency: 'HKD', minor: 100 }, classification: { ...transaction().classification, region: 'HK' } }))
    expect(run(rows, [testCard]).cards[0]).toMatchObject({ basicMicroRc: 1000000, wholeRc: 1, remainderMicroRc: 0 })
  })
  it('is deterministic across import order and rejects ambiguous IDs', () => {
    const a = transaction({ id: 'a' }), b = transaction({ id: 'b' })
    expect(run([a, b], [testCard])).toEqual(run([b, a], [testCard]))
    expect(() => run([a, a], [testCard])).toThrow()
    expect(() => run([a], [])).toThrow()
  })
  it('recalculates foreign-spend cap clipping when the reference quote changes', () => {
    const prior = transaction({ id: 'prior', transactionDate: '2026-01-01', original: { currency: 'USD', minor: 100000 }, account: { currency: 'HKD', minor: 9990000 }, classification: { ...transaction().classification, region: 'US', paymentMethod: 'standard' } })
    const a = run([prior, transaction()], [testCard], { hkdToCnyPpm: 500000 })
    const b = run([prior, transaction()], [testCard], { hkdToCnyPpm: 1000000 })
    expect(a.byTransaction.get('transaction-a')?.tiers.find(t => t.tier === 'abroad')).toMatchObject({ eligibleMinor: 5000, capBasisMinor: 50000, microRc: 1000000 })
    expect(b.byTransaction.get('transaction-a')?.tiers.find(t => t.tier === 'abroad')?.microRc).toBe(2000000)
    expect(a.cards[0].basicMicroRc).toBe(b.cards[0].basicMicroRc)
    expect(a.cards[0].pulseMicroRc).toBe(b.cards[0].pulseMicroRc)
  })
  it('prefers the bank-provided HKD equivalent over the reference quote', () => {
    const row = transaction({ bankHkdEquivalentMinor: 30000 })
    const a = calculateRewards([row], [testCard])
    const b = run([row], [testCard], { hkdToCnyPpm: 500000 })
    expect(a.pools.find(pool => pool.tier === 'abroad')?.usedMinor).toBe(30000)
    expect(a.cards[0].totalMicroRc).toBe(11000000)
    expect(a).toEqual(b)
  })
  it('keeps affected rewards and pool balances unavailable when conversion is missing', () => {
    const result = calculateRewards([transaction()], [testCard])
    expect(result.cards[0]).toMatchObject({ basicMicroRc: 1000000, abroadMicroRc: null, pulseMicroRc: 5000000, totalMicroRc: null, knownMicroRc: 6000000 })
    expect(result.pools.find(pool => pool.tier === 'abroad')).toMatchObject({ usedMinor: null, remainingMinor: null, verification: 'missing-fx' })
  })
  it('propagates an unknown cap only to subsequent rewards in the same shared pool and period', () => {
    const pool = { id: 'confirmed', evidence: 'statement-account' as const }
    const cards = [{ ...testCard, pool }, { ...testCard, id: 'card-b', pool }]
    const missing = transaction({ transactionDate: '2025-01-01' })
    const sameYear = transaction({ id: 'same-year', cardId: 'card-b', transactionDate: '2025-02-01', original: { currency: 'USD', minor: 10000 }, account: { currency: 'HKD', minor: 25000 } })
    const nextYear = { ...sameYear, id: 'next-year', transactionDate: '2026-02-01' }
    const result = calculateRewards([missing, sameYear, nextYear], cards)
    expect(result.byTransaction.get('same-year')?.tiers.find(t => t.tier === 'abroad')?.microRc).toBeNull()
    expect(result.byTransaction.get('next-year')?.tiers.find(t => t.tier === 'abroad')?.microRc).toBe(5000000)
  })
  it('does not require a reference quote for an already exhausted, known cap', () => {
    const prior = transaction({ id: 'prior', transactionDate: '2026-01-01', original: { currency: 'USD', minor: 100000 }, account: { currency: 'HKD', minor: 10000000 } })
    const result = calculateRewards([prior, transaction()], [testCard])
    expect(result.byTransaction.get('transaction-a')?.tiers.find(t => t.tier === 'abroad')?.microRc).toBe(0)
    expect(result.pools.find(pool => pool.tier === 'abroad')?.remainingMinor).toBe(0)
  })
})

describe('reward eligibility reasons', () => {
  it('explains excluded reloads, nonpositive values and unknown regions without changing reward amounts', () => {
    const reload = classifyTransaction(
      transaction({ description: 'SYNTHETIC EWALLET TOP UP CN' }),
    )
    const result = calculateRewards([reload], [testCard])
    expect(result.cards[0].totalMicroRc).toBe(0)
    expect(
      result.transactions[0].tiers.every((tier) =>
        tier.reasonCodes.includes('eligibility.excluded-merchant'),
      ),
    ).toBe(true)
    const zero = calculateRewards(
      [transaction({ account: { currency: 'CNY', minor: 0 } })],
      [testCard],
    )
    expect(
      zero.transactions[0].tiers.every((tier) =>
        tier.reasonCodes.includes('transaction.non-positive'),
      ),
    ).toBe(true)
    const unknown = calculateRewards(
      [
        transaction({
          classification: { ...transaction().classification, region: null },
        }),
      ],
      [testCard],
    )
    expect(unknown.cards[0].totalMicroRc).toBe(1000000)
    expect(
      unknown.transactions[0].tiers.find((tier) => tier.tier === 'pulse')
        ?.reasonCodes,
    ).toEqual(['region.unknown'])
  })
})
