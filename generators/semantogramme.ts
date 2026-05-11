import { Rng } from '~/lib/random'
import type { Level } from '~/games/semantogramme/types'
import { CURATED_THEMES_L1 } from './curated-themes-l1'
import { CURATED_THEMES_L2 } from './curated-themes-l2'
import { CURATED_THEMES_L3 } from './curated-themes-l3'
import { CURATED_THEMES_L4 } from './curated-themes-l4'
import { FILLER_WORDS, THEMES } from './themes'

/**
 * Génère un niveau Sémantogramme pour une date et un index donnés.
 *
 * Pour les niveaux 1, 2 et 3, on regarde d'abord si un thème curé existe
 * pour cette date (`CURATED_THEMES_L1/L2/L3`). Si oui, on génère un puzzle
 * qui utilise ce thème avec un N tiré aléatoirement dans une fenêtre
 * dépendant du niveau, des membres distincts (pas de répétition dans la
 * grille), et des fillers également distincts piochés dans le **pool
 * cross-thèmes** (membres des autres thèmes curés L1 ∪ L2 ∪ L3).
 *
 * Sinon (ou pour le niveau 4) on retombe sur le template aléatoire
 * historique : grille N × N (4..7), thème pioché parmi les 10 thèmes
 * en dur, ~50 % de cases « thème », mots possiblement répétés.
 */
export function generateSemantogrammeLevel(date: string, index: 1 | 2 | 3 | 4): Level {
  if (index === 1 && CURATED_THEMES_L1[date]) {
    return generateCurated(date, 1, CURATED_THEMES_L1[date], {
      size: 4,
      nMin: 7,
      nMax: 10,
    })
  }
  if (index === 2 && CURATED_THEMES_L2[date]) {
    return generateCurated(date, 2, CURATED_THEMES_L2[date], {
      size: 5,
      nMin: 11,
      nMax: 15,
    })
  }
  if (index === 3 && CURATED_THEMES_L3[date]) {
    return generateCurated(date, 3, CURATED_THEMES_L3[date], {
      size: 6,
      nMin: 14,
      nMax: 18,
    })
  }
  if (index === 4 && CURATED_THEMES_L4[date]) {
    return generateCurated(date, 4, CURATED_THEMES_L4[date], {
      size: 7,
      nMin: 15,
      nMax: 19,
    })
  }

  const size = 3 + index // 4, 5, 6, 7
  const width = size
  const height = size
  const rng = new Rng(`semantogramme:${date}:${index}`)
  const theme = rng.pick(THEMES)

  // Solution : ~50 % de cases thème. On garantit au moins 1 case thème par
  // ligne et par colonne pour que le puzzle soit informatif.
  const solution: boolean[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => rng.random() < 0.5),
  )
  // Au moins une case « thème » par ligne et par colonne (sinon clue 0 partout) :
  for (let y = 0; y < height; y++) {
    if (!solution[y].some((v) => v)) {
      solution[y][rng.nextInt(width)] = true
    }
  }
  for (let x = 0; x < width; x++) {
    let any = false
    for (let y = 0; y < height; y++) {
      if (solution[y][x]) {
        any = true
        break
      }
    }
    if (!any) solution[rng.nextInt(height)][x] = true
  }

  // Au moins une case « hors thème » par ligne (sinon clue = width partout, pas marrant) :
  for (let y = 0; y < height; y++) {
    if (solution[y].every((v) => v)) {
      solution[y][rng.nextInt(width)] = false
    }
  }

  // Pose les mots
  const words: string[][] = []
  for (let y = 0; y < height; y++) {
    const row: string[] = []
    for (let x = 0; x < width; x++) {
      if (solution[y][x]) {
        row.push(rng.pick(theme.members))
      } else {
        row.push(rng.pick(FILLER_WORDS))
      }
    }
    words.push(row)
  }

  // Clues
  const rowClues = solution.map((row) => row.filter(Boolean).length)
  const colClues: number[] = []
  for (let x = 0; x < width; x++) {
    let count = 0
    for (let y = 0; y < height; y++) {
      if (solution[y][x]) count++
    }
    colClues.push(count)
  }

  // Le minimum de clics pour résoudre = nombre exact de cases « IN » :
  // il suffit de marquer chacune d'elles (les non-thème peuvent rester
  // vides). Aucune marge : un seul clic perdu ou en trop bascule en `solved`.
  const inCount = solution.flat().filter(Boolean).length
  const parMoves = inCount

  return {
    id: `${date}-${index}`,
    name: `Niveau ${index} · ${width}×${height}`,
    width,
    height,
    words,
    rowClues,
    colClues,
    themeWord: theme.word,
    solution,
    parMoves,
  }
}

/**
 * Génère un niveau Sémantogramme curé (L1 ou L2).
 *
 * - Grille `size × size`, N IN tiré aléatoirement dans `[nMin, nMax]`.
 * - Tous les mots placés (membres et fillers) sont **distincts** — pas de
 *   répétition dans la grille.
 * - Les fillers viennent du **pool cross-thèmes** : membres de tous les
 *   autres thèmes curés L1 ∪ L2, hors membres du thème courant et hors
 *   mot-thème lui-même. Cette stratégie évite les pools génériques qui
 *   contiennent des mots sémantiquement ambigus (ex. « banquier » comme
 *   filler dans une grille « métier »).
 *
 * Règle d'audit : si un mot appartient sémantiquement à plusieurs thèmes
 * (ex. « voile » pour mer ET transport), il faut l'inclure dans **tous**
 * les `members` concernés pour qu'il ne se retrouve jamais filler dans
 * l'un quand il est légitime IN.
 */
