export function StatementIllustration() {
  return (
    <svg
      data-statement-illustration
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 80 80"
      fill="none"
      strokeWidth="1.25"
      className="size-18 text-muted-foreground"
    >
      <g transform="rotate(-8 34 44)">
        <path d="M17 23H47L55 31V67H17Z" className="fill-muted stroke-border" />
        <path d="M24 40H45M24 46H45M24 52H38" className="stroke-border" />
      </g>
      <path d="M27 12H51L63 24V61H27Z" className="fill-background stroke-muted-foreground/40" />
      <path d="M51 12V24H63" className="fill-primary/10 stroke-primary" />
      <path d="M34 24H42" className="stroke-primary" />
      <path d="M34 34H55M34 40H55M34 46H43M50 46H55" className="stroke-muted-foreground/40" />
      <path d="M34 54H55" className="stroke-border" />
    </svg>
  )
}
