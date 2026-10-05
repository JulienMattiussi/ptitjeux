import { describe, expect, it } from 'vitest'
import {
  areCluesSatisfied,
  beamOutlines,
  computeVision,
  corridorOrder,
  doorSide,
  expectedCorridor,
  guardAt,
  guardDirs,
  isFacingAllowed,
  isFloor,
  isPlaceable,
  isPoolComplete,
  isSinglePath,
  isWon,
  loadLevel,
  pickableTypes,
  placeGuard,
  reducer,
  remaining,
  removeGuard,
  restFacing,
  rotateGuard,
  stepDir,
  toggleGuard,
  unseenCells,
} from '~/games/anglemort/engine'
import type { GameState, Guard, Level, Pos } from '~/games/anglemort/types'

/**
 * Grille 4×3, couloir sur la ligne du haut :
 *
 *   🚪 .  .  💎
 *   .  .  .  ←
 *   →  .  .  .
 */
function makeLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 'test',
    name: 'Test',
    width: 4,
    height: 3,
    pillars: [],
    mirrors: [],
    door: [0, 0],
    diamond: [3, 0],
    clues: { '1,1': 1 },
    pool: { simple: 2, angle: 0, oppose: 0 },
    parMoves: 2,
    solution: [
      { pos: [0, 2], type: 'simple', facing: 'E' },
      { pos: [3, 1], type: 'simple', facing: 'W' },
    ],
    ...overrides,
  }
}

function withGuards(level: Level, guards: Guard[]): GameState {
  return { level, guards, moves: guards.length }
}

describe('anglemort engine : vigiles', () => {
  it('un vigile simple regarde dans une seule direction', () => {
    expect(guardDirs({ type: 'simple', facing: 'W' })).toEqual(['W'])
  })

  it('un vigile en angle regarde devant lui et à sa droite', () => {
    expect(guardDirs({ type: 'angle', facing: 'N' })).toEqual(['N', 'E'])
  })

  it('un vigile opposé regarde devant et derrière lui', () => {
    expect(guardDirs({ type: 'oppose', facing: 'E' })).toEqual(['E', 'W'])
  })

  it('charge un niveau sans vigile ni coup', () => {
    const state = loadLevel(makeLevel())
    expect(state.guards).toEqual([])
    expect(state.moves).toBe(0)
  })
})

