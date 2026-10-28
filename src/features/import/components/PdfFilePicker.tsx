import { useRef } from 'react'
import { RiFileUploadLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function PdfFilePicker({
  label,
  onFiles,
  disabled = false,
  variant = 'default',
  pageTrigger = false,
}: {
  label: string
  onFiles: (files: readonly File[]) => void
  disabled?: boolean
  variant?: 'default' | 'outline'
  pageTrigger?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)

  return (
    <>
      <Input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        disabled={disabled}
        data-agent-pdf-input={pageTrigger ? 'primary' : undefined}
        className="hidden"
        aria-label={label}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          if (files.length) onFiles(files)
        }}
      />
      <Button
        variant={variant}
        disabled={disabled}
        data-file-picker-trigger={pageTrigger ? '' : undefined}
        onClick={() => input.current?.click()}
      >
        <RiFileUploadLine aria-hidden="true" />
        {label}
      </Button>
    </>
  )
}
