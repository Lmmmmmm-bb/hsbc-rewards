import { DomainError } from '../model/errors'

export function safeInteger(value: number): number {
  if (!Number.isSafeInteger(value)) throw new DomainError('money.out-of-range')
  return value
}

export function parseMinor(input: string): number {
  const text = input.trim().toUpperCase().replace(/\u00a0/g, ' ')
  const match = /^(\()?([+-]?)(\d+(?:,\d{3})*)(?:\.(\d{1,2}))?(\))?\s*(CR|DR)?$/.exec(text)
  if (!match || Boolean(match[1]) !== Boolean(match[5])) throw new DomainError('money.invalid-format')

  const [, parentheses, sign, whole, decimal = '', , direction] = match
  if (whole.includes(',') && !/^\d{1,3}(?:,\d{3})+$/.test(whole)) throw new DomainError('money.invalid-format')
  if ((parentheses || sign === '-') && direction === 'DR') throw new DomainError('money.conflicting-sign')
  if (sign === '+' && (parentheses || direction === 'CR')) throw new DomainError('money.conflicting-sign')

  const absolute = BigInt(whole.replaceAll(',', '')) * 100n + BigInt(decimal.padEnd(2, '0') || '0')
  const negative = Boolean(parentheses) || sign === '-' || direction === 'CR'
  const value = safeInteger(Number(negative ? -absolute : absolute))

  return Object.is(value, -0) ? 0 : value
}

export function addMinor(values: readonly number[]): number {
  return values.reduce((sum, value) => safeInteger(sum + safeInteger(value)), 0)
}

function roundedRatio(numerator: bigint, denominator: bigint): number {
  const sign = numerator < 0n ? -1n : 1n
  const magnitude = numerator < 0n ? -numerator : numerator

  return safeInteger(Number(sign * ((magnitude + denominator / 2n) / denominator)))
}

function validateRate(ratePpm: number): void {
  if (!Number.isSafeInteger(ratePpm) || ratePpm <= 0) throw new DomainError('fx.invalid-rate')
}

export function convertMinor(amountMinor: number, ratePpm: number | null): number | null {
  safeInteger(amountMinor)
  if (ratePpm === null) return null
  validateRate(ratePpm)

  return roundedRatio(BigInt(amountMinor) * BigInt(ratePpm), 1_000_000n)
}

export function convertMinorInverse(amountMinor: number, ratePpm: number | null): number | null {
  safeInteger(amountMinor)
  if (ratePpm === null) return null
  validateRate(ratePpm)

  return roundedRatio(BigInt(amountMinor) * 1_000_000n, BigInt(ratePpm))
}

export function proportionalMicroRc(amountMinor: number, rateBasisPoints: number, usedBasisMinor: number, totalBasisMinor: number): number {
  const full = microRcForSpend(amountMinor, rateBasisPoints)
  safeInteger(usedBasisMinor)
  safeInteger(totalBasisMinor)
  if (usedBasisMinor < 0 || totalBasisMinor < 0 || usedBasisMinor > totalBasisMinor) throw new DomainError('rewards.invalid-basis')
  if (totalBasisMinor === 0) return full
  return safeInteger(Number(BigInt(full) * BigInt(usedBasisMinor) / BigInt(totalBasisMinor)))
}

export function microRcForSpend(amountMinor: number, rateBasisPoints: number): number {
  safeInteger(amountMinor)
  if (amountMinor < 0 || !Number.isInteger(rateBasisPoints) || rateBasisPoints < 0) throw new DomainError('rewards.invalid-basis')
  return safeInteger(amountMinor * rateBasisPoints)
}

export function microRcToCnyMinor(microRc: number, ratePpm: number | null): number | null {
  safeInteger(microRc)
  if (ratePpm === null) return null
  validateRate(ratePpm)

  return roundedRatio(BigInt(microRc) * BigInt(ratePpm), 10_000_000_000n)
}
