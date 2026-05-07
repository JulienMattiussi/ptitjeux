import { Link } from 'react-router'

type Props = {
  to: string
  index: number
  name: string
  meta?: string
  accent: 'sokomot' | 'boucle' | 'semantogramme'
}

const ACCENT_HOVER: Record<Props['accent'], string> = {
  sokomot: 'hover:border-sky-400 dark:hover:border-sky-500 group-hover:text-sky-600 dark:group-hover:text-sky-400',
  boucle:
    'hover:border-emerald-400 dark:hover:border-emerald-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
  semantogramme:
    'hover:border-amber-400 dark:hover:border-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400',
}

const ACCENT_BADGE: Record<Props['accent'], string> = {
  sokomot:
    'bg-linear-to-br from-sky-100 to-indigo-100 text-sky-700 dark:from-sky-900/50 dark:to-indigo-900/50 dark:text-sky-300',
  boucle:
    'bg-linear-to-br from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/50 dark:to-teal-900/50 dark:text-emerald-300',
  semantogramme:
    'bg-linear-to-br from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/50 dark:to-orange-900/50 dark:text-amber-300',
}

export function LevelCard({ to, index, name, meta, accent }: Props) {
  const hover = ACCENT_HOVER[accent]
  const badge = ACCENT_BADGE[accent]
  return (
    <Link
      to={to}
      className={`group block rounded-xl border border-gray-200 bg-white/80 p-4 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70 ${hover}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-base font-bold ${badge}`}
          aria-hidden="true"
        >
          {String(index).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={`truncate font-display text-base font-semibold transition-colors ${hover}`}
          >
            {name}
          </div>
          {meta && <div className="text-xs text-gray-500 dark:text-gray-400">{meta}</div>}
        </div>
        <svg
          viewBox="0 0 16 16"
          className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 5 3 L 11 8 L 5 13" />
        </svg>
      </div>
    </Link>
  )
}
