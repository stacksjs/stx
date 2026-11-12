import { describe, expect, it } from 'bun:test'
import { ariaShortcut, findItem, firstIndex, formatShortcut, hasSubmenu, isActionable, isFocusable, lastIndex, placeAtBox, placeAtPoint, placeSubmenu, resolveItems, stepIndex, typeAheadIndex } from '../../src/ui/context-menu/core'

const sep = { separator: true }
const viewport = { width: 1000, height: 800 }

describe('settling a list of items', () => {
  it('gives every item an id from its position, keeping one the host chose', () => {
    const items = resolveItems([{ label: 'Copy', id: 'copy' }, { label: 'Open in', children: [{ label: 'Table' }, { label: 'Graph', id: 'graph' }] }])

    expect(items.map(item => item.id)).toEqual(['copy', '1'])
    expect(items[1].children!.map(item => item.id)).toEqual(['1.0', 'graph'])
    expect(items[1].children![1].path).toEqual([1, 1])
  })

  it('drops separators that divide nothing', () => {
    const items = resolveItems([sep, { label: 'A' }, sep, sep, { label: 'B' }, sep])

    expect(items.map(item => (item.separator ? '-' : item.label))).toEqual(['A', '-', 'B'])
  })

  it('tidies a submenu the same way', () => {
    const items = resolveItems([{ label: 'More', children: [sep, { label: 'A' }, sep] }])

    expect(items[0].children!.map(item => item.label)).toEqual(['A'])
  })

  it('survives what is not a list of items', () => {
    expect(resolveItems(null)).toEqual([])
    expect(resolveItems(undefined)).toEqual([])
    expect(resolveItems('nope' as any)).toEqual([])
    expect(resolveItems([null, 3, { label: 'A' }] as any).map(item => item.label)).toEqual(['A'])
    expect(resolveItems([sep, sep])).toEqual([])
  })

  it('finds an item anywhere in the tree', () => {
    const items = resolveItems([{ label: 'A' }, sep, { label: 'More', children: [{ label: 'Deep', id: 'deep' }] }])

    expect(findItem(items, 'deep')!.label).toBe('Deep')
    expect(findItem(items, '0')!.label).toBe('A')
    expect(findItem(items, 'missing')).toBeNull()
  })

  it('tells what can be focused, chosen and opened', () => {
    expect(isFocusable({ label: 'A' })).toBe(true)
    expect(isFocusable({ label: 'A', disabled: true })).toBe(true)
    expect(isFocusable(sep)).toBe(false)
    expect(isFocusable(undefined)).toBe(false)
    expect(isActionable({ label: 'A', disabled: true })).toBe(false)
    expect(isActionable({ label: 'A' })).toBe(true)
    expect(hasSubmenu({ label: 'A', children: [] })).toBe(false)
    expect(hasSubmenu({ label: 'A', children: [{ label: 'B' }] })).toBe(true)
  })
})

describe('moving through a menu', () => {
  const items = [{ label: 'Apple' }, sep, { label: 'Banana', disabled: true }, { label: 'Blueberry' }, sep, { label: 'Cherry' }]

  it('steps over separators and wraps at the ends', () => {
    expect(stepIndex(items, 0, 1)).toBe(2)
    expect(stepIndex(items, 3, 1)).toBe(5)
    expect(stepIndex(items, 5, 1)).toBe(0)
    expect(stepIndex(items, 0, -1)).toBe(5)
    expect(stepIndex(items, 5, -1)).toBe(3)
  })

  it('starts from the right end when nothing is active', () => {
    expect(stepIndex(items, -1, 1)).toBe(0)
    expect(stepIndex(items, -1, -1)).toBe(5)
    expect(firstIndex(items)).toBe(0)
    expect(lastIndex(items)).toBe(5)
    expect(firstIndex([sep, { label: 'A' }])).toBe(1)
  })

  it('has nowhere to go in a menu with nothing to land on', () => {
    expect(stepIndex([], 0, 1)).toBe(-1)
    expect(stepIndex([sep], -1, 1)).toBe(-1)
  })

  it('jumps to the next item starting with a typed letter, cycling', () => {
    expect(typeAheadIndex(items, -1, 'b')).toBe(2)
    expect(typeAheadIndex(items, 2, 'b')).toBe(3)
    expect(typeAheadIndex(items, 3, 'b')).toBe(2)
    expect(typeAheadIndex(items, 2, 'bb')).toBe(3)
  })

  it('narrows as more is typed, staying on an item that still matches', () => {
    expect(typeAheadIndex(items, 2, 'bl')).toBe(3)
    expect(typeAheadIndex(items, 3, 'blu')).toBe(3)
    expect(typeAheadIndex(items, 0, 'CH')).toBe(5)
  })

  it('finds nothing for a letter no item starts with', () => {
    expect(typeAheadIndex(items, 0, 'z')).toBe(-1)
    expect(typeAheadIndex(items, 0, '')).toBe(-1)
    expect(typeAheadIndex([], 0, 'a')).toBe(-1)
  })
})

