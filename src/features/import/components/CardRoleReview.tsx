import { useId } from 'react'
import type { ImportCardRole, ImportSnapshot } from '@/application/import/types'
import {
  Field, FieldGroup, FieldLabel, FieldLegend, FieldSet,
} from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useI18n } from '@/i18n/use-i18n'

export function CardRoleReview({
  review,
  onRole,
}: {
  review: NonNullable<ImportSnapshot['cardReview']>
  onRole: (reviewId: number, cardId: string, role: NonNullable<ImportCardRole['role']>) => void
}) {
  const { t } = useI18n()
  const id = useId()
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${id}-title`}>
      <div className="flex flex-col gap-1">
        <h3 id={`${id}-title`} className="text-sm font-medium">
          {t('pdf.cards.title')}
        </h3>
        <p className="text-xs text-muted-foreground">{t('pdf.cards.hint')}</p>
      </div>
      <FieldGroup>
        {review.cards.map((card, index) => (
          <FieldSet key={card.cardId}>
            <FieldLegend id={`${id}-${index}`}>
              {t('pdf.cards.card', { index: index + 1, lastFour: card.lastFour })}
            </FieldLegend>
            <RadioGroup
              value={card.role ?? ''}
              aria-required="true"
              aria-labelledby={`${id}-${index}`}
              className="flex flex-wrap gap-x-6"
              onValueChange={(value) => {
                if (value === 'primary' || value === 'additional')
                  onRole(review.id, card.cardId, value)
              }}
            >
              {(['primary', 'additional'] as const).map((role) => (
                <Field
                  key={role}
                  orientation="horizontal"
                  className="w-auto"
                  data-disabled={review.cards.length === 1 && role === 'additional'}
                >
                  <RadioGroupItem
                    id={`${id}-${index}-${role}`}
                    value={role}
                    disabled={review.cards.length === 1 && role === 'additional'}
                  />
                  <FieldLabel htmlFor={`${id}-${index}-${role}`}>
                    {t(`pdf.cards.${role}`)}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          </FieldSet>
        ))}
      </FieldGroup>
    </section>
  )
}
