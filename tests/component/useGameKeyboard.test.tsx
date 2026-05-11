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

  it('WASD (QWERTY) aliasés sur les flèches', () => {
    const onDirection = vi.fn()
    renderHook(() => useGameKeyboard({ enabled: true, onDirection }))
    press('w')
    press('s')
    press('a')
    press('d')
    expect(onDirection.mock.calls.map((c) => c[0])).toEqual(['up', 'down', 'left', 'right'])
  })

  it('ZQSD (AZERTY) aliasés sur les flèches via event.key', () => {
    // Sur un clavier AZERTY, les touches physiques WASD émettent les
    // caractères Z, Q, S, D — on les couvre par leur valeur `key`.
    const onDirection = vi.fn()
    renderHook(() => useGameKeyboard({ enabled: true, onDirection }))
    press('z')
    press('s')
    press('q')
    press('d')
    expect(onDirection.mock.calls.map((c) => c[0])).toEqual(['up', 'down', 'left', 'right'])
  })

  it('event.code KeyW/KeyA/KeyS/KeyD couvre toute disposition physique', () => {
    // Sur les dispositions exotiques (QWERTZ, Dvorak…) ou si le user a
    // remappé sa touche, `event.code` reste la position physique. Couvert
    // par l'event simulé avec un `code` explicite et un `key` non géré.
    const onDirection = vi.fn()
    renderHook(() => useGameKeyboard({ enabled: true, onDirection }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Unidentified', code: 'KeyW' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Unidentified', code: 'KeyA' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Unidentified', code: 'KeyS' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Unidentified', code: 'KeyD' }))
    expect(onDirection.mock.calls.map((c) => c[0])).toEqual(['up', 'left', 'down', 'right'])
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

  it('Ctrl+Z prend la main sur le mapping AZERTY z=up', () => {
    // Avec onDirection ET onUndo, Ctrl+Z doit déclencher undo, pas
    // un déplacement vers le haut (sinon AZERTY casse l'undo).
    const onDirection = vi.fn()
    const onUndo = vi.fn()
    renderHook(() => useGameKeyboard({ enabled: true, onDirection, onUndo }))
    press('z', { ctrlKey: true })
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onDirection).not.toHaveBeenCalled()
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
