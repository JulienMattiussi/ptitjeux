import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { MenuIcon } from './icons'
import { games } from '~/lib/games-registry'

/**
 * Menu burger de l'accueil, sur mobile seulement : les tuiles y sont empilées,
 * et ce menu évite de défiler pour atteindre un jeu. Reste visible en haut de
 * l'écran pendant le défilement.
 */
export function GamesMenu() {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function handlePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('pointerdown', handlePointer)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('pointerdown', handlePointer)
    }
  }, [open])

  return (
    <div ref={rootRef} className="fixed top-3 right-3 z-20 sm:hidden">
      <button
        type="button"
        aria-label={open ? 'Fermer le menu des jeux' : 'Ouvrir le menu des jeux'}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200/80 bg-white/90 text-gray-900 shadow-lg backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-100 dark:focus-visible:ring-gray-100"
      >
        <MenuIcon open={open} />
      </button>
      {open && (
        <nav
          id={menuId}
          aria-label="Jeux"
          className="animate-fade-in-up mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-800/95"
        >
          <ul>
            {games.map((game) => (
              <li key={game.id}>
                <Link
                  to={game.href}
                  data-nav-item=""
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline-none dark:hover:bg-gray-700/60 dark:focus-visible:bg-gray-700/60"
                >
                  <span
                    className={`h-8 w-1.5 shrink-0 rounded-full bg-linear-to-b ${game.accentClass}`}
                    aria-hidden="true"
                  />
                  <span className="flex flex-col">
                    <span className="font-display font-semibold">{game.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{game.tagline}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
