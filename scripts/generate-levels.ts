/**
 * Génère les fichiers JSON des défis quotidiens de chaque jeu. À ne lancer
 * que sur commande explicite (`make generate-levels`) : les niveaux publiés
 * sont figés, et les grilles Sémantogramme ne se régénèrent jamais (voir
 * `docs/semantogramme-curation.md`).
 *
 * Usage :
 *   tsx scripts/generate-levels.ts [options]
 *
 * Options :
 *   --start <YYYY-MM-DD>   Date de début (défaut : début du calendrier, 2026-09-01)
 *   --end <YYYY-MM-DD>     Date de fin   (défaut : fin du calendrier, 2027-09-30)
 *   --game <id>            Restreindre à un jeu (sokomot|boucle|semantogramme|anglemort).
 *                          Peut être répété : --game sokomot --game boucle
 *   --level <n>            Restreindre à un niveau (1..4). Peut être répété.
 *   --clean                Supprimer d'abord les fichiers du filtre (dates, jeux,
 *                          niveaux), sauf les grilles de base fixées d'Angle mort.
 *                          Sans ce flag, les fichiers du filtre sont écrasés et
 *                          tous les autres restent intacts.
 *   -h, --help             Afficher cette aide.
 *
 * Exemples :
 *   tsx scripts/generate-levels.ts --start 2026-10-01 --end 2026-10-07 --game sokomot --level 3
 *     → ne (re)génère que les Sokomot L3 du 1er au 7 octobre 2026.
 *
 *   tsx scripts/generate-levels.ts --game anglemort --level 4 --clean
 *     → supprime puis régénère tous les Angle mort L4 du calendrier.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { LEVEL_INDICES, type LevelIndex } from '../app/games/types.js'
import { dateRange, monthKey } from '../app/lib/dates.js'
import { stripAccents } from '../app/lib/text.js'
import { generateAngleMortLevel } from '../generators/anglemort.js'
import { isFixedBaseLevel } from '../generators/anglemort-schedule.js'
import { generateBoucleLevel } from '../generators/boucle.js'
import { CALENDAR_END, CALENDAR_START } from '../generators/calendar.js'
import { generateSemantogrammeLevel } from '../generators/semantogramme.js'
import { generateSokomotLevel } from '../generators/sokomot.js'
import { filesToClean, levelFile } from './level-files.js'

const ROOT = path.resolve(import.meta.dirname, '..')

type GameEntry = {
  id: 'sokomot' | 'boucle' | 'semantogramme' | 'anglemort'
  /** `usedWords` : mots déjà publiés, pour les jeux qui les excluent. */
  generator: (date: string, index: LevelIndex, usedWords: Set<string>) => object
  /** Mot à trouver d'un niveau : jamais deux fois le même un jour donné, tous jeux confondus. */
  wordOf?: (level: {
    solutionWord?: string
    target?: { word: string }
    themeWord?: string
  }) => string
  /** Le générateur exclut aussi les mots déjà publiés les autres jours. */
  noRepeat?: boolean
  /** Niveaux que `--clean` ne supprime jamais. */
  keep?: (date: string, index: LevelIndex) => boolean
}

/** Forme affichée d'un mot : sans accents, en majuscules. */
function display(word: string): string {
  return stripAccents(word).toUpperCase()
}

const ALL_GAMES: readonly GameEntry[] = [
  {
    id: 'sokomot',
    generator: (d, i, usedWords) => generateSokomotLevel(d, i, { usedWords }),
    wordOf: (level) => level.target?.word ?? '',
    noRepeat: true,
  },
  {
    id: 'boucle',
    generator: (d, i, usedWords) => generateBoucleLevel(d, i, { usedWords }),
    wordOf: (level) => level.solutionWord ?? '',
    noRepeat: true,
  },
  {
    id: 'semantogramme',
    generator: (d, i) => generateSemantogrammeLevel(d, i),
    wordOf: (level) => level.themeWord ?? '',
  },
  {
    id: 'anglemort',
    generator: (d, i) => generateAngleMortLevel(d, i),
    // Le générateur relit ces fichiers : les supprimer casserait la génération.
    keep: isFixedBaseLevel,
  },
]

type GameId = GameEntry['id']

