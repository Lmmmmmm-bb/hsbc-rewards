import { RiExternalLinkLine } from '@remixicon/react'
import type { WorkspaceView } from '@/application/session/selectors'
import { InfoSection } from '@/components/workspace/InfoSection'
import { useI18n } from '@/i18n/use-i18n'
import { HsbcLogo } from '@/components/workspace/HsbcLogo'

export function OfficialSources({ rules }: { rules: WorkspaceView['rules'] }) {
  const { t, date } = useI18n()
  return (
    <div className="space-y-4">
      <HsbcLogo />
      <p className="text-sm text-muted-foreground">{t('rules.sourcesHint')}</p>
      <InfoSection title={t('rules.sourcesTitle')}>
        <ul className="space-y-4">
          {rules.sources.map((url, index) => (
            <li key={url} className="space-y-1">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-start gap-1 p-0 text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>{t(`rules.source.${index as 0 | 1 | 2 | 3}`)}</span>
                <RiExternalLinkLine
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
              </a>
              <p className="text-xs text-muted-foreground">
                {t(`rules.sourceHint.${index as 0 | 1 | 2 | 3}`)}
              </p>
            </li>
          ))}
        </ul>
      </InfoSection>
      <dl className="space-y-1 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-x-2">
          <dt>{t('rules.versionLabel')}</dt>
          <dd>{rules.id}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt>{t('rules.verifiedLabel')}</dt>
          <dd>{date(rules.verifiedAt)}</dd>
        </div>
      </dl>
    </div>
  )
}