describe('anglemort engine : placement', () => {
  it('refuse la porte, le diamant, les indices, les piliers, les miroirs et le hors-grille', () => {
    const level = makeLevel({
      pillars: [[2, 2]],
      mirrors: [{ pos: [2, 1], kind: '/' }],
    })
    const refused: Pos[] = [
      [0, 0],
      [3, 0],
      [1, 1],
      [2, 2],
      [2, 1],
      [-1, 0],
      [4, 0],
    ]
    expect(refused.filter(([x, y]) => isPlaceable(level, x, y))).toEqual([])
  })

  it('pose un vigile simple orienté au nord et compte un coup', () => {
    const state = placeGuard(loadLevel(makeLevel()), 0, 2)
    expect(state.guards).toEqual([{ pos: [0, 2], type: 'simple', facing: 'N' }])
    expect(state.moves).toBe(1)
  })

  it('ne pose rien sur une case interdite', () => {
    const state = loadLevel(makeLevel())
    expect(placeGuard(state, 0, 0)).toBe(state)
  })

  it('pose dans la première orientation qui ne donne pas sur le mur', () => {
    const state = placeGuard(loadLevel(makeLevel()), 1, 0)
    expect(guardAt(state, 1, 0)?.facing).toBe('E')
  })

  it('ne pose rien dans une case cernée de murs et de piliers', () => {
    const state = loadLevel(
      makeLevel({
        pillars: [
          [1, 2],
          [2, 1],
          [3, 2],
        ],
      }),
    )
    expect(placeGuard(state, 2, 2)).toBe(state)
  })

  it('refuse une lampe braquée contre un pilier ou le mur', () => {
    const level = makeLevel({ pillars: [[2, 1]] })
    expect(isFacingAllowed(level, { pos: [2, 2], type: 'simple', facing: 'N' })).toBe(false)
    expect(isFacingAllowed(level, { pos: [2, 2], type: 'simple', facing: 'S' })).toBe(false)
    expect(isFacingAllowed(level, { pos: [2, 2], type: 'simple', facing: 'E' })).toBe(true)
  })

  it('ne pose rien sur un vigile existant', () => {
    const state = placeGuard(loadLevel(makeLevel()), 0, 2)
    expect(placeGuard(state, 0, 2)).toBe(state)
  })

  it('ne pose rien quand le lot est épuisé', () => {
    let state = loadLevel(makeLevel({ pool: { simple: 1, angle: 0, oppose: 0 } }))
    state = placeGuard(state, 0, 2)
    expect(placeGuard(state, 3, 1)).toBe(state)
  })

  it('pose le type choisi au sélecteur', () => {
    const level = makeLevel({ pool: { simple: 1, angle: 1, oppose: 0 } })
    const state = placeGuard(loadLevel(level), 2, 1, 'angle')
    expect(guardAt(state, 2, 1)?.type).toBe('angle')
  })

  it('ne pose rien si le type choisi est épuisé', () => {
    const level = makeLevel({ pool: { simple: 1, angle: 0, oppose: 0 } })
    const state = loadLevel(level)
    expect(placeGuard(state, 2, 1, 'angle')).toBe(state)
  })

  it("transmet le type choisi via l'action toggle", () => {
    const level = makeLevel({ pool: { simple: 1, angle: 1, oppose: 0 } })
    const state = reducer(loadLevel(level), { type: 'toggle', x: 2, y: 1, guardType: 'angle' })
    expect(guardAt(state, 2, 1)?.type).toBe('angle')
  })

  it('pose le type suivant du lot quand les simples sont épuisés', () => {
    let state = loadLevel(makeLevel({ pool: { simple: 1, angle: 0, oppose: 1 } }))
    state = placeGuard(placeGuard(state, 0, 2), 3, 1)
    expect(guardAt(state, 3, 1)?.type).toBe('oppose')
  })

  it('décompte le lot restant par type', () => {
    const state = placeGuard(loadLevel(makeLevel()), 0, 2)
    expect(remaining(state, 'simple')).toBe(1)
  })

  it('retire un vigile sans compter de coup', () => {
    const state = removeGuard(placeGuard(loadLevel(makeLevel()), 0, 2), 0, 2)
    expect(state.guards).toEqual([])
    expect(state.moves).toBe(1)
  })

  it('ignore le retrait sur une case vide', () => {
    const state = loadLevel(makeLevel())
    expect(removeGuard(state, 1, 2)).toBe(state)
  })

  it('toggle pose puis retire', () => {
    const placed = toggleGuard(loadLevel(makeLevel()), 0, 2)
    expect(guardAt(placed, 0, 2)).toBeDefined()
    expect(guardAt(toggleGuard(placed, 0, 2), 0, 2)).toBeUndefined()
  })
})

describe('anglemort engine : rotation', () => {
  function facings(state: GameState, [x, y]: Pos, turns: number): string[] {
    const out: string[] = []
    for (let i = 0; i < turns; i++) {
      state = rotateGuard(state, x, y)
      const g = guardAt(state, x, y)
      out.push(`${g?.type}:${g?.facing}`)
    }
    return out
  }

  it('un vigile simple au centre fait le tour des 4 orientations', () => {
    const state = placeGuard(loadLevel(makeLevel()), 2, 1)
    expect(facings(state, [2, 1], 4)).toEqual(['simple:E', 'simple:S', 'simple:W', 'simple:N'])
  })

  it('saute les orientations braquées contre le mur', () => {
    const state = placeGuard(loadLevel(makeLevel()), 0, 2)
    expect(facings(state, [0, 2], 2)).toEqual(['simple:E', 'simple:N'])
  })

  it('reste dans son type : un vigile opposé alterne entre ses 2 orientations', () => {
    const level = makeLevel({ pool: { simple: 1, angle: 0, oppose: 1 } })
    const state = placeGuard(loadLevel(level), 2, 1, 'oppose')
    expect(facings(state, [2, 1], 3)).toEqual(['oppose:E', 'oppose:N', 'oppose:E'])
  })

  it('un vigile simple pivote sans changer de type, même avec un autre type au lot', () => {
    const level = makeLevel({ pool: { simple: 1, angle: 1, oppose: 0 } })
    const state = withGuards(level, [
      { pos: [0, 2], type: 'simple', facing: 'E' },
      { pos: [3, 1], type: 'angle', facing: 'N' },
    ])
    expect(guardAt(rotateGuard(state, 0, 2), 0, 2)).toEqual({
      pos: [0, 2],
      type: 'simple',
      facing: 'N',
    })
  })

  it('ne compte pas la rotation comme un coup', () => {
    const state = placeGuard(loadLevel(makeLevel()), 0, 2)
    expect(rotateGuard(state, 0, 2).moves).toBe(1)
  })

  it("ne pivote pas un vigile dont aucune orientation n'est autorisée", () => {
    const level = makeLevel({
      pillars: [
        [1, 2],
        [2, 1],
        [3, 2],
      ],
    })
    const state = withGuards(level, [{ pos: [2, 2], type: 'simple', facing: 'N' }])
    expect(rotateGuard(state, 2, 2)).toBe(state)
  })

  it('ignore la rotation sur une case vide', () => {
    const state = loadLevel(makeLevel())
    expect(rotateGuard(state, 1, 2)).toBe(state)
  })
})

