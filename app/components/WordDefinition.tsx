import { useEffect, useState } from 'react'
import { extractPageText, parseFrenchDefinition } from '~/lib/wiktionary'

const ENDPOINT = 'https://fr.wiktionary.org/w/api.php'

/**
 * Cache module-level des définitions déjà fetchées + suivi des requêtes en
 * cours pour dédupliquer les appels concurrents. Permet de précharger une
 * définition dès l'arrivée sur la page de jeu pour qu'elle soit instantanée
 * quand la modale de victoire apparaît.
 */
const cache = new Map<string, string | null>()
const inflight = new Map<string, Promise<string | null>>()

async function fetchDefinition(word: string): Promise<string | null> {
  const key = word.toLowerCase()
  if (cache.has(key)) return cache.get(key) ?? null
  const ongoing = inflight.get(key)
  if (ongoing) return ongoing

  const promise = (async () => {
    try {
      const params = new URLSearchParams({
        action: 'query',
        prop: 'extracts',
        titles: key,
        exsentences: '10',
        explaintext: '1',
        format: 'json',
        origin: '*',
      })
      const res = await fetch(`${ENDPOINT}?${params.toString()}`)
      if (!res.ok) return null
      const data = (await res.json()) as unknown
      const raw = extractPageText(data)
      if (!raw) return null
      return parseFrenchDefinition(raw)
    } catch {
      return null
    }
  })()

  inflight.set(key, promise)
  promise.then((result) => {
    cache.set(key, result)
    inflight.delete(key)
  })
  return promise
}

/**
 * Lance le téléchargement de la définition d'un mot et la stocke en cache,
 * sans bloquer. À appeler dès que possible (par ex. au chargement de la page
 * de jeu) pour que la modale de victoire affiche la définition sans temps mort.
 *
 * Idempotent : appels successifs sur le même mot partagent la même requête.
 */
export function prefetchDefinition(word: string): void {
  fetchDefinition(word).catch(() => {
    /* silencieux */
  })
}

/**
 * Affiche la définition d'un mot tirée du Wiktionnaire francophone.
 *
 * - Lit immédiatement le cache au montage : si déjà préchargée, la définition
 *   apparaît sans pop.
 * - Sinon, lance la requête et met à jour quand elle aboutit.
 * - Si l'appel échoue (réseau, 404, etc.), le composant ne rend rien.
 */
export function WordDefinition({ word }: { word: string }) {
  const initial = cache.get(word.toLowerCase()) ?? null
  const [text, setText] = useState<string | null>(initial)

  useEffect(() => {
    let cancelled = false
    fetchDefinition(word).then((result) => {
      if (!cancelled) setText(result)
    })
    return () => {
      cancelled = true
    }
  }, [word])

  if (!text) return null

  const lower = word.toLowerCase()
  const articleUrl = `https://fr.wiktionary.org/wiki/${encodeURIComponent(lower)}`

  return (
    <div className="mt-4 rounded-lg border border-gray-200/60 bg-white/70 p-3 text-left text-sm italic text-gray-700 backdrop-blur dark:border-gray-700/60 dark:bg-gray-800/60 dark:text-gray-300">
      <p>
        <span className="font-display font-bold not-italic capitalize">{lower}</span>
        <span aria-hidden="true" className="mx-2 text-gray-400">
          ·
        </span>
        {text}
      </p>
      <p className="mt-2 flex items-center justify-end gap-1.5 text-xs not-italic text-gray-500 dark:text-gray-400">
        <span>Source :</span>
        <a
          href={articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium transition hover:text-gray-800 hover:underline dark:hover:text-gray-100"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Wiktionary-logo-fr.svg/40px-Wiktionary-logo-fr.svg.png"
            alt=""
            width={16}
            height={16}
            className="rounded-sm"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
          Wiktionnaire
        </a>
      </p>
    </div>
  )
}
