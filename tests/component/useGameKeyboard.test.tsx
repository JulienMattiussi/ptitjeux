import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useGameKeyboard } from '~/lib/useGameKeyboard'

function press(key: string, init: KeyboardEventInit = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, ...init, bubbles: true }))
}

describe('useGameKeyboard', () => {
  it('flèches → onDirection avec la bonne direction', () => {
    const onDirection = vi.fn()
    renderHook(() => useGameKeyboard({ enabled: true, onDirection }))
    press('ArrowUp')
    press('ArrowDown')
    press('ArrowLeft')
    press('ArrowRight')
    expect(onDirection.mock.calls.map((c) => c[0])).toEqual(['up', 'down', 'left', 'right'])
  })

  it('ZQSD aliasés sur les flèches', () => {
    const onDirection = vi.fn()
    renderHook(() => useGameKeyboard({ enabled: true, onDirection }))
    press('w')
    press('s')
    press('a')
    press('d')
    expect(onDirection.mock.calls.map((c) => c[0])).toEqual(['up', 'down', 'left', 'right'])
  })

  it('Espace et Entrée → onAction', () => {
    const onAction = vi.fn()
    renderHook(() => useGameKeyboard({ enabled: true, onAction }))
    press(' ')
    press('Enter')
    expect(onAction).toHaveBeenCalledTimes(2)
  })

  it('Ctrl+Z → onUndo, Cmd+Z aussi', () => {
    const onUndo = vi.fn()
    renderHook(() => useGameKeyboard({ enabled: true, onUndo }))
    press('z', { ctrlKey: true })
    press('z', { metaKey: true })
    press('z') // sans modificateur : ignoré
    expect(onUndo).toHaveBeenCalledTimes(2)
  })

  it("touche 'r' → onReset", () => {
    const onReset = vi.fn()
    renderHook(() => useGameKeyboard({ enabled: true, onReset }))
    press('r')
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('enabled=false : aucun callback', () => {
    const onDirection = vi.fn()
    const onAction = vi.fn()
    renderHook(() =>
      useGameKeyboard({ enabled: false, onDirection, onAction }),
    )
    press('ArrowUp')
    press('Enter')
    expect(onDirection).not.toHaveBeenCalled()
    expect(onAction).not.toHaveBeenCalled()
  })

  it('ignoreInputs : ignore quand le focus est sur un input', () => {
    const onDirection = vi.fn()
    renderHook(() =>
      useGameKeyboard({ enabled: true, onDirection, ignoreInputs: true }),
    )
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(onDirection).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('cleanup : retire le listener au démontage', () => {
    const onDirection = vi.fn()
    const { unmount } = renderHook(() =>
      useGameKeyboard({ enabled: true, onDirection }),
    )
    unmount()
    press('ArrowUp')
    expect(onDirection).not.toHaveBeenCalled()
  })

  it('ne déclenche aucun callback non fourni', () => {
    // Si seul onDirection est passé, Espace/Entrée/Ctrl+Z/r ne plantent pas.
    const onDirection = vi.fn()
    renderHook(() => useGameKeyboard({ enabled: true, onDirection }))
    expect(() => {
      press(' ')
      press('Enter')
      press('z', { ctrlKey: true })
      press('r')
    }).not.toThrow()
  })
})