describe('anglemort engine : vision', () => {
  it("un regard couvre la ligne jusqu'au bord", () => {
    const level = makeLevel()
    const { seen } = computeVision(level, [{ pos: [0, 2], type: 'simple', facing: 'E' }])
    expect(seen[2]).toEqual([0, 1, 1, 1])
  })

  it('un pilier arrête le regard', () => {
    const level = makeLevel({ pillars: [[2, 2]] })
    const { seen } = computeVision(level, [{ pos: [0, 2], type: 'simple', facing: 'E' }])
    expect(seen[2]).toEqual([0, 1, 0, 0])
  })

  it('compte le nombre de vigiles qui voient une case', () => {
    const level = makeLevel()
    const { seen } = computeVision(level, [
      { pos: [0, 2], type: 'simple', facing: 'E' },
      { pos: [1, 0], type: 'simple', facing: 'S' },
    ])
    expect(seen[2][1]).toBe(2)
  })

  it("un vigile arrête le faisceau d'un autre et fait de l'ombre derrière lui", () => {
    const level = makeLevel()
    const { seen } = computeVision(level, [
      { pos: [0, 2], type: 'simple', facing: 'E' },
      { pos: [2, 2], type: 'simple', facing: 'N' },
    ])
    expect(seen[2]).toEqual([0, 1, 0, 0])
  })

  it("un miroir / renvoie vers le nord un regard qui va vers l'est", () => {
    const level = makeLevel({ mirrors: [{ pos: [2, 2], kind: '/' }] })
    const { seen } = computeVision(level, [{ pos: [0, 2], type: 'simple', facing: 'E' }])
    expect([seen[2][3], seen[1][2], seen[0][2]]).toEqual([0, 1, 1])
  })

  it("un miroir \\ renvoie vers le sud un regard qui va vers l'est", () => {
    const level = makeLevel({ mirrors: [{ pos: [2, 0], kind: '\\' }] })
    const { seen } = computeVision(level, [{ pos: [0, 0], type: 'simple', facing: 'E' }])
    expect([seen[0][3], seen[1][2], seen[2][2]]).toEqual([0, 1, 1])
  })

  it('un faisceau éclaire la moitié du miroir par laquelle il entre', () => {
    const level = makeLevel({ mirrors: [{ pos: [2, 0], kind: '\\' }] })
    const { litMirrors } = computeVision(level, [{ pos: [0, 0], type: 'simple', facing: 'E' }])
    expect(litMirrors).toEqual({ '2,0': ['SW'] })
  })

  it('deux faisceaux sur les deux faces éclairent les deux moitiés du miroir', () => {
    const level = makeLevel({ width: 5, mirrors: [{ pos: [2, 0], kind: '/' }] })
    const { litMirrors } = computeVision(level, [
      { pos: [0, 0], type: 'simple', facing: 'E' },
      { pos: [4, 0], type: 'simple', facing: 'W' },
    ])
    expect(litMirrors['2,0']).toEqual(['NW', 'SE'])
  })

  it("le tracé d'un faisceau s'arrête au bord de la case qui le bloque", () => {
    const level = makeLevel({ pillars: [[3, 2]] })
    const guard: Guard = { pos: [0, 2], type: 'simple', facing: 'E' }
    expect(beamOutlines(level, [guard], guard)).toEqual([
      [
        [0, 2],
        [2.5, 2],
      ],
    ])
  })

  it("le tracé d'un faisceau tourne sur les miroirs", () => {
    const level = makeLevel({ mirrors: [{ pos: [2, 0], kind: '\\' }] })
    const guard: Guard = { pos: [0, 0], type: 'simple', facing: 'E' }
    expect(beamOutlines(level, [guard], guard)).toEqual([
      [
        [0, 0],
        [2, 0],
        [2, 2.5],
      ],
    ])
  })

  it("le tracé d'une lampe contre un vigile s'arrête au bord de sa case", () => {
    const guards: Guard[] = [
      { pos: [0, 2], type: 'simple', facing: 'E' },
      { pos: [1, 2], type: 'simple', facing: 'N' },
    ]
    expect(beamOutlines(makeLevel(), guards, guards[0])).toEqual([
      [
        [0, 2],
        [0.5, 2],
      ],
    ])
  })

  it("un regard qui boucle par les miroirs s'arrête en revenant sur son vigile", () => {
    const level = makeLevel({
      width: 3,
      height: 3,
      mirrors: [
        { pos: [2, 0], kind: '\\' },
        { pos: [2, 2], kind: '/' },
        { pos: [0, 2], kind: '\\' },
      ],
    })
    const { seen } = computeVision(level, [{ pos: [0, 0], type: 'simple', facing: 'E' }])
    expect(seen).toEqual([
      [0, 1, 0],
      [1, 0, 1],
      [0, 1, 0],
    ])
  })

  it("un vigile à deux regards ne compte qu'une fois une case vue deux fois", () => {
    const level = makeLevel({
      width: 3,
      height: 3,
      mirrors: [
        { pos: [2, 0], kind: '\\' },
        { pos: [2, 2], kind: '/' },
        { pos: [0, 2], kind: '\\' },
      ],
    })
    const { seen } = computeVision(level, [{ pos: [0, 0], type: 'angle', facing: 'E' }])
    expect(seen[1][2]).toBe(1)
  })
})

