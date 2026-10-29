import { RiFileTextLine } from '@remixicon/react'
import type { Statement, Transaction } from '@/domain/model/types'
import { Badge } from '@/components/ui/badge'
import { InfoSection } from '@/components/workspace/InfoSection'
import { useI18n } from '@/i18n/use-i18n'

export function TransactionSources({
  sources,
  statements,
}: {
  sources: Transaction['sources']
  statements: readonly Statement[]
}) {
  const { t, date } = useI18n()
  const sourcesByStatement = new Map<string, Transaction['sources'][number][]>()
  for (const source of sources) {
    const group = sourcesByStatement.get(source.statementId)
    if (group) group.push(source)
    else sourcesByStatement.set(source.statementId, [source])
  }

  return (
    <section data-transaction-sources>
      <InfoSection title={t('details.sources')}>
        <div className="divide-y">
          {[...sourcesByStatement].map(([statementId, statementSources]) => {
            const statement = statements.find(
              (item) => item.id === statementId,
            )
            const pages = [...new Set(statementSources.map((source) => source.page))]
            return (
              <article
                key={statementId}
                className="min-w-0 space-y-1.5 py-3 first:pt-0 last:pb-0"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <RiFileTextLine
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <h4 className="min-w-0 break-all text-sm font-medium">
                      {statement?.fileName ?? t('details.sourceUnavailable')}
                    </h4>
                  </div>
                  <div className="flex max-w-28 flex-wrap justify-end gap-1">
                    {pages.map((page) => (
                      <Badge key={page} variant="outline">
                        {t('details.sourcePage', { page })}
                      </Badge>
                    ))}
                  </div>
                </div>
                <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="shrink-0 text-muted-foreground">
                      {t('details.statementDate')}
                    </dt>
                    <dd>
                      {statement ? date(statement.date) : t('details.unknown')}
                    </dd>
                  </div>
                  {statement && (
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="shrink-0 text-muted-foreground">
                        {t('details.statementPeriod')}
                      </dt>
                      <dd>
                        {date(statement.period.from)} —{' '}
                        {date(statement.period.to)}
                      </dd>
                    </div>
                  )}
                </dl>
                <details>
                  <summary className="cursor-pointer text-xs font-medium">
                    {t('details.sourceText')}
                  </summary>
                  <div className="mt-2 space-y-2 border-t pt-2">
                    {pages.map((page) => (
                      <div key={page} className="space-y-1">
                        {pages.length > 1 && (
                          <p className="text-xs font-medium text-muted-foreground">
                            {t('details.sourcePage', { page })}
                          </p>
                        )}
                        <p className="text-xs leading-relaxed whitespace-pre-wrap break-all">
                          {statementSources
                            .filter((source) => source.page === page)
                            .map((source) => source.text)
                            .join('\n')}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              </article>
            )
          })}
        </div>
      </InfoSection>
    </section>
  )
}
