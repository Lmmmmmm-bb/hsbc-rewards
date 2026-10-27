import { describe, expect, it } from 'vitest'
import { groupTextRows } from './text-layout'
import type { TextSpan } from './text-layout'

const span = (text: string, x: number, y: number, height = 10): TextSpan => ({
  text,
  bounds: { x, y, width: 30, height },
})

describe('PDF reading order', () => {
  it('sorts columns and rows without losing span coordinates', () => {
    const input = [
      span('250.00', 400, 50),
      span('second', 10, 80),
      span('19 OCT', 10, 50),
      span('DEMO', 120, 50),
    ]
    const rows = groupTextRows(input)
    expect(rows.map((row) => row.text)).toEqual(['19 OCT DEMO 250.00', 'second'])
    expect(rows[0].bounds).toEqual({ x: 10, y: 50, width: 420, height: 10 })
    expect(rows[0].spans[2]).toBe(input[0])
    expect(input[0].text).toBe('250.00')
  })
  it('groups small baseline differences, while keeping separate ledger rows apart', () => {
    const rows = groupTextRows([
      span('date', 10, 20),
      span('amount', 200, 21),
      span('next', 10, 35),
    ])
    expect(rows.map((row) => row.text)).toEqual(['date amount', 'next'])
    expect(rows.map((row) => row.row)).toEqual([1, 2])
  })
  it('uses baseline alignment for mixed text sizes and ignores whitespace-only fragments', () => {
    const rows = groupTextRows([span('a', 10, 20), span('b', 60, 22, 8), span('   ', 0, 0)])
    expect(rows).toHaveLength(1)
    expect(rows[0].text).toBe('a b')
    expect(groupTextRows([])).toEqual([])
  })
})