describe('anglemort engine : chemin du cambrioleur', () => {
  const door: Pos = [0, 0]
  const diamond: Pos = [3, 0]

  it('accepte un chemin simple de la porte au diamant', () => {
    expect(
      isSinglePath(
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0],
        ],
        door,
        diamond,
      ),
    ).toBe(true)
  })

  it('refuse un chemin qui ne contient pas la porte', () => {
    expect(
      isSinglePath(
        [
          [1, 0],
          [2, 0],
          [3, 0],
        ],
        door,
        diamond,
      ),
    ).toBe(false)
  })

  it('refuse une porte confondue avec le diamant', () => {
    expect(isSinglePath([[0, 0]], door, door)).toBe(false)
  })

  it('refuse un embranchement', () => {
    expect(
      isSinglePath(
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0],
          [1, 1],
        ],
        door,
        diamond,
      ),
    ).toBe(false)
  })

  it('refuse un îlot non surveillé détaché du chemin', () => {
    const island: Pos[] = [
      [0, 2],
      [1, 2],
      [0, 3],
      [1, 3],
    ]
    // Chaque case de l'îlot 2×2 a 2 voisins : seul le test de connexité le rejette.
    expect(isSinglePath([[0, 0], [1, 0], [2, 0], [3, 0], ...island], door, diamond)).toBe(false)
  })

  it('liste les cases de sol libres que personne ne voit', () => {
    const level = makeLevel()
    const guards = makeLevel().solution
    expect(unseenCells(level, guards, computeVision(level, guards))).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ])
  })
})

describe('anglemort engine : couloir attendu', () => {
  it('déduit le couloir de la solution enregistrée', () => {
    expect(expectedCorridor(makeLevel())).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ])
  })
})

describe('anglemort engine : marche du cambrioleur', () => {
  it('ordonne le couloir de la porte au diamant', () => {
    const cells: Pos[] = [
      [2, 1],
      [0, 0],
      [2, 0],
      [1, 0],
    ]
    expect(corridorOrder(cells, [0, 0])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ])
  })

  it("renvoie une liste vide si la porte n'est pas dans le couloir", () => {
    expect(corridorOrder([[1, 0]], [0, 0])).toEqual([])
  })
})

