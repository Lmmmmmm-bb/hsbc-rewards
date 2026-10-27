import type { Bounds } from '../model/types'

export interface TextSpan {
  readonly text: string
  readonly bounds: Bounds
}

export interface TextRow {
  readonly row: number
  readonly text: string
  readonly bounds: Bounds
  readonly spans: readonly TextSpan[]
}

/** Keep coordinates and reading order independent of a particular PDF library. */
export function groupTextRows(spans: readonly TextSpan[]): TextRow[] {
  const groups: { baseline: number; spans: TextSpan[] }[] = []
  for (const span of [...spans]
    .filter((span) => span.text.trim())
    .sort(
      (a, b) =>
        a.bounds.y + a.bounds.height - (b.bounds.y + b.bounds.height) || a.bounds.x - b.bounds.x,
    )) {
    const baseline = span.bounds.y + span.bounds.height
    const group = groups.find((candidate) => Math.abs(candidate.baseline - baseline) <= 2)
    if (group) group.spans.push(span)
    else groups.push({ baseline, spans: [span] })
  }
  return groups.map((group, index) => {
    const ordered = group.spans.sort((a, b) => a.bounds.x - b.bounds.x)
    const x = Math.min(...ordered.map((span) => span.bounds.x))
    const y = Math.min(...ordered.map((span) => span.bounds.y))
    return {
      row: index + 1,
      text: ordered.map((span) => span.text.trim()).join(' '),
      spans: ordered,
      bounds: {
        x,
        y,
        width: Math.max(...ordered.map((span) => span.bounds.x + span.bounds.width)) - x,
        height: Math.max(...ordered.map((span) => span.bounds.y + span.bounds.height)) - y,
      },
    }
  })
}
