import { Rng } from '~/lib/random'
import { WORDS_BY_LENGTH } from '../words'
import type { Block, Coord, Direction, Level } from './types'

/**
 * Indique si un niveau Sokomot d'index donné est en mode glace.
 *
 * Les niveaux 2 et 4 introduisent toujours la mécanique de glace.
 */
export function isIceIndex(index: 1 | 2 | 3 | 4): boolean {
  return index === 2 || index === 4
}

/**
 * Génère un niveau Sokomot pour une date et un index donnés.
 *
 * Template (toujours résoluble par construction) :
 * - Salle rectangulaire bordée de murs (largeur W, hauteur H).
 * - Cases cibles sur la ligne 2, centrées horizontalement.
 *
 * Mode classique (niveaux 1 et 3) :
 * - Blocs juste en dessous des cibles (ligne 3), prêts à être poussés vers le haut.
 *
 * Mode glace (niveaux 2 et 4) :
 * - Blocs sur la ligne H-3.
 * - Toutes les cases entre la ligne 3 et la ligne H-4 sont gelées : pousser un
 *   bloc le fait glisser jusqu'à la ligne 2 (premier non-glace au-dessus).
 *
 * Joueur en bas-gauche (1, H-2) dans tous les cas.
 *
 * Tailles :
 * - Niveau 1 : 7×6, mot de 3 lettres
 * - Niveau 2 : 8×7, mot de 4 lettres, glace
 * - Niveau 3 : 9×8, mot de 5 lettres
 * - Niveau 4 : 10×9, mot de 6 lettres, glace
 */
export function generateSokomotLevel(date: string, index: 1 | 2 | 3 | 4): Level {
  const isIce = isIceIndex(index)
  const width = 6 + index
  const height = 5 + index
  const wordLen = 2 + index
  const rng = new Rng(`sokomot:${date}:${index}`)
  const words = WORDS_BY_LENGTH[wordLen] ?? []
  const word = rng.pick(words)
  const leftStart = Math.floor((width - wordLen) / 2)

  const blockRow = isIce ? height - 3 : 3
  const playerRow = height - 2
  const pushRow = blockRow + 1

  const walls: Coord[] = []
  for (let x = 0; x < width; x++) {
    walls.push([x, 0])
    walls.push([x, height - 1])
  }
  for (let y = 1; y < height - 1; y++) {
    walls.push([0, y])
    walls.push([width - 1, y])
  }

  // Glace : remplit les cases entre la ligne cible et la ligne des blocs
  // (exclues), sur toute la largeur jouable.
  const ice: Coord[] = []
  if (isIce) {
    for (let y = 3; y < blockRow; y++) {
      for (let x = 1; x < width - 1; x++) {
        ice.push([x, y])
      }
    }
  }

  const targets: Coord[] = []
  const blocks: Block[] = []
  for (let i = 0; i < wordLen; i++) {
    const col = leftStart + i
    targets.push([col, 2])
    blocks.push({ id: `b${i + 1}`, letter: word[i], pos: [col, blockRow] })
  }

  const player: Coord = [1, playerRow]

  // Solution :
  // 1. Remonter de la ligne playerRow à pushRow si nécessaire (mode classique).
  // 2. Pour chaque bloc, se déplacer horizontalement à sa colonne, pousser
  //    vers le haut (slide automatique en mode glace), redescendre au pushRow
  //    pour le bloc suivant.
  const solution: Direction[] = []
  let pos: Coord = [...player] as Coord
  while (pos[1] > pushRow) {
    solution.push('up')
    pos = [pos[0], pos[1] - 1]
  }
  blocks.forEach((b, i) => {
    const col = b.pos[0]
    while (pos[0] < col) {
      solution.push('right')
      pos = [pos[0] + 1, pos[1]]
    }
    while (pos[0] > col) {
      solution.push('left')
      pos = [pos[0] - 1, pos[1]]
    }
    solution.push('up')
    pos = [pos[0], pos[1] - 1]
    if (i < blocks.length - 1) {
      solution.push('down')
      pos = [pos[0], pos[1] + 1]
    }
  })

  return {
    id: `${date}-${index}`,
    name: `Niveau ${index} · ${width}×${height}${isIce ? ' · glace' : ''}`,
    width,
    height,
    player,
    walls,
    ice,
    blocks,
    target: { word, cells: targets },
    parMoves: solution.length + 2,
    solution,
  }
}