describe('anglemort engine : victoire', () => {
  it('areCluesSatisfied : vrai avec la solution, faux sans vigile', () => {
    const level = makeLevel()
    expect(areCluesSatisfied(level, computeVision(level, level.solution))).toBe(true)
    expect(areCluesSatisfied(level, computeVision(level, []))).toBe(false)
  })

  it('gagne avec la solution posée', () => {
    const level = makeLevel()
    expect(isWon(withGuards(level, level.solution))).toBe(true)
  })

  it('gagne en jouant la solution action par action : poser puis pivoter', () => {
    let state = loadLevel(makeLevel())
    state = reducer(state, { type: 'toggle', x: 0, y: 2 })
    state = reducer(state, { type: 'rotate', x: 0, y: 2 })
    state = reducer(state, { type: 'toggle', x: 3, y: 1 })
    // Contre le mur est : N → S → W.
    for (let i = 0; i < 2; i++) state = reducer(state, { type: 'rotate', x: 3, y: 1 })
    expect(isWon(state)).toBe(true)
    expect(state.moves).toBe(2)
  })

  it("ne gagne pas tant que le lot n'est pas entièrement posé", () => {
    const level = makeLevel()
    const state = withGuards(level, level.solution.slice(0, 1))
    expect(isPoolComplete(state)).toBe(false)
    expect(isWon(state)).toBe(false)
  })

  it('gagne même si deux vigiles se voient', () => {
    // 🚪 .  💎
    // →  .  ←
    const level = makeLevel({ width: 3, height: 2, diamond: [2, 0], clues: {} })
    const state = withGuards(level, [
      { pos: [0, 1], type: 'simple', facing: 'E' },
      { pos: [2, 1], type: 'simple', facing: 'W' },
    ])
    expect(isWon(state)).toBe(true)
  })

  it('ne gagne pas si un indice est faux', () => {
    const level = makeLevel({ clues: { '1,1': 2 } })
    expect(isWon(withGuards(level, level.solution))).toBe(false)
  })

  it('ne gagne pas si le couloir ne relie pas la porte au diamant', () => {
    const level = makeLevel({ clues: {} })
    const state = withGuards(level, [
      { pos: [1, 2], type: 'simple', facing: 'N' },
      { pos: [3, 1], type: 'simple', facing: 'W' },
    ])
    expect(isWon(state)).toBe(false)
  })

  it('reset vide la grille et le compteur', () => {
    const state = reducer(placeGuard(loadLevel(makeLevel()), 0, 2), { type: 'reset' })
    expect(state.guards).toEqual([])
    expect(state.moves).toBe(0)
  })
})

describe('anglemort engine : géométrie', () => {
  it('isFloor exclut piliers, miroirs et hors grille', () => {
    const level = makeLevel({ pillars: [[1, 1]], mirrors: [{ pos: [2, 1], kind: '/' }] })
    expect(isFloor(level, 0, 1)).toBe(true)
    expect(isFloor(level, 1, 1)).toBe(false)
    expect(isFloor(level, 2, 1)).toBe(false)
    expect(isFloor(level, 4, 0)).toBe(false)
  })

  it.each([
    [[0, 1], 'W'],
    [[3, 1], 'E'],
    [[1, 0], 'N'],
    [[1, 2], 'S'],
  ] as [Pos, string][])("doorSide : une porte en %j s'ouvre côté %s", (door, side) => {
    expect(doorSide(makeLevel({ door }))).toBe(side)
  })

  it('stepDir donne la direction entre deux cases voisines', () => {
    expect(stepDir([1, 1], [2, 1])).toBe('E')
    expect(stepDir([1, 1], [0, 1])).toBe('W')
    expect(stepDir([1, 1], [1, 0])).toBe('N')
    expect(stepDir([1, 1], [1, 2])).toBe('S')
  })
})

describe('anglemort engine : types de vigiles', () => {
  it("pickableTypes garde les types présents dans le lot, dans l'ordre du sélecteur", () => {
    const state = loadLevel(makeLevel({ pool: { simple: 1, angle: 0, oppose: 2 } }))
    expect(pickableTypes(state)).toEqual(['simple', 'oppose'])
  })

  it("restFacing présente le vigile dos à dos à l'horizontale, les autres vers le haut", () => {
    expect(restFacing('oppose')).toBe('E')
    expect(restFacing('simple')).toBe('N')
    expect(restFacing('angle')).toBe('N')
  })
})
