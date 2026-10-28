import type { Category, Classification, NormalizedTransaction, PaymentMethod, Transaction, TransactionKind } from '../model/types'

const regionAliases: Readonly<Record<string, string>> = {
  HK: 'HK', HKG: 'HK', 'HONG KONG': 'HK', CN: 'CN', CHN: 'CN', CHINA: 'CN',
  MO: 'MO', MAC: 'MO', MACAU: 'MO', MACAO: 'MO', JP: 'JP', JPN: 'JP', JAPAN: 'JP',
  US: 'US', USA: 'US', GB: 'GB', GBR: 'GB', UK: 'GB', SG: 'SG', SGP: 'SG',
  TW: 'TW', TWN: 'TW', KR: 'KR', KOR: 'KR', TH: 'TH', THA: 'TH',
  AU: 'AU', AUS: 'AU', CA: 'CA', CAN: 'CA', FR: 'FR', FRA: 'FR', DE: 'DE', DEU: 'DE',
}

export function identifyRegion(description: string): string | null {
  const text = description.trim().toUpperCase().replace(/[.,]+$/, '')
  for (const alias of Object.keys(regionAliases).sort((a, b) => b.length - a.length)) {
    if (text === alias || text.endsWith(` ${alias}`) || text.endsWith(`*${alias}`)) return regionAliases[alias]
  }

  return null
}

export function identifyPayment(description: string): PaymentMethod {
  if (/\bAPPLE[\s-]*PAY\b/i.test(description)) return 'apple-pay'
  if (/\b(?:GOOGLE|G)[\s-]*PAY\b/i.test(description)) return 'google-pay'
  if (/\bSAMSUNG[\s-]*PAY\b/i.test(description)) return 'samsung-pay'
  if (/\b(?:UNION\s*PAY.*)?QR(?:\s*CODE)?\b|银联.*(?:二维码|二維碼)/i.test(description)) return 'unionpay-qr'
  return 'standard'
}

function kindOf(text: string, amountMinor: number): TransactionKind {
  if (/\b(?:REFUND|REVERSAL|REVERSED|MERCHANT CREDIT)\b/i.test(text)) return 'refund'
  if (/\b(?:PAYMENT RECEIVED|PAYMENT THANK YOU|AUTOPAY|AUTO PAY|DIRECT DEBIT|REPAYMENT)\b/i.test(text.replace(/\s*-\s*/g, ' '))) return 'repayment'
  if (/\b(?:FINANCE CHARGE|ANNUAL FEE|LATE (?:CHARGE|FEE)|INTEREST|REPLACEMENT FEE|SERVICE CHARGE)\b/i.test(text)) return 'fee'
  if (/\b(?:CASH ADVANCE|CASH (?:INSTALMENT|INSTALLMENT)|SPENDING (?:INSTALMENT|INSTALLMENT))\b/i.test(text)) return 'cash-advance'
  return amountMinor < 0 ? 'credit' : 'purchase'
}

function categoryOf(text: string, kind: TransactionKind): Category {
  if (kind !== 'purchase') return kind === 'credit' ? 'other' : kind
  if (/\b(?:CAFE|COFFEE|RESTAURANT|DINING|KITCHEN|BAKERY)\b|餐饮|餐廳|餐厅/i.test(text)) return 'dining'
  if (/\b(?:SUPERMARKET|GROCERY|GROCERIES|MARKET)\b|超市/i.test(text)) return 'groceries'
  if (/\b(?:AIRLINE|AIRWAYS|HOTEL|TRAVEL|BOOKING)\b|酒店/i.test(text)) return 'travel'
  if (/\b(?:MTR|TAXI|UBER|TRANSPORT|RAILWAY|TRAIN|BUS)\b/i.test(text)) return 'transport'
  if (/\b(?:SHOP|STORE|MALL|RETAIL)\b|商店/i.test(text)) return 'shopping'
  return 'other'
}

export function classify(transaction: NormalizedTransaction): Classification {
  const text = transaction.description, kind = kindOf(text, transaction.account.minor)
  const excluded = /\b(?:TOP[ -]?UP|RELOAD|WIRE TRANSFER|TAX PAYMENT|BILL PAYMENT|BETTING|GAMBLING|QUASI CASH|CRYPTO)\b/i.test(text)
  const region = identifyRegion(text)

  return {
    kind,
    category: categoryOf(text, kind),
    region,
    paymentMethod: identifyPayment(text),
    eligible: kind === 'purchase' && transaction.account.minor > 0 && !excluded,
    reasonCodes: [...(kind !== 'purchase' ? [`transaction.${kind}`] : []), ...(excluded ? ['eligibility.excluded-merchant'] : []), ...(!region ? ['region.unknown'] : [])],
  }
}

export function classifyTransaction(transaction: NormalizedTransaction): Transaction {
  const classification = classify(transaction)
  const missingRegion = !classification.region && classification.kind === 'purchase'

  return {
    ...transaction,
    classification,
    confidence: missingRegion ? Math.min(transaction.confidence, .75) : transaction.confidence,
    warnings: [...transaction.warnings, ...(missingRegion ? [{ code: 'region.unknown', source: transaction.sources[0] }] : [])],
  }
}