function parseArgs(argv: readonly string[]): {
  start: string
  end: string
  games: readonly GameId[]
  levels: readonly LevelIndex[]
  clean: boolean
} {
  let start = CALENDAR_START
  let end = CALENDAR_END
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
          throw new Error(
            `--game inconnu : ${v} (attendu : sokomot|boucle|semantogramme|anglemort)`,
          )
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
    levels: levels.size > 0 ? Array.from(levels).sort() : LEVEL_INDICES,
    clean,
  }
}

function printHelp(): void {
  console.log(`Usage : tsx scripts/generate-levels.ts [options]

Options :
  --start <YYYY-MM-DD>   Date de début (défaut : ${CALENDAR_START})
  --end   <YYYY-MM-DD>   Date de fin   (défaut : ${CALENDAR_END})
  --game  <id>           Jeu à générer (sokomot|boucle|semantogramme|anglemort). Répétable.
  --level <n>            Niveau à générer (1..4). Répétable.
  --clean                Supprimer les fichiers du filtre avant régénération
                         (sauf les grilles de base fixées d'Angle mort).
  -h, --help             Cette aide.

Sans --clean, les fichiers hors filtre sont préservés ; les fichiers dans le
filtre sont écrasés.`)
}

const opts = parseArgs(process.argv.slice(2))
const selectedGames = ALL_GAMES.filter((g) => opts.games.includes(g.id))

console.log(`Génération du ${opts.start} au ${opts.end}`)
console.log(`  jeux   : ${opts.games.join(', ')}`)
console.log(`  niveaux: ${opts.levels.join(', ')}`)
if (opts.clean) console.log(`  --clean activé : suppression des fichiers du filtre avant écriture`)

let total = 0
for (const game of selectedGames) {
  const root = path.join(ROOT, 'app/games', game.id, 'challenges')
  await fs.mkdir(root, { recursive: true })
  const dates = dateRange(opts.start, opts.end)

  if (opts.clean) {
    for (const file of filesToClean(dates, opts.levels, game.keep)) {
      await fs.rm(path.join(root, file), { force: true })
    }
  }

  // Mots des niveaux conservés (hors de la plage régénérée) : jamais repris.
  const usedWords = new Set<string>()
  if (game.wordOf && game.noRepeat) {
    const regenerated = new Set(dates.flatMap((d) => opts.levels.map((i) => levelFile(d, i))))
    for (const month of await fs.readdir(root)) {
      if (!/^\d{4}-\d{2}$/.test(month)) continue
      for (const file of await fs.readdir(path.join(root, month))) {
        if (!file.endsWith('.json') || regenerated.has(`${month}/${file}`)) continue
        const level = JSON.parse(await fs.readFile(path.join(root, month, file), 'utf-8'))
        usedWords.add(display(game.wordOf(level)))
      }
    }
  }

  /** Mots à trouver des autres jeux à cette date. */
  async function otherGamesWords(date: string): Promise<string[]> {
    const words: string[] = []
    for (const other of ALL_GAMES) {
      if (other.id === game.id || !other.wordOf) continue
      for (const index of LEVEL_INDICES) {
        const file = path.join(ROOT, 'app/games', other.id, 'challenges', levelFile(date, index))
        const raw = await fs.readFile(file, 'utf-8').catch(() => null)
        if (raw) words.push(display(other.wordOf(JSON.parse(raw))))
      }
    }
    return words
  }

  let written = 0
  for (const date of dates) {
    const monthDir = path.join(root, monthKey(date))
    await fs.mkdir(monthDir, { recursive: true })
    const excluded = game.wordOf ? [...usedWords, ...(await otherGamesWords(date))] : []
    for (const index of opts.levels) {
      const level = game.generator(date, index, new Set(excluded))
      if (game.wordOf) {
        const word = display(game.wordOf(level))
        usedWords.add(word)
        excluded.push(word)
      }
      const outPath = path.join(root, levelFile(date, index))
      await fs.writeFile(outPath, JSON.stringify(level, null, 2) + '\n', 'utf-8')
      written += 1
      total += 1
    }
  }
  console.log(
    `  ${game.id} : ${written} fichiers écrits (${dates[0]} → ${dates[dates.length - 1]})`,
  )
}

console.log(`✓ ${total} niveaux générés au total.`)
