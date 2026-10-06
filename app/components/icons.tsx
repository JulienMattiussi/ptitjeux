type IconProps = { className?: string }

export function ChevronRight({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M 5 3 L 11 8 L 5 13" />
    </svg>
  )
}

export function ChevronLeft({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M 11 3 L 5 8 L 11 13" />
    </svg>
  )
}

export function LockIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M5 7V5a3 3 0 1 1 6 0v2h.5A1.5 1.5 0 0 1 13 8.5v4A1.5 1.5 0 0 1 11.5 14h-7A1.5 1.5 0 0 1 3 12.5v-4A1.5 1.5 0 0 1 4.5 7H5zm1.5 0h3V5a1.5 1.5 0 1 0-3 0v2z" />
    </svg>
  )
}

export function CheckIcon({ className = 'h-3 w-3' }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M 2 6 L 5 9 L 10 3" />
    </svg>
  )
}

/** Menu burger ; devient une croix quand le menu est ouvert. */
export function MenuIcon({ open, className = 'h-5 w-5' }: IconProps & { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? (
        <path d="M 3.5 3.5 L 12.5 12.5 M 12.5 3.5 L 3.5 12.5" />
      ) : (
        <path d="M 2 4 H 14 M 2 8 H 14 M 2 12 H 14" />
      )}
    </svg>
  )
}