function generateCurated(
  date: string,
  levelIndex: 1 | 2 | 3 | 4,
  curated: { word: string; members: readonly string[] },
  config: { size: number; nMin: number; nMax: number },
): Level {
  const { size, nMin, nMax } = config
  const width = size
  const height = size
  const rng = new Rng(`semantogramme:${date}:${levelIndex}`)
  const memberSet = new Set<string>(curated.members)
  if (memberSet.size !== curated.members.length) {
    throw new Error(`Theme ${curated.word} L${levelIndex} : doublon dans la liste des membres`)
  }
  if (memberSet.has(curated.word)) {
    throw new Error(
      `Theme ${curated.word} L${levelIndex} : le mot-thème ne doit pas figurer dans ses propres membres`,
    )
  }
  if (curated.members.length < nMax) {
    throw new Error(
      `Theme ${curated.word} (L${levelIndex}) a moins de ${nMax} membres curés (${curated.members.length})`,
    )
  }

  const n = nMin + rng.nextInt(nMax - nMin + 1) // [nMin, nMax]
  const totalCells = width * height
  const fillerCount = totalCells - n

  // Tire N membres distincts.
  const shuffledMembers = rng.shuffle(curated.members.slice())
  const chosenMembers = shuffledMembers.slice(0, n)

  // Pool de fillers = membres de tous les **autres** thèmes curés (L1 ∪ L2).
  // Un membre du thème courant n'est jamais filler (auto-exclu via memberSet).
  // Le mot-thème lui-même ne doit jamais apparaître comme filler dans son
  // propre puzzle (sinon le joueur le verrait dans la grille et le marquerait
  // IN, alors qu'il est censé être OUT).
  const fillerPool = new Set<string>()
  const addFromMap = (map: Record<string, { word: string; members: readonly string[] }>, ownLevel: boolean) => {
    for (const [otherDate, otherTheme] of Object.entries(map)) {
      if (ownLevel && otherDate === date) continue
      for (const m of otherTheme.members) {
        if (memberSet.has(m)) continue
        if (m === curated.word) continue
        fillerPool.add(m)
      }
    }
  }
  addFromMap(CURATED_THEMES_L1, levelIndex === 1)
  addFromMap(CURATED_THEMES_L2, levelIndex === 2)
  addFromMap(CURATED_THEMES_L3, levelIndex === 3)
  addFromMap(CURATED_THEMES_L4, levelIndex === 4)
  if (fillerPool.size < fillerCount) {
    throw new Error(
      `Pool de fillers trop petit pour le thème ${curated.word} L${levelIndex} (${fillerPool.size} < ${fillerCount})`,
    )
  }
  const shuffledFillers = rng.shuffle(Array.from(fillerPool))
  const chosenFillers = shuffledFillers.slice(0, fillerCount)

  type Cell = { word: string; isIn: boolean }
  const cells: Cell[] = [
    ...chosenMembers.map((w) => ({ word: w, isIn: true })),
    ...chosenFillers.map((w) => ({ word: w, isIn: false })),
  ]

  // On re-mélange jusqu'à ce que chaque ligne et chaque colonne contienne
  // au moins une case IN ET au moins une case OUT. Sinon le joueur a un
  // indice trivialement à 0 (colonne tout-OUT) ou égal à la largeur
  // (colonne tout-IN), ce qui appauvrit le puzzle. La probabilité d'un
  // mauvais tirage avec N proche des extrêmes [nMin, nMax] n'est pas
  // négligeable (~40 % sur 5×5 / N=15) ; quelques shuffles supplémentaires
  // suffisent en pratique.
  const words: string[][] = []
  const solution: boolean[][] = []
  const MAX_ATTEMPTS = 1000
  let attempt = 0
  while (true) {
    rng.shuffle(cells)
    words.length = 0
    solution.length = 0
    for (let y = 0; y < height; y++) {
      const row: string[] = []
      const sol: boolean[] = []
      for (let x = 0; x < width; x++) {
        const c = cells[y * width + x]
        row.push(c.word)
        sol.push(c.isIn)
      }
      words.push(row)
      solution.push(sol)
    }
    let ok = true
    for (let y = 0; y < height && ok; y++) {
      const inCount = solution[y].filter(Boolean).length
      if (inCount === 0 || inCount === width) ok = false
    }
    for (let x = 0; x < width && ok; x++) {
      let inCount = 0
      for (let y = 0; y < height; y++) if (solution[y][x]) inCount++
      if (inCount === 0 || inCount === height) ok = false
    }
    if (ok) break
    attempt++
    if (attempt >= MAX_ATTEMPTS) {
      throw new Error(
        `Impossible de placer ${curated.word} L${levelIndex} sans ligne/colonne extrême (${MAX_ATTEMPTS} essais)`,
      )
    }
  }

  const rowClues = solution.map((row) => row.filter(Boolean).length)
  const colClues: number[] = []
  for (let x = 0; x < width; x++) {
    let count = 0
    for (let y = 0; y < height; y++) if (solution[y][x]) count++
    colClues.push(count)
  }

  // Le minimum de clics = nombre exact de cases IN. Pas de marge : il faut
  // viser pile poil pour décrocher la coche verte (« perfect »).
  const parMoves = n

  return {
    id: `${date}-${levelIndex}`,
    name: `Niveau ${levelIndex} · ${width}×${height}`,
    width,
    height,
    words,
    rowClues,
    colClues,
    themeWord: curated.word,
    solution,
    parMoves,
  }
}
