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
  return (
    <section data-transaction-sources>
      <InfoSection title={t('details.sources')}>
        <div className="grid items-start gap-2 sm:grid-cols-2">
          {sources.map((source, index) => {
            const statement = statements.find(
              (item) => item.id === source.statementId,
            )
            return (
              <article key={index} className="min-w-0 space-y-2 border p-3">
                <div className="flex items-start gap-2">
                  <RiFileTextLine
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <h4 className="min-w-0 break-all text-sm font-medium">
                    {statement?.fileName ?? t('details.sourceUnavailable')}
                  </h4>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">
                      {t('details.statementDate')}
                    </dt>
                    <dd>
                      {statement ? date(statement.date) : t('details.unknown')}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">
                      {t('details.pageLabel')}
                    </dt>
                    <dd>
                      <Badge variant="outline">
                        {t('details.sourcePage', { page: source.page })}
                      </Badge>
                    </dd>
                  </div>
                  {statement && (
                    <div className="col-span-2 space-y-1">
                      <dt className="text-muted-foreground">
                        {t('details.statementPeriod')}
                      </dt>
                      <dd>
                        {date(statement.period.from)} —{' '}
                        {date(statement.period.to)}
                      </dd>
                    </div>
                  )}
                </dl>
                <details className="border-t pt-2">
                  <summary className="cursor-pointer text-xs font-medium">
                    {t('details.sourceText')}
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed whitespace-pre-wrap break-all">
                    {source.text}
                  </p>
                </details>
              </article>
            )
          })}
        </div>
      </InfoSection>
    </section>
  )
}
