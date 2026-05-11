import { Rng } from '~/lib/random'
import type { Level } from '~/games/semantogramme/types'
import { CURATED_THEMES_L1 } from './curated-themes'
import { FILLER_WORDS, THEMES } from './themes'

/**
 * Génère un niveau Sémantogramme pour une date et un index donnés.
 *
 * Pour le niveau 1, on regarde d'abord si un thème curé existe pour cette
 * date dans `CURATED_THEMES_L1`. Si oui, on génère un puzzle qui utilise ce
 * thème avec un nombre aléatoire de cases « thème » entre 7 et 12, des
 * membres distincts (pas de répétition dans la grille), et des fillers
 * également distincts qui ne sont pas membres du thème.
 *
 * Sinon (ou pour les niveaux 2-4) on retombe sur le template aléatoire
 * historique : grille N × N (4..7), thème pioché parmi les 10 thèmes
 * en dur, ~50 % de cases « thème », mots possiblement répétés.
 */
export function generateSemantogrammeLevel(date: string, index: 1 | 2 | 3 | 4): Level {
  if (index === 1 && CURATED_THEMES_L1[date]) {
    return generateCuratedL1(date, CURATED_THEMES_L1[date])
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
 * Génère un L1 sémantogramme curé : grille 4×4, thème fixé, N tiré
 * aléatoirement entre 7 et 10 (= nombre de cases IN). Tous les mots placés
 * (membres et fillers) sont distincts dans la grille — pas de répétition.
 *
 * Les fillers viennent du **pool des membres de tous les autres thèmes
 * curés**. Un mot membre du thème « fleur » devient ainsi un mot neutre
 * dans une grille « métier » ou « outil ». Cette stratégie évite le
 * problème des pools de fillers génériques qui contiennent des mots
 * sémantiquement ambigus (ex. « banquier » comme filler dans une grille
 * « métier »).
 */
function generateCuratedL1(
  date: string,
  curated: { word: string; members: readonly string[] },
): Level {
  const width = 4
  const height = 4
  const rng = new Rng(`semantogramme:${date}:1`)
  const memberSet = new Set<string>(curated.members)
  if (curated.members.length < 10) {
    throw new Error(`Theme ${curated.word} a moins de 10 membres curés`)
  }

  // N IN cases entre 7 et 10. Au-delà, la grille 4×4 est trop saturée
  // (≥ 75 % de cases IN) et le puzzle perd son intérêt.
  const n = 7 + rng.nextInt(4) // 7..10
  const totalCells = width * height // 16
  const fillerCount = totalCells - n // 6..9

  // Tire N membres distincts.
  const shuffledMembers = rng.shuffle(curated.members.slice())
  const chosenMembers = shuffledMembers.slice(0, n)

  // Pool de fillers = membres de tous les **autres** thèmes curés. Un
  // membre du thème courant n'est jamais filler (auto-exclu via memberSet).
  // Si un même mot apparaît dans deux thèmes (ex. « voile » pour mer et
  // transport), il faut l'inclure dans les deux listes de membres pour
  // qu'il ne se retrouve jamais filler dans l'un quand il est légitime IN.
  const fillerPool = new Set<string>()
  for (const [otherDate, otherTheme] of Object.entries(CURATED_THEMES_L1)) {
    if (otherDate === date) continue
    for (const m of otherTheme.members) {
      if (memberSet.has(m)) continue
      // Le mot-thème lui-même ne doit jamais apparaître comme filler dans
      // son propre puzzle (sinon le joueur le verrait dans la grille et le
      // marquerait IN, alors qu'il est censé être OUT).
      if (m === curated.word) continue
      fillerPool.add(m)
    }
  }
  if (fillerPool.size < fillerCount) {
    throw new Error(
      `Pool de fillers trop petit pour le thème ${curated.word} (${fillerPool.size} < ${fillerCount})`,
    )
  }
  const shuffledFillers = rng.shuffle(Array.from(fillerPool))
  const chosenFillers = shuffledFillers.slice(0, fillerCount)

  // Construit la liste de toutes les cases (membres + fillers) avec leur statut,
  // puis les place aléatoirement dans la grille 4×4.
  type Cell = { word: string; isIn: boolean }
  const cells: Cell[] = [
    ...chosenMembers.map((w) => ({ word: w, isIn: true })),
    ...chosenFillers.map((w) => ({ word: w, isIn: false })),
  ]
  rng.shuffle(cells)

  const words: string[][] = []
  const solution: boolean[][] = []
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

  // Indices ligne/colonne calculés depuis la matrice solution.
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
    id: `${date}-1`,
    name: `Niveau 1 · ${width}×${height}`,
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
