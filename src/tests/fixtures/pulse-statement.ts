import type { TextPage, TextRow } from '@/domain/parsing/text-layout'

// Synthetic bank-shaped text with public template labels; no real transactions, accounts or holder names.
export const pulseAccounts = {
  card: '1111 2222 3333 4444',
  cny: '5555 6666 7777 8888',
  additional: '9999 0000 1111 2222',
}

export type Parts = readonly (readonly [x: number, text: string])[]

export const line = (text: string, x = 137): Parts => [[x, text]]

export function purchase(
  description: string,
  amount: string,
  posted = '20OCT',
  transacted = '19OCT',
): Parts {
  return [
    [71, posted],
    [103, transacted],
    [137, description],
    [510, amount],
  ]
}

export function pulsePage({
  page = 1,
  currency = 'CNY',
  date = '20 OCT 2026',
  opening = '0.00',
  closing = '0.00',
  end = true,
  ledger = [],
}: {
  page?: number
  currency?: 'HKD' | 'CNY'
  date?: string
  opening?: string | null
  closing?: string
  end?: boolean
  ledger?: readonly Parts[]
} = {}): TextPage {
  const [day, month, year] = date.split(' ')
  const entries: Parts[] = [
    line('Statement of HSBC Pulse UnionPay Dual Currency Diamond Card', 64),
    line('Statement Date', 411),
    [
      [420, `${day}${month}`],
      [454, year],
    ],
    [
      [344, 'Account Number'],
      [475, 'Credit Limit'],
    ],
    [
      [340, pulseAccounts.card],
      [481, 'HKD1,000.00'],
    ],
    [
      [340, pulseAccounts.cny],
      [481, 'CNY1,000.00'],
    ],
    line(
      `Account number ${currency === 'HKD' ? pulseAccounts.card : pulseAccounts.cny} ${currency === 'HKD' ? 'HKD' : 'RMB'} Sub-account Statement balance ${currency}${closing}`,
      66,
    ),
    [
      [66, 'Post date Trans date'],
      [267, 'Description of transaction'],
      [495, 'Amount'],
      [528, `(${currency})`],
    ],
    ...(opening === null ? [] : [line(`PREVIOUS BALANCE ${opening}`)]),
    line(
      `${currency === 'HKD' ? pulseAccounts.card : pulseAccounts.cny} SYNTHETIC HOLDER`,
    ),
    ...ledger,
    ...(end ? [line(`STATEMENT BALANCE ${closing}`)] : []),
  ]
  const rows: TextRow[] = entries.map((parts, index) => {
    const y = 30 + index * 12
    const spans = parts.map(([x, text]) => ({
      text,
      bounds: { x, y, width: text.length * 4, height: 10 },
    }))
    const left = Math.min(...spans.map((span) => span.bounds.x))

    return {
      row: index + 1,
      text: parts.map((part) => part[1]).join(' '),
      bounds: {
        x: left,
        y,
        width:
          Math.max(...spans.map((span) => span.bounds.x + span.bounds.width)) -
          left,
        height: 10,
      },
      spans,
    }
  })

  return { page, width: 595, height: 842, rows }
}

export const pulseFile = {
  id: 'synthetic-statement',
  fileHash: 'synthetic-fingerprint',
  fileName: 'synthetic.pdf',
  size: 1000,
}

export function pulseIdentity() {
  const ids = new Map<string, string>()
  return (kind: 'card' | 'account', number: string) => {
    const key = `${kind}:${number}`
    if (!ids.has(key)) ids.set(key, `${kind}-${ids.size + 1}`)

    return ids.get(key)!
  }
}