describe('placing a menu', () => {
  const menu = { width: 200, height: 300 }

  it('opens down and to the right of the pointer', () => {
    expect(placeAtPoint({ x: 100, y: 100 }, menu, viewport)).toEqual({ x: 100, y: 100 })
  })

  it('opens the other way where it would leave the viewport', () => {
    expect(placeAtPoint({ x: 950, y: 100 }, menu, viewport)).toEqual({ x: 750, y: 100 })
    expect(placeAtPoint({ x: 100, y: 700 }, menu, viewport)).toEqual({ x: 100, y: 400 })
    expect(placeAtPoint({ x: 950, y: 700 }, menu, viewport)).toEqual({ x: 750, y: 400 })
  })

  it('is pushed back inside when it fits neither way', () => {
    expect(placeAtPoint({ x: 150, y: 250 }, { width: 900, height: 700 }, viewport)).toEqual({ x: 92, y: 92 })
    expect(placeAtPoint({ x: 150, y: 250 }, { width: 2000, height: 2000 }, viewport)).toEqual({ x: 8, y: 8 })
  })

  it('goes under an element, or above it when there is no room', () => {
    expect(placeAtBox({ left: 100, top: 100, right: 180, bottom: 130 }, menu, viewport)).toEqual({ x: 100, y: 134 })
    expect(placeAtBox({ left: 100, top: 700, right: 180, bottom: 730 }, menu, viewport)).toEqual({ x: 100, y: 396 })
    expect(placeAtBox({ left: 900, top: 100, right: 980, bottom: 130 }, menu, viewport)).toEqual({ x: 780, y: 134 })
  })

  it('puts a submenu beside its item, on whichever side has room', () => {
    expect(placeSubmenu({ left: 100, top: 200, right: 300, bottom: 224 }, menu, viewport)).toEqual({ x: 296, y: 196, side: 'right' })
    expect(placeSubmenu({ left: 700, top: 200, right: 900, bottom: 224 }, menu, viewport)).toEqual({ x: 504, y: 196, side: 'left' })
    expect(placeSubmenu({ left: 100, top: 700, right: 300, bottom: 724 }, menu, viewport).y).toBe(492)
  })

  it('keeps a submenu on screen when neither side has room', () => {
    const place = placeSubmenu({ left: 100, top: 10, right: 900, bottom: 34 }, menu, viewport)

    expect(place.x).toBe(792)
    expect(place.y).toBe(8)
  })
})

describe('writing a shortcut', () => {
  it('uses symbols in the platform order on a Mac', () => {
    expect(formatShortcut('Mod+C', true)).toBe('⌘C')
    expect(formatShortcut('Mod+Shift+P', true)).toBe('⇧⌘P')
    expect(formatShortcut('Shift+Alt+Ctrl+Mod+k', true)).toBe('⌃⌥⇧⌘K')
    expect(formatShortcut('Mod+Enter', true)).toBe('⌘↩')
    expect(formatShortcut('Backspace', true)).toBe('⌫')
  })

  it('uses names joined by plus elsewhere', () => {
    expect(formatShortcut('Mod+C', false)).toBe('Ctrl+C')
    expect(formatShortcut('Shift+Mod+P', false)).toBe('Ctrl+Shift+P')
    expect(formatShortcut('Alt+Enter', false)).toBe('Alt+Enter')
    expect(formatShortcut('F2', false)).toBe('F2')
    expect(formatShortcut('Escape', false)).toBe('Esc')
  })

  it('reads a plus key and an empty shortcut', () => {
    expect(formatShortcut('Mod++', true)).toBe('⌘+')
    expect(formatShortcut('Mod++', false)).toBe('Ctrl++')
    expect(formatShortcut('', true)).toBe('')
    expect(formatShortcut(undefined, false)).toBe('')
  })

  it('spells it the way aria-keyshortcuts wants', () => {
    expect(ariaShortcut('Mod+C', true)).toBe('Meta+C')
    expect(ariaShortcut('Mod+C', false)).toBe('Control+C')
    expect(ariaShortcut('Shift+Mod+p', false)).toBe('Shift+Control+P')
    expect(ariaShortcut(undefined, true)).toBe('')
  })
})
