/**
 * Génère les fichiers JSON des défis quotidiens pour les trois jeux.
 *
 * Usage : `npm run generate:levels` (ou avec un range : tsx scripts/generate-levels.ts 2026-04-01 2026-05-07)
 *
 * Pour chaque date du range et chaque niveau (1..4), écrit un fichier dans :
 *   app/games/<jeu>/challenges/<YYYY-MM>/<YYYY-MM-DD>-<index>.json
 *
 * Un fichier = un niveau. Les fichiers sont organisés par dossier mensuel.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { dateRange, monthKey } from '../app/lib/dates.js'
import { generateBoucleLevel } from '../app/games/boucle/generator.js'
import { generateSemantogrammeLevel } from '../app/games/semantogramme/generator.js'
import { generateSokomotLevel } from '../app/games/sokomot/generator.js'

const DEFAULT_START = '2026-04-01'
const DEFAULT_END = '2026-05-07'

const ROOT = path.resolve(import.meta.dirname, '..')

const args = process.argv.slice(2)
const start = args[0] ?? DEFAULT_START
const end = args[1] ?? DEFAULT_END

const dates = dateRange(start, end)

console.log(`Génération de ${dates.length} jours (${start} → ${end})`)

const games = [
  { id: 'sokomot', generator: generateSokomotLevel },
  { id: 'boucle', generator: generateBoucleLevel },
  { id: 'semantogramme', generator: generateSemantogrammeLevel },
] as const

let total = 0
for (const game of games) {
  const root = path.join(ROOT, 'app/games', game.id, 'challenges')
  await fs.mkdir(root, { recursive: true })
  // Supprime uniquement les sous-dossiers mensuels (pour éviter les fichiers
  // orphelins quand le range change), mais préserve `index.ts` à la racine.
  const existing = await fs.readdir(root, { withFileTypes: true })
  for (const entry of existing) {
    if (entry.isDirectory()) {
      await fs.rm(path.join(root, entry.name), { recursive: true, force: true })
    }
  }

  for (const date of dates) {
    const monthDir = path.join(root, monthKey(date))
    await fs.mkdir(monthDir, { recursive: true })
    for (const index of [1, 2, 3, 4] as const) {
      const level = game.generator(date, index)
      const outPath = path.join(monthDir, `${date}-${index}.json`)
      await fs.writeFile(outPath, JSON.stringify(level, null, 2) + '\n', 'utf-8')
      total += 1
    }
  }
  console.log(`  ${game.id} : ${dates.length} jours × 4 = ${dates.length * 4} fichiers écrits`)
}

console.log(`✓ ${total} niveaux générés au total.`)
