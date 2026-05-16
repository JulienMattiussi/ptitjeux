import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'

import type { Route } from './+types/root'
import './app.css'

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/jpeg', href: '/cerveau.jpeg' },
  { rel: 'apple-touch-icon', href: '/cerveau.jpeg' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Ptitjeux</title>
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-screen flex-col text-gray-900 dark:text-gray-100">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gray-200/60 py-4 text-center text-sm text-gray-500 dark:border-gray-800/60 dark:text-gray-400">
          Fait avec <span aria-hidden>❤️</span><span className="sr-only">amour</span> par{' '}
          <a
            href="https://github.com/YavaDeus"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-700 underline-offset-4 transition hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-gray-100"
          >
            YavaDeus
          </a>
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oups !'
  let details = 'Une erreur inattendue est survenue.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Erreur'
    details =
      error.status === 404 ? "Cette page n'existe pas." : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1 className="text-3xl font-bold">{message}</h1>
      <p className="mt-2">{details}</p>
      {stack && (
        <pre className="mt-4 w-full overflow-x-auto rounded bg-gray-100 p-4 dark:bg-gray-900">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
