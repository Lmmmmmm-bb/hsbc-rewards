import { RiFileTextLine } from '@remixicon/react'
import type { Statement, Transaction } from '@/domain/model/types'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
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
            const pages = [
              ...new Set(statementSources.map((source) => source.page)),
            ]
            return (
              <article
                key={statementId}
                className="min-w-0 space-y-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <RiFileTextLine
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                      <h4 className="min-w-0 break-all text-sm font-medium">
                        {statement?.fileName ?? t('details.sourceUnavailable')}
                      </h4>
                      <div className="flex max-w-28 flex-wrap justify-end gap-1">
                        {pages.map((page) => (
                          <Badge key={page} variant="outline">
                            {t('details.sourcePage', { page })}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-[auto_1fr] sm:pl-6">
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-muted-foreground">
                        {t('details.statementDate')}
                      </dt>
                      <dd>
                        {statement ? (
                          <time dateTime={statement.date} className="whitespace-nowrap">
                            {date(statement.date)}
                          </time>
                        ) : t('details.unknown')}
                      </dd>
                    </div>
                    {statement && (
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="text-muted-foreground">
                          {t('details.statementPeriod')}
                        </dt>
                        <dd>
                          <time dateTime={statement.period.from} className="whitespace-nowrap">
                            {date(statement.period.from)}
                          </time>
                          {' — '}
                          <time dateTime={statement.period.to} className="whitespace-nowrap">
                            {date(statement.period.to)}
                          </time>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                <Accordion>
                  <AccordionItem value="source-text">
                    <AccordionTrigger>{t('details.sourceText')}</AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-2 border-t pt-2">
                        {pages.map((page) => (
                          <section key={page} className="space-y-1">
                            {pages.length > 1 && (
                              <h5 className="text-xs font-medium text-muted-foreground">
                                {t('details.sourcePage', { page })}
                              </h5>
                            )}
                            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                              {statementSources
                                .filter((source) => source.page === page)
                                .map((source) => source.text)
                                .join('\n')}
                            </p>
                          </section>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </article>
            )
          })}
        </div>
      </InfoSection>
    </section>
  )
}
