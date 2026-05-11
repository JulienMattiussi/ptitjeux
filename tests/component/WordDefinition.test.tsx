import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prefetchDefinition, WordDefinition } from '~/components/WordDefinition'

// La première ligne « ligne 1 » est trop courte (< 6 chars) — le parser
// remonte donc directement à la première ligne substantielle.
const SAMPLE_RAW = `
== Français ==

=== Nom commun ===

Petit mammifère carnivore de la famille des félidés, souvent domestiqué.

=== Forme de verbe ===
forme conjuguée
`

function mockSuccess(extract: string) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    return new Response(
      JSON.stringify({
        query: {
          pages: {
            '12345': { title: 'chat', extract },
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  })
}

describe('WordDefinition', () => {
  beforeEach(() => {
    // Reset le cache module-level entre tests : on importe à chaque fois un
    // nouveau module n'est pas trivial. À la place, on utilise des mots
    // distincts par test pour éviter les hits de cache croisés.
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ne rend rien tant que la définition n\'est pas chargée', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}))
    const { container } = render(<WordDefinition word="attentepouralwaystrue" />)
    expect(container.firstChild).toBeNull()
  })

  it('affiche la définition une fois la requête résolue', async () => {
    mockSuccess(SAMPLE_RAW)
    render(<WordDefinition word="motdetest1" />)
    expect(
      await screen.findByText(/Petit mammifère carnivore/i),
    ).toBeInTheDocument()
    // Lien vers le Wiktionnaire.
    const link = screen.getByRole('link', { name: /Wiktionnaire/i })
    expect(link.getAttribute('href')).toContain('fr.wiktionary.org/wiki/')
  })

  it('ne rend rien si la réponse n\'a pas de définition exploitable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ query: { pages: { '-1': { missing: '' } } } }), {
        status: 200,
      }),
    )
    const { container } = render(<WordDefinition word="motinconnu99" />)
    await new Promise((r) => setTimeout(r, 10))
    expect(container.firstChild).toBeNull()
  })

  it('ne rend rien si fetch échoue (erreur réseau)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))
    const { container } = render(<WordDefinition word="motreseauko" />)
    await new Promise((r) => setTimeout(r, 10))
    expect(container.firstChild).toBeNull()
  })

  it('prefetchDefinition met en cache : le composant rend instantanément', async () => {
    mockSuccess(SAMPLE_RAW)
    prefetchDefinition('motprefetch1')
    // Attente que la promesse de prefetch soit résolue avant le render.
    await waitFor(() =>
      expect(globalThis.fetch as unknown as { mock: { calls: unknown[] } }).toBeDefined(),
    )
    await new Promise((r) => setTimeout(r, 10))
    render(<WordDefinition word="motprefetch1" />)
    // findByText laisse le temps au useEffect de lire le cache et d'updater.
    expect(
      await screen.findByText(/Petit mammifère carnivore/i),
    ).toBeInTheDocument()
  })

  it('cache : un même mot ne déclenche pas deux requêtes', async () => {
    const spy = mockSuccess(SAMPLE_RAW)
    render(<WordDefinition word="motcache1" />)
    await screen.findByText(/Petit mammifère/i)
    const callsAfterFirst = spy.mock.calls.length
    // Second render du même mot : doit lire le cache, pas refetch.
    render(<WordDefinition word="motcache1" />)
    await new Promise((r) => setTimeout(r, 10))
    expect(spy.mock.calls.length).toBe(callsAfterFirst)
  })

  it('appelle l\'API avec le mot en minuscules', async () => {
    const spy = mockSuccess(SAMPLE_RAW)
    render(<WordDefinition word="MOTMAJ1" />)
    await screen.findByText(/Petit mammifère/i)
    const url = String(spy.mock.calls[0]?.[0])
    expect(url).toContain('titles=motmaj1')
  })
})
