/**
 * Génère les fichiers JSON des défis quotidiens pour les trois jeux.
 *
 * Usage :
 *   tsx scripts/generate-levels.ts [options]
 *
 * Options :
 *   --start <YYYY-MM-DD>   Date de début (défaut : 2026-04-01)
 *   --end <YYYY-MM-DD>     Date de fin   (défaut : 2027-01-31)
 *   --game <id>            Restreindre à un jeu (sokomot|boucle|semantogramme).
 *                          Peut être répété : --game sokomot --game boucle
 *   --level <n>            Restreindre à un niveau (1..4). Peut être répété.
 *   --clean                Supprimer les fichiers couverts par le filtre avant
 *                          de regénérer. Sans ce flag, on ne touche que les
 *                          fichiers du range — les autres restent intacts.
 *   -h, --help             Afficher cette aide.
 *
 * Exemples :
 *   tsx scripts/generate-levels.ts
 *     → tout regénère (défaut), n'écrase pas les fichiers hors range.
 *
 *   tsx scripts/generate-levels.ts --start 2026-05-01 --end 2026-05-07 --game sokomot --level 3
 *     → ne (re)génère que les Sokomot L3 entre le 1er et le 7 mai 2026.
 *
 *   tsx scripts/generate-levels.ts --clean
 *     → wipe complet de tous les dossiers mensuels puis regénère tout.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { dateRange, monthKey } from '../app/lib/dates.js'
import { generateBoucleLevel } from '../generators/boucle.js'
import { generateSemantogrammeLevel } from '../generators/semantogramme.js'
import { generateSokomotLevel } from '../generators/sokomot.js'

const DEFAULT_START = '2026-04-01'
const DEFAULT_END = '2027-01-31'

const ROOT = path.resolve(import.meta.dirname, '..')

const ALL_GAMES = [
  { id: 'sokomot', generator: generateSokomotLevel },
  { id: 'boucle', generator: generateBoucleLevel },
  { id: 'semantogramme', generator: generateSemantogrammeLevel },
] as const

type GameId = (typeof ALL_GAMES)[number]['id']
type LevelIndex = 1 | 2 | 3 | 4

const ALL_LEVELS: readonly LevelIndex[] = [1, 2, 3, 4] as const

function parseArgs(argv: readonly string[]): {
  start: string
  end: string
  games: readonly GameId[]
  levels: readonly LevelIndex[]
  clean: boolean
} {
  let start = DEFAULT_START
  let end = DEFAULT_END
  const games = new Set<GameId>()
  const levels = new Set<LevelIndex>()
  let clean = false

  const validGameIds = new Set<string>(ALL_GAMES.map((g) => g.id))

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const takeValue = () => {
      const v = argv[i + 1]
      if (!v || v.startsWith('--')) {
        throw new Error(`Option ${arg} attend une valeur`)
      }
      i++
      return v
    }
    switch (arg) {
      case '-h':
      case '--help':
        printHelp()
        process.exit(0)
        break
      case '--start':
        start = takeValue()
        break
      case '--end':
        end = takeValue()
        break
      case '--game': {
        const v = takeValue()
        if (!validGameIds.has(v)) {
          throw new Error(`--game inconnu : ${v} (attendu : sokomot|boucle|semantogramme)`)
        }
        games.add(v as GameId)
        break
      }
      case '--level': {
        const v = takeValue()
        const n = Number(v)
        if (!Number.isInteger(n) || n < 1 || n > 4) {
          throw new Error(`--level invalide : ${v} (attendu : 1..4)`)
        }
        levels.add(n as LevelIndex)
        break
      }
      case '--clean':
        clean = true
        break
      default:
        throw new Error(`Argument inconnu : ${arg} (voir --help)`)
    }
  }

  return {
    start,
    end,
    games: games.size > 0 ? Array.from(games) : ALL_GAMES.map((g) => g.id),
    levels: levels.size > 0 ? Array.from(levels).sort() : ALL_LEVELS,
    clean,
  }
}

function printHelp(): void {
  console.log(`Usage : tsx scripts/generate-levels.ts [options]

Options :
  --start <YYYY-MM-DD>   Date de début (défaut : ${DEFAULT_START})
  --end   <YYYY-MM-DD>   Date de fin   (défaut : ${DEFAULT_END})
  --game  <id>           Jeu à générer (sokomot|boucle|semantogramme). Répétable.
  --level <n>            Niveau à générer (1..4). Répétable.
  --clean                Supprimer les fichiers du filtre avant régénération.
  -h, --help             Cette aide.

Sans --clean, les fichiers hors filtre sont préservés ; les fichiers dans le
filtre sont écrasés.`)
}

const opts = parseArgs(process.argv.slice(2))
const dates = dateRange(opts.start, opts.end)
const selectedGames = ALL_GAMES.filter((g) => opts.games.includes(g.id))

console.log(`Génération de ${dates.length} jours (${opts.start} → ${opts.end})`)
console.log(`  jeux   : ${opts.games.join(', ')}`)
console.log(`  niveaux: ${opts.levels.join(', ')}`)
if (opts.clean) console.log(`  --clean activé : suppression des fichiers du filtre avant écriture`)

let total = 0
for (const game of selectedGames) {
  const root = path.join(ROOT, 'app/games', game.id, 'challenges')
  await fs.mkdir(root, { recursive: true })

  if (opts.clean) {
    for (const date of dates) {
      const monthDir = path.join(root, monthKey(date))
      for (const index of opts.levels) {
        const p = path.join(monthDir, `${date}-${index}.json`)
        await fs.rm(p, { force: true })
      }
    }
  }

  let written = 0
  for (const date of dates) {
    const monthDir = path.join(root, monthKey(date))
    await fs.mkdir(monthDir, { recursive: true })
    for (const index of opts.levels) {
      const level = game.generator(date, index)
      const outPath = path.join(monthDir, `${date}-${index}.json`)
      await fs.writeFile(outPath, JSON.stringify(level, null, 2) + '\n', 'utf-8')
      written += 1
      total += 1
    }
  }
  console.log(`  ${game.id} : ${written} fichiers écrits`)
}

console.log(`✓ ${total} niveaux générés au total.`)
