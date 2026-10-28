import { useEffect, useId, useRef, useState } from 'react'
import type { ImportItem } from '@/application/import/types'
import { passwordWaitSeconds } from '@/application/import/limits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n/use-i18n'

export function PasswordForm({
  item,
  onUnlock,
}: {
  item: ImportItem
  onUnlock: (password: string) => void
}) {
  const input = useRef<HTMLInputElement>(null),
    id = useId()
  const { t } = useI18n()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!item.gate.until) return

    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [item.gate.until])

  const wait = passwordWaitSeconds(item.gate, now)

  return (
    <form
      data-password-form
      className="space-y-3 rounded-lg border bg-muted/40 p-4"
      onSubmit={(event) => {
        event.preventDefault()
        const password = input.current?.value ?? ''
        if (input.current) input.current.value = ''
        onUnlock(password)
      }}
    >
      <Label htmlFor={id}>{t('pdf.passwordLabel')}</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          ref={input}
          id={id}
          className="min-w-0 flex-1"
          type="password"
          autoComplete="off"
          required
          disabled={wait > 0}
          aria-invalid={item.problem === 'password-incorrect'}
          aria-describedby={id + '-hint'}
        />
        <Button type="submit" variant="outline" disabled={wait > 0}>
          {t('pdf.unlock')}
        </Button>
      </div>
      <p
        id={id + '-hint'}
        className={
          item.problem === 'password-incorrect'
            ? 'text-xs text-destructive'
            : 'text-xs text-muted-foreground'
        }
      >
        {wait
          ? t('pdf.frozen', { seconds: wait })
          : t(item.problem === 'password-incorrect' ? 'pdf.wrongPassword' : 'pdf.passwordHint')}
      </p>
    </form>
  )
}
