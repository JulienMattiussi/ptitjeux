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
  backLabel = '← Retour',
}: Props) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur dark:border-gray-800 dark:bg-gray-950/70">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <Link
            to={backHref}
            className="text-sm text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            {backLabel}
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
