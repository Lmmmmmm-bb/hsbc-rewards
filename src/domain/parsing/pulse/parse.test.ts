import { describe, expect, it } from 'vitest'
import { parsePulseStatement, pulseAccountNumbers } from './parse'
import { readPulseMetadata } from './metadata'
import {
  line,
  purchase,
  pulseAccounts,
  pulseFile,
  pulseIdentity,
  pulsePage,
} from '@/test-support/pulse-statement'
import { reconcileStatement } from '@/domain/reconciliation/reconcile'
import { calculateRewards } from '@/domain/rewards/calculate'

const parse = (pages: Parameters<typeof parsePulseStatement>[0]) =>
  parsePulseStatement(pages, pulseFile, pulseIdentity())

describe('HSBC Pulse English statement parser', () => {
  it('accepts a combined Amount and currency header span while preserving posted-money column boundaries', () => {
    const page = pulsePage({
      closing: '10.00',
      ledger: [purchase('SYNTHETIC STORE CN', '10.00')],
    })
    const rows = page.rows.map((row) =>
      row.text.startsWith('Post date')
        ? {
            ...row,
            spans: [
              ...row.spans.filter(
                (span) => !['Amount', '(CNY)'].includes(span.text),
              ),
              {
                text: 'Amount (CNY)',
                bounds: { x: 495, y: row.bounds.y, width: 60, height: 10 },
              },
            ],
          }
        : row,
    )
    expect(parse([{ ...page, rows }]).transactions[0].account.minor).toBe(1000)
  })
  it('links different HKD and CNY account numbers to one card and keeps empty accounts', () => {
    const dataset = parse([
      pulsePage({ currency: 'HKD' }),
      pulsePage({
        page: 2,
        closing: '80.00',
        ledger: [
          purchase('SYNTHETIC STORE CHN CN', '100.00'),
          line('APPLE PAY-MOBILE:0000'),
          purchase('REFUND SYNTHETIC STORE CHN CN', '20.00 CR'),
        ],
      }),
    ])
    expect(dataset.cards).toHaveLength(1)
    expect(dataset.cards[0]).toMatchObject({
      lastFour: '4444',
      role: 'unknown',
    })
    expect(dataset.statements[0].accounts).toHaveLength(2)
    expect(dataset.transactions).toHaveLength(2)
    expect(dataset.transactions[0].classification).toMatchObject({
      region: 'CN',
      paymentMethod: 'apple-pay',
      eligible: true,
    })
    expect(dataset.transactions[0].description).toBe('SYNTHETIC STORE CHN CN')
    expect(dataset.transactions[0].sources).toHaveLength(2)
    expect(dataset.transactions[1].account.minor).toBe(-2000)
    expect(
      reconcileStatement(dataset.statements[0], dataset.transactions).map(
        (account) => account.status,
      ),
    ).toEqual(['matched', 'matched'])
    expect(dataset.statements[0].warnings).toContainEqual({
      code: 'statement.period-inferred',
    })
    expect(dataset.cards[0].id).not.toContain('1111222233334444')
  })

  it('does not turn a RewardCash summary or illustrative APR table into transactions', () => {
    const dataset = parse([
      pulsePage({
        closing: '250.00',
        ledger: [
          purchase('SYNTHETIC CAFE CN', '250.00'),
          line('UNIONPAY QR'),
          line('**** REWARDCASH SUMMARY FOR CARD NUMBER ****'),
          line('REWARDCASH EARNED : 10'),
          purchase('ILLUSTRATIVE EXAMPLE CN', '20000.00'),
        ],
      }),
    ])
    expect(dataset.transactions).toHaveLength(1)
    expect(dataset.transactions[0].classification.paymentMethod).toBe(
      'unionpay-qr',
    )
    expect(
      calculateRewards(dataset.transactions, dataset.cards, {
        hkdToCnyPpm: 900000,
      }).cards[0].pulseMicroRc,
    ).toBe(5000000)
  })

  it('retains continuations across pages, skipping an intervening non-table terms page', () => {
    const first = pulsePage({
      end: false,
      closing: '10.00',
      ledger: [purchase('SYNTHETIC STORE CN', '10.00')],
    })
    const terms = { ...pulsePage({ page: 2 }), rows: [pulsePage().rows[0]] }
    const next = pulsePage({
      page: 3,
      opening: null,
      closing: '10.00',
      ledger: [line('APPLE PAY-MOBILE:0000')],
    })
    const dataset = parse([first, terms, next])
    expect(dataset.transactions).toHaveLength(1)
    expect(dataset.transactions[0].classification.paymentMethod).toBe(
      'apple-pay',
    )
    expect(
      dataset.transactions[0].sources.map((source) => source.page),
    ).toEqual([1, 3])
  })

  it('parses January postings and the preceding December transaction independently', () => {
    const dataset = parse([
      pulsePage({
        date: '20 JAN 2026',
        closing: '20.00',
        ledger: [purchase('SYNTHETIC STORE CN', '20.00', '02JAN', '31DEC')],
      }),
    ])
    expect(dataset.transactions[0]).toMatchObject({
      postingDate: '2026-01-02',
      transactionDate: '2025-12-31',
    })
  })
  it('continues a sub-account after the first page payment stub without parsing the stub as a merchant', () => {
    const first = pulsePage({
      end: false,
      closing: '30.00',
      ledger: [
        purchase('SYNTHETIC STORE CN', '10.00'),
        line(
          'For important information such as payment methods, fees and charges',
        ),
        line('PO BOX NO. 00000'),
      ],
    })
    const next = pulsePage({
      page: 2,
      opening: null,
      closing: '30.00',
      ledger: [purchase('SYNTHETIC CAFE CN', '20.00')],
    })
    const dataset = parse([first, next])
    expect(dataset.transactions).toHaveLength(2)
    expect(
      reconcileStatement(dataset.statements[0], dataset.transactions)[0].status,
    ).toBe('matched')
  })

  it('keeps original foreign money distinct from posted money and bank HKD equivalent', () => {
    const dataset = parse([
      pulsePage({
        currency: 'HKD',
        closing: '78.00',
        ledger: [
          purchase('SYNTHETIC SHOP USA US', '78.00'),
          line('ORIGINAL AMOUNT: USD 10.00'),
          line('HKD EQUIVALENT: 78.00'),
          line('EXCHANGE RATE: 7.8000'),
        ],
      }),
    ])
    expect(dataset.transactions[0]).toMatchObject({
      original: { currency: 'USD', minor: 1000 },
      account: { currency: 'HKD', minor: 7800 },
      bankHkdEquivalentMinor: 7800,
    })
    expect(dataset.transactions[0].classification.region).toBe('US')
  })

  it('does not fabricate foreign eligibility when original currency evidence is missing', () => {
    const dataset = parse([
      pulsePage({
        currency: 'HKD',
        closing: '78.00',
        ledger: [purchase('SYNTHETIC SHOP USA US', '78.00')],
      }),
    ])
    expect(dataset.transactions[0].original.currency).toBe('XXX')
    const result = calculateRewards(dataset.transactions, dataset.cards)
    expect(result.cards[0]).toMatchObject({
      basicMicroRc: 312000,
      abroadMicroRc: 0,
      pulseMicroRc: 0,
    })
    expect(result.transactions[0].tiers[1].reasonCodes).toContain(
      'currency.original-unknown',
    )
  })

  it('recognizes a separate card block and shares only the explicitly common statement account', () => {
    const dataset = parse([
      pulsePage({
        closing: '30.00',
        ledger: [
          purchase('SYNTHETIC STORE CN', '10.00'),
          line(`ADDITIONAL CARD NUMBER ${pulseAccounts.additional}`),
          purchase('SYNTHETIC CAFE CN', '20.00'),
        ],
      }),
    ])
    expect(dataset.cards).toHaveLength(2)
    expect(dataset.cards[1].role).toBe('additional')
    expect(dataset.cards[0].pool).toEqual(dataset.cards[1].pool)
    expect(dataset.cards[0].pool?.evidence).toBe('statement-account')
    expect(dataset.transactions[0].cardId).not.toBe(
      dataset.transactions[1].cardId,
    )
    expect(dataset.transactions[0].accountId).toBe(
      dataset.transactions[1].accountId,
    )
  })

  it('records explicit allocation and the agreed decision to ignore the registration period', () => {
    const dataset = parse([
      pulsePage({
        closing: '10.00',
        ledger: [
          purchase('SYNTHETIC STORE CN', '10.00', '12OCT', '11OCT'),
          line('**** REWARDCASH SUMMARY ****'),
          line('5X REWARDCASH IN OVERSEAS&MAINLAND CN-2026'),
          line('THE EFFECTIVE PERIOD IS FROM 16OCT2026 TO 31DEC2026.'),
        ],
      }),
    ])
    expect(dataset.cards[0]).toMatchObject({
      abroadEnrollment: 'registered',
      abroadMultiplier: 5,
    })
    expect(dataset.statements[0].warnings).toContainEqual({
      code: 'assumption.enrollment-period-ignored',
    })
    expect(
      calculateRewards(dataset.transactions, dataset.cards, {
        hkdToCnyPpm: 900000,
      }).cards[0].abroadMicroRc,
    ).toBe(200000)
  })

  it('leaves absent opening balance unknown and reports unverified reconciliation', () => {
    const dataset = parse([
      pulsePage({
        opening: null,
        closing: '1.00',
        ledger: [purchase('SYNTHETIC STORE CN', '1.00')],
      }),
    ])
    expect(
      reconcileStatement(dataset.statements[0], dataset.transactions)[0].status,
    ).toBe('unverified')
  })
  it('does not create irrelevant foreign-currency warnings for a bank fee', () => {
    const dataset = parse([
      pulsePage({
        currency: 'HKD',
        closing: '10.00',
        ledger: [purchase('FINANCE CHARGE', '10.00')],
      }),
    ])
    expect(dataset.transactions[0].classification.kind).toBe('fee')
    expect(dataset.transactions[0].warnings).toEqual([])
  })

  it('extracts identifier candidates for caller-side hashing without leaking raw IDs in parsed identifiers', () => {
    const pages = [pulsePage()]
    expect(pulseAccountNumbers(pages)).toEqual([
      '1111222233334444',
      '5555666677778888',
    ])
    expect(() =>
      parsePulseStatement(pages, pulseFile, (_, number) => number),
    ).toThrow('parse.invalid-opaque-identity')
    expect(() =>
      parsePulseStatement(
        [pulsePage({ currency: 'HKD' }), pulsePage({ page: 2 })],
        pulseFile,
        () => 'same',
      ),
    ).toThrow('parse.identity-collision')
  })

  it('rejects incompatible templates, missing pages and conflicting balances instead of returning a partial success', () => {
    expect(() => parse([{ ...pulsePage(), rows: [] }])).toThrow(
      'parse.unsupported-template',
    )
    expect(() => parse([pulsePage({ page: 2 })])).toThrow(
      'parse.incomplete-pages',
    )
    expect(() =>
      parse([pulsePage(), pulsePage({ page: 2, closing: '10.00' })]),
    ).toThrow('parse.conflicting-balances')
  })

  it('rejects malformed dated rows and contradictory payment or original-amount continuations', () => {
    expect(() =>
      parse([pulsePage({ ledger: [purchase('SYNTHETIC STORE CN', 'BAD')] })]),
    ).toThrow()
    expect(() =>
      parse([
        pulsePage({
          ledger: [purchase('SYNTHETIC STORE CN', '1.00', '31FEB')],
        }),
      ]),
    ).toThrow()
    expect(() =>
      parse([
        pulsePage({
          ledger: [
            purchase('SYNTHETIC STORE CN', '1.00'),
            line('APPLE PAY-MOBILE:0000'),
            line('UNIONPAY QR'),
          ],
        }),
      ]),
    ).toThrow('parse.conflicting-payment-method')
    expect(() =>
      parse([
        pulsePage({
          ledger: [
            purchase('SYNTHETIC STORE CN', '1.00'),
            line('USD 1.00'),
            line('USD 2.00'),
          ],
        }),
      ]),
    ).toThrow('parse.conflicting-original-amount')
  })

  it('does not discard wrapped merchant text or silently accept an unplaced money row', () => {
    const dataset = parse([
      pulsePage({
        closing: '2.00',
        ledger: [purchase('SYNTHETIC LONG', '2.00'), line('MERCHANT CHN CN')],
      }),
    ])
    expect(dataset.transactions[0].description).toBe(
      'SYNTHETIC LONG MERCHANT CHN CN',
    )
    expect(() =>
      parse([
        pulsePage({
          ledger: [purchase('SYNTHETIC STORE CN', '1.00'), line('99.00', 510)],
        }),
      ]),
    ).toThrow('parse.ambiguous-continuation')
  })

  it('rejects conflicting printed dates and a missing HKD-to-CNY account association', () => {
    expect(() =>
      readPulseMetadata([
        pulsePage(),
        pulsePage({ page: 2, date: '21 OCT 2026' }),
      ]),
    ).toThrow('parse.conflicting-statement-dates')
    const page = pulsePage()
    expect(() =>
      parse([
        {
          ...page,
          rows: page.rows.filter((row) => !row.text.includes('Credit Limit')),
        },
      ]),
    ).toThrow('parse.missing-card-association')
  })
  it('reads the repeated payment-stub date column without including its adjacent balance', () => {
    const page = pulsePage()
    const stub = pulsePage()
      .rows.slice(0, 2)
      .map((row, index) => ({
        ...row,
        row: page.rows.length + index + 1,
        text:
          index === 0
            ? 'Statement date Statement balance'
            : '20 OCT 2026 CNY0.00',
        spans:
          index === 0
            ? [
                {
                  text: 'Statement date',
                  bounds: { x: 100, y: 720, width: 80, height: 10 },
                },
                {
                  text: 'Statement balance',
                  bounds: { x: 260, y: 720, width: 90, height: 10 },
                },
              ]
            : [
                {
                  text: '20 OCT 2026',
                  bounds: { x: 100, y: 734, width: 90, height: 10 },
                },
                {
                  text: 'CNY0.00',
                  bounds: { x: 260, y: 734, width: 50, height: 10 },
                },
              ],
      }))
    expect(
      parse([{ ...page, rows: [...page.rows, ...stub] }]).statements[0].date,
    ).toBe('2026-10-20')
  })
})
