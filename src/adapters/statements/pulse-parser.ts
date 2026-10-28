import { DomainError } from '@/domain/model/errors'
import {
  parsePulseStatement,
  pulseAccountNumbers,
} from '@/domain/parsing/pulse/parse'
import type { StatementParser } from '@/ports/statements'
import { hashText } from '@/adapters/crypto/sha256'

export const pulseStatementParser: StatementParser = {
  async parse(pages, source, signal) {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')

    const identities = new Map<string, string>()
    await Promise.all(
      pulseAccountNumbers(pages).flatMap((number) =>
        (['card', 'account'] as const).map(async (kind) => {
          const key = `${kind}:${number}`
          identities.set(key, await hashText(`hsbc-pulse:${key}`))
        }),
      ),
    )
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
    return parsePulseStatement(pages, source, (kind, number) => {
      const id = identities.get(`${kind}:${number}`)
      if (!id) throw new DomainError('parse.identifier-not-prepared')
      return id
    })
  },
}
