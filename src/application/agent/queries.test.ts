import { afterEach, describe, expect, it } from 'vitest'
import type { Dataset } from '@/domain/model/types'
import { testCard, statement, transaction } from '@/tests/fixtures/dataset'
import { createMemorySession } from '@/store/memory-session'
import { deriveWorkspace } from '../session/selectors'
import { createAgentSnapshots } from './snapshots'
import { getAgentCardRewards, getAgentSummary } from './reward-queries'
import { listAgentTransactions } from './transaction-query'
import { getAgentQuality } from './quality-query'

const disposers: Array<() => void> = []
afterEach(() => disposers.splice(0).forEach((dispose) => dispose()))

function setup(dataset: Dataset = { cards: [testCard], statements: [statement()], transactions: [transaction()] }) {
  const store = createMemorySession()
  store.replace(dataset, 'real')
  let id = 0
  const snapshots = createAgentSnapshots(store, () => `synthetic-${++id}`)
  disposers.push(() => snapshots.dispose())

  return { store, snapshots }
}

describe('agent result queries', () => {
  it('separates known amounts, missing calculation inputs, and uncertain eligibility', () => {
    const { store, snapshots } = setup()
    const pending = getAgentSummary(snapshots)

    expect(pending.data).toMatchObject({ calculationStatus: 'partial', totalRewardMicroRc: null,
      pendingTransactionCount: 1, uncertainEligibilityCount: 0 })
    expect(pending.data.knownRewardMicroRc).toBeGreaterThan(0)

    store.replace({ ...store.getSnapshot().dataset, transactions: [transaction({
      classification: { ...transaction().classification, region: null },
    })] }, 'real')
    const uncertain = getAgentSummary(snapshots)

    expect(uncertain.data).toMatchObject({ calculationStatus: 'calculated', pendingTransactionCount: 0, uncertainEligibilityCount: 1 })
    expect(uncertain.data.totalRewardMicroRc).toBeGreaterThan(0)

    const rows = listAgentTransactions(snapshots, { resultToken: uncertain.meta.resultToken, flags: ['uncertain'], component: 'pulse' })

    expect(rows.data.items[0]).toMatchObject({ matchedComponents: ['pulse'] })
    expect(rows.data.items[0].components.find((component) => component.component === 'pulse')).toMatchObject({
      microRc: 0, flags: { pending: false, uncertain: true, excluded: false },
    })
  })

  it('projects globally capped rewards and historical pool snapshots without adding shared caps twice', () => {
    const cards = [
      { ...testCard, id: 'a', statementIds: ['first', 'second'], pool: { id: 'private-pool', evidence: 'statement-account' as const } },
      { ...testCard, id: 'b', lastFour: '5678', statementIds: ['first', 'second'], pool: { id: 'private-pool', evidence: 'statement-account' as const } },
    ]
    const rows = [
      transaction({ id: 'h1-a', cardId: 'a', transactionDate: '2026-03-01', postingDate: '2026-03-02',
        account: { currency: 'HKD', minor: 8_000_000 }, original: { currency: 'CNY', minor: 8_000_000 } }),
      transaction({ id: 'h1-b', cardId: 'b', transactionDate: '2026-04-01', postingDate: '2026-04-02',
        account: { currency: 'HKD', minor: 1_000_000 }, original: { currency: 'CNY', minor: 1_000_000 } }),
      transaction({ id: 'h2-b', cardId: 'b', transactionDate: '2026-10-01', postingDate: '2026-10-02',
        account: { currency: 'HKD', minor: 2_000_000 }, original: { currency: 'CNY', minor: 2_000_000 } }),
    ]
    const { store, snapshots } = setup({ cards, statements: [statement({ id: 'first', date: '2026-04-20' }), statement({ id: 'second' })], transactions: rows })
    const summary = getAgentSummary(snapshots, { periodId: '2026-H2' })
    const cardRef = summary.data.cards.items.find((card) => card.maskedLastFour === '••5678')!.cardRef
    const second = getAgentCardRewards(snapshots, { cardRef, periodId: '2026-H2', resultToken: summary.meta.resultToken })
    const first = getAgentCardRewards(snapshots, { cardRef, periodId: '2026-H1', resultToken: summary.meta.resultToken })
    const existing = deriveWorkspace(store.getSnapshot()).periods.find((period) => period.id === '2026-H2')!

    expect(second.data.totalRewardMicroRc).toBe(existing.totalRewardMicroRc)
    expect(second.data.pools.filter((pool) => pool.component === 'abroad')).toEqual([
      expect.objectContaining({ shared: true, period: '2026', basisCode: 'hkd-equivalent', asOf: '2026-12-31', usedMinor: 10_000_000, remainingMinor: 0,
        cardRefs: expect.arrayContaining([cardRef]) }),
    ])
    expect(first.data.pools.find((pool) => pool.component === 'abroad')).toMatchObject({ asOf: '2026-06-30', usedMinor: 9_000_000, remainingMinor: 1_000_000 })
    expect(second.data.pools.find((pool) => pool.component === 'pulse')).toMatchObject({ basisCode: 'pulse-hkd-cny', scale: 100 })
  })

  it('keeps paginated results stable and rejects a cursor used with different filters or FX evidence', () => {
    const { store, snapshots } = setup({ cards: [testCard], statements: [statement()], transactions: Array.from({ length: 23 }, (_, i) => transaction({ id: `row-${i}`, postingDate: `2026-10-${String(i + 1).padStart(2, '0')}` })) })
    const resultToken = getAgentSummary(snapshots).meta.resultToken
    const first = listAgentTransactions(snapshots, { resultToken })

    expect(first.data.items).toHaveLength(10)
    expect(first.data.totalCount).toBe(23)

    const second = listAgentTransactions(snapshots, { resultToken, cursor: first.data.nextCursor! })

    expect(new Set([...first.data.items, ...second.data.items].map((row) => row.transactionRef)).size).toBe(20)
    expect(() => listAgentTransactions(snapshots, { resultToken, cursor: first.data.nextCursor!, includeDescription: true })).toThrow('agent.cursor_invalid')

    store.setFx({ source: 'live', hkdToCnyPpm: 900000, stale: false, rateDate: '2026-10-27', retrievedAt: 1 })

    expect(() => listAgentTransactions(snapshots, { resultToken, cursor: first.data.nextCursor! })).toThrow('agent.result_changed')
    expect(getAgentSummary(snapshots).meta.resultToken).not.toBe(resultToken)
  })

  it('returns only explicit fields and makes transaction descriptions opt-in', () => {
    const { snapshots } = setup({ cards: [{ ...testCard, id: 'PRIVATE_CARD_ID', holderName: 'PRIVATE_NAME' }],
      statements: [statement({ fileName: 'PRIVATE_FILE.pdf', fileHash: 'PRIVATE_HASH' })],
      transactions: [transaction({ cardId: 'PRIVATE_CARD_ID', description: 'PRIVATE_DESCRIPTION', bankReference: 'PRIVATE_BANK_REF', sources: [{ statementId: 'statement-a', fileHash: 'PRIVATE_HASH', page: 1, row: 1, text: 'PRIVATE_RAW_TEXT' }] })] })
    const summary = getAgentSummary(snapshots)
    const resultToken = summary.meta.resultToken
    const cardRef = summary.data.cards.items[0].cardRef
    const encoded = JSON.stringify([summary, getAgentCardRewards(snapshots, { cardRef, resultToken }), listAgentTransactions(snapshots, { resultToken }), getAgentQuality(snapshots, { resultToken })])

    expect(encoded).not.toContain('PRIVATE_')
    expect(listAgentTransactions(snapshots, { resultToken, includeDescription: true }).data.items[0].description).toBe('PRIVATE_DESCRIPTION')
  })

  it('reconciles the complete source statement while filtering transaction issues by half-year', () => {
    const rows = [transaction({ id: 'first', transactionDate: '2026-06-30', warnings: [{ code: 'date.outside-period' }] }), transaction({ id: 'second', transactionDate: '2026-07-01' })]
    const { snapshots } = setup({ cards: [{ ...testCard, statementIds: ['statement-a'], accountIds: ['account-cny'] }],
      statements: [statement({ date: '2026-07-20', accounts: [{ id: 'account-cny', currency: 'CNY', openingMinor: 0, closingMinor: 50_000 }] })], transactions: rows })
    const resultToken = getAgentSummary(snapshots).meta.resultToken
    const quality = getAgentQuality(snapshots, { resultToken, periodId: '2026-H1' })

    expect(quality.data.issues.items).toContainEqual(expect.objectContaining({ kind: 'reconciliation', scope: 'full-source-statement', status: 'matched', deltaMinor: 0 }))
    expect(quality.data.issues.items.filter((item) => item.kind === 'transaction')).toHaveLength(1)
  })

  it('does not return a fabricated original amount when original currency is unknown', () => {
    const { snapshots } = setup({ cards: [testCard], statements: [statement()], transactions: [transaction({ original: { currency: 'XXX', minor: 25000 } })] })
    const resultToken = getAgentSummary(snapshots).meta.resultToken

    expect(listAgentTransactions(snapshots, { resultToken }).data.items[0]).toMatchObject({ original: null, account: { currency: 'CNY', minor: 25000 } })
  })

  it('keeps half-year source counts and reconciliation items aligned for global and card queries', () => {
    const sources = [
      statement({ id: 'july', fileHash: 'july', date: '2026-07-20',
        accounts: [{ id: 'account-cny', currency: 'CNY', openingMinor: 0, closingMinor: 25001 }] }),
      statement({ id: 'august', fileHash: 'august', date: '2026-08-20',
        accounts: [{ id: 'account-cny', currency: 'CNY', openingMinor: 0, closingMinor: 25000 }] }),
    ]
    const rows = ['2026-06-30', '2026-08-01'].map((date, index) => transaction({
      id: `row-${index}`, transactionDate: date, postingDate: date,
      sources: [{ statementId: sources[index].id, fileHash: sources[index].fileHash, page: 1, row: 1, text: 'SYNTHETIC' }],
    }))
    const { snapshots } = setup({ cards: [{ ...testCard, statementIds: ['july', 'august'], accountIds: ['account-cny'] }], statements: sources, transactions: rows })
    for (const periodId of ['2026-H1', '2026-H2']) {
      const summary = getAgentSummary(snapshots, { periodId })
      expect(summary.data.statementCount).toBe(1)
      const cardRef = summary.data.cards.items[0].cardRef
      for (const card of [undefined, cardRef]) {
        const quality = getAgentQuality(snapshots, { periodId, cardRef: card, resultToken: summary.meta.resultToken })
        const checks = quality.data.issues.items.filter((item) => item.kind === 'reconciliation')
        expect(checks).toHaveLength(summary.data.statementCount)
        expect(checks.filter((item) => item.status === 'mismatch')).toHaveLength(summary.data.quality.mismatchAccounts)
        expect(checks[0].statementDate).toBe(periodId === '2026-H1' ? '2026-07-20' : '2026-08-20')
      }
    }
  })

  it('links every retained transaction source to identifiable, privacy-safe statement checks', () => {
    const first = statement({ id: 'first', fileHash: 'PRIVATE_HASH_ONE', fileName: 'PRIVATE_ONE.pdf', date: '2026-07-20' })
    const second = statement({ id: 'second', fileHash: 'PRIVATE_HASH_TWO', fileName: 'PRIVATE_TWO.pdf', date: '2026-08-20' })
    const row = transaction({ transactionDate: '2026-06-30', sources: [first, second].map((source) => ({
      statementId: source.id, fileHash: source.fileHash, page: 1, row: 1, text: 'PRIVATE_RAW_ROW',
    })) })
    const { snapshots } = setup({ cards: [{ ...testCard, statementIds: ['first', 'second'], accountIds: ['account-cny'] }], statements: [first, second], transactions: [row] })
    const summary = getAgentSummary(snapshots, { periodId: '2026-H1' })
    const token = summary.meta.resultToken
    const quality = getAgentQuality(snapshots, { resultToken: token, periodId: '2026-H1' })
    const checks = quality.data.issues.items.filter((item) => item.kind === 'reconciliation')
    expect(checks.map((item) => item.statementDate)).toEqual(['2026-07-20', '2026-08-20'])
    expect(checks[0]).toMatchObject({ statementPeriod: first.period, cardRefs: [summary.data.cards.items[0].cardRef] })
    const transactions = listAgentTransactions(snapshots, { resultToken: token, periodId: '2026-H1' })
    expect(transactions.data.items[0].statementRefs).toEqual(checks.map((item) => item.statementRef))
    expect(JSON.stringify([transactions, quality])).not.toContain('PRIVATE_')
  })

  it('retains zero-transaction statement checks and distinguishes empty sessions from zero estimates', () => {
    const { store, snapshots } = setup({ cards: [testCard], statements: [statement()], transactions: [] })
    const summary = getAgentSummary(snapshots)

    expect(summary.data).toMatchObject({ totalRewardMicroRc: 0, pendingTransactionCount: 0 })
    expect(getAgentQuality(snapshots, { resultToken: summary.meta.resultToken }).data.issues.items)
      .toContainEqual(expect.objectContaining({ kind: 'reconciliation', scope: 'full-source-statement' }))
    expect(getAgentQuality(snapshots, { resultToken: summary.meta.resultToken, periodId: '2026-H2' }).data.issues.items)
      .toContainEqual(expect.objectContaining({ kind: 'reconciliation', statementDate: '2026-10-20' }))
    expect(() => getAgentSummary(snapshots, { cursor: 'cursor_without_version' })).toThrow('agent.invalid_arguments')

    store.clear()

    expect(() => getAgentSummary(snapshots)).toThrow('agent.no_results')
  })

  it('invalidates old aliases even when a cleared session is reimported before the next query', () => {
    const { store, snapshots } = setup()
    const old = getAgentSummary(snapshots)
    const dataset = store.getSnapshot().dataset
    store.clear()
    store.replace(dataset, 'real')
    const current = getAgentSummary(snapshots)

    expect(current.data.cards.items[0].cardRef).not.toBe(old.data.cards.items[0].cardRef)
    expect(() => getAgentCardRewards(snapshots, { cardRef: old.data.cards.items[0].cardRef, resultToken: current.meta.resultToken })).toThrow('agent.card_not_found')
    expect(() => getAgentCardRewards(snapshots, { cardRef: current.data.cards.items[0].cardRef, resultToken: old.meta.resultToken })).toThrow('agent.result_changed')
  })
})
