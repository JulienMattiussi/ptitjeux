import { Link } from 'react-router'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  backHref?: string
  backLabel?: string
}

export function GameLayout({
  title,
  subtitle,
  children,
  backHref = '/',
  backLabel = 'Accueil',
}: Props) {
  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-gray-200/60 bg-white/70 backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-950/70">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <Link
            to={backHref}
            className="group flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            aria-label={backLabel}
          >
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M 11 3 L 5 8 L 11 13" />
            </svg>
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
          <div className="flex-1 truncate">
            <h1 className="truncate font-display text-base font-semibold sm:text-lg">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          <Link
            to="/"
            aria-label="Secretgame"
            className="shrink-0 transition hover:opacity-80"
          >
            <img src="/cerveau.jpeg" alt="" className="h-8 w-8 rounded-lg shadow-sm" />
          </Link>
        </div>
      </header>
      <main className="animate-fade-in-up mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {children}
      </main>
    </div>
  )
}
