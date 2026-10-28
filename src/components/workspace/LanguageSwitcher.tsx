import { RiGlobalLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const nextLocale = locale === 'zh-CN' ? 'en-US' : 'zh-CN'
  return (
    <Button
      data-language-switcher
      variant="ghost"
      size="sm"
      aria-label={t(
        locale === 'zh-CN' ? 'language.switchToEnglish' : 'language.switchToChinese',
      )}
      onClick={() => setLocale(nextLocale)}
    >
      <RiGlobalLine aria-hidden="true" />
      <span lang={nextLocale}>
        {t(locale === 'zh-CN' ? 'language.english' : 'language.chinese')}
      </span>
    </Button>
  )
}
