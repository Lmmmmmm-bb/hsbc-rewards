import { describe, expect, it } from 'vitest'
import { transaction } from '@/test-support/fixtures/dataset'
import { classifyTransaction, identifyPayment, identifyRegion } from './classify'

describe('automatic transaction evidence', () => {
  it('uses a country suffix and does not infer geography from currency or city alone', () => {
    expect(identifyRegion('SAMPLE MERCHANT CHN')).toBe('CN')
    expect(identifyRegion('SAMPLE MERCHANT HONG KONG')).toBe('HK')
    expect(identifyRegion('SAMPLE MERCHANT SH')).toBeNull()
    expect(classifyTransaction(transaction({ description: 'UNIDENTIFIED MERCHANT' })).classification.region).toBeNull()
  })
  it.each([['APPLE-PAY STORE CN', 'apple-pay'], ['GOOGLE PAY STORE MO', 'google-pay'], ['G PAY STORE CN', 'google-pay'], ['SAMSUNG PAY STORE CN', 'samsung-pay'], ['UNION PAY QR STORE CN', 'unionpay-qr'], ['UNION PAY STORE CN', 'standard']])('identifies explicit payment evidence %s', (description, expected) => expect(identifyPayment(description)).toBe(expected))
  it.each([['REFUND SAMPLE CN', -25000, 'refund'], ['PAYMENT RECEIVED', -25000, 'repayment'], ['FINANCE CHARGE', 2500, 'fee'], ['CASH ADVANCE', 25000, 'cash-advance'], ['OTHER CREDIT', -25000, 'credit']])('excludes non-retail entry %s from rewards', (description, minor, kind) => {
    const classified = classifyTransaction(transaction({ description, account: { currency: 'CNY', minor } }))
    expect(classified.classification.kind).toBe(kind)
    expect(classified.classification.eligible).toBe(false)
  })
  it('excludes explicit reloads without excluding ordinary mobile payments', () => {
    expect(classifyTransaction(transaction({ description: 'EWALLET TOP UP CN' })).classification.eligible).toBe(false)
    expect(classifyTransaction(transaction({ description: 'ALIPAY CAFE CN' })).classification.eligible).toBe(true)
  })
  it('does not lower confidence for a repayment just because geography is inapplicable', () => {
    expect(classifyTransaction(transaction({ description: 'PAYMENT RECEIVED', account: { currency: 'CNY', minor: -25000 } })).confidence).toBe(1)
  })
  it('recognizes the bank payment separator without treating it as a generic credit', () => {
    expect(classifyTransaction(transaction({ description: 'IFS PAYMENT - THANK YOU', account: { currency: 'HKD', minor: -80000 } })).classification.kind).toBe('repayment')
  })
})
