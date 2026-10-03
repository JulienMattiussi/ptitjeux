import { describe, expect, it } from 'vitest'
import { undoable, withUndo } from '~/lib/undoable'

type State = { value: number; label: string }
type Action =
  { type: 'add' } | { type: 'label'; text: string } | { type: 'noop' } | { type: 'reset' }

function counter(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { ...state, value: state.value + 1 }
    case 'label':
      return { ...state, label: action.text }
    case 'noop':
      return state
    case 'reset':
      return { value: 0, label: '' }
  }
}

const reducer = withUndo(counter, (a) => a.type === 'add')
const start = undoable<State>({ value: 0, label: '' })

describe('lib/undoable', () => {
  it('annule la dernière action suivie', () => {
    const u = reducer(reducer(start, { type: 'add' }), { type: 'add' })
    expect(reducer(u, { type: 'undo' }).present.value).toBe(1)
  })

  it('ignore l annulation quand l historique est vide', () => {
    expect(reducer(start, { type: 'undo' })).toBe(start)
  })

  it('n empile pas les actions non suivies', () => {
    const u = reducer(start, { type: 'label', text: 'abc' })
    expect(u.present.label).toBe('abc')
    expect(u.past).toEqual([])
  })

  it('n empile pas une action sans effet', () => {
    expect(reducer(start, { type: 'noop' })).toBe(start)
  })

  it('reset vide l historique', () => {
    const u = reducer(reducer(start, { type: 'add' }), { type: 'reset' })
    expect(u).toEqual({ present: { value: 0, label: '' }, past: [] })
  })
})
