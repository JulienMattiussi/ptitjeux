/**
 * Générateur Sokomot. Une méthode de construction par niveau, chacune avec
 * sa solution garantie, puis `finalize` règle `parMoves` sur la meilleure
 * solution trouvée par les solveurs :
 * - niveaux 1 et 2 : blocs posés à une ou deux cases de leur cible, glace au
 *   niveau 2 (`sokomot-freeform.ts`) ;
 * - niveau 3 : Sokoban classique généré à rebours, par tirages
 *   (`sokomot-pullchain.ts`) ;
 * - niveau 4 : intérieur entièrement gelé, généré à rebours
 *   (`sokomot-fullice.ts`).
 */
import type { LevelIndex } from '~/games/types'
import type { Level } from '~/games/sokomot/types'
import { GAME_SIZE } from '~/lib/game-styles'
import { Rng } from './random'
import { tryGenerateFreeform } from './sokomot-freeform'
import { tryGenerateFullIce } from './sokomot-fullice'
import { type LevelDraft, inferSize } from './sokomot-grid'
import { solveOptimalSokomot } from './sokomot-optimal-solver'
import { tryGenerateSokobanPullChain } from './sokomot-pullchain'
import { solveSokomotByPushes } from './sokomot-pushstate-solver'
import { freshWords } from './wordlists'

/** Niveaux 2 et 4 : mécanique de glace. */
export function isIceIndex(index: LevelIndex): boolean {
  return index === 2 || index === 4
}

/**
 * Budget d'états de chaque solveur, borné par la mémoire : à 5 millions, un
 * niveau 3 difficile dépasse 4 Go et fait planter la génération. Au-delà du
 * budget, on garde la solution du générateur (valide).
 */
const SOLVER_STATES = 2_000_000

type Builder = (rng: Rng, word: string, width: number, height: number) => LevelDraft | null

/**
 * Méthode de construction de chaque niveau. `kind` entre dans la graine de
 * chaque tentative : le changer changerait tous les niveaux.
 */
const BUILDERS: Record<LevelIndex, { kind: string; attempts: number; build: Builder }> = {
  1: {
    kind: 'freeform',
    attempts: 50,
    build: (rng, word, w, h) =>
      tryGenerateFreeform(rng, word, w, h, { slideLength: 1, iceBetween: false, obstacleCount: 2 }),
  },
  2: {
    kind: 'freeform',
    attempts: 50,
    build: (rng, word, w, h) =>
      tryGenerateFreeform(rng, word, w, h, { slideLength: 2, iceBetween: true, obstacleCount: 0 }),
  },
  3: {
    kind: 'pullchain',
    attempts: 100,
    build: (rng, word, w, h) => tryGenerateSokobanPullChain(rng, word, w, h, 2),
  },
  4: { kind: 'fullice', attempts: 100, build: tryGenerateFullIce },
}

export type SokomotOptions = {
  /** Mots (forme affichée) déjà publiés : jamais réutilisés. */
  usedWords?: ReadonlySet<string>
}

export function generateSokomotLevel(
  date: string,
  index: LevelIndex,
  { usedWords }: SokomotOptions = {},
): Level {
  const { width, height } = GAME_SIZE.sokomot(index)
  const rng = new Rng(`sokomot:${date}:${index}`)
  const entry = rng.pick(freshWords(2 + index, usedWords))
  const { kind, attempts, build } = BUILDERS[index]
  for (let attempt = 0; attempt < attempts; attempt++) {
    const draft = build(
      new Rng(`sokomot:${date}:${index}:${kind}:${attempt}`),
      entry.display,
      width,
      height,
    )
    if (draft) return finalize(draft, date, index, entry.display, entry.canonical)
  }
  throw new Error(`Sokomot ${date} L${index} : aucune grille en ${attempts} tentatives`)
}

function finalize(
  draft: LevelDraft,
  date: string,
  index: LevelIndex,
  word: string,
  canonical: string,
): Level {
  const isIce = isIceIndex(index)
  const { width, height } = inferSize(draft.walls)
  const level: Level = {
    id: `${date}-${index}`,
    name: `Niveau ${index} · ${width}×${height}${isIce ? ' · glace' : ''}`,
    width,
    height,
    player: draft.player,
    walls: draft.walls,
    ice: draft.ice,
    blocks: draft.blocks,
    target: { word, cells: draft.targets },
    parMoves: draft.solution.length,
    solution: draft.solution,
    canonicalWord: canonical,
  }
  // La solution du générateur est souvent trop longue (zigzags de la
  // génération à rebours). Le solveur optimal la remplace quand il aboutit ;
  // au-delà de son budget (niveau 3 profond), le solveur par poussées donne
  // une solution plus courte, sans garantie d'optimum. Sinon, on garde celle
  // du générateur.
  let best = solveOptimalSokomot(level, SOLVER_STATES)
  if (!best && !isIce) best = solveSokomotByPushes(level, SOLVER_STATES)
  if (!best || best.length > draft.solution.length) return level
  return { ...level, parMoves: best.length, solution: best }
}
