/**
 * What a menu is and how one is moved through. No DOM.
 *
 * The items, which of them the arrow keys can land on, what a typed letter
 * jumps to, where a menu goes so that it stays on screen, and how a shortcut
 * is written on this platform.
 */

export interface MenuItem {
  /** Names the item in a `select` event. Left out, the item's position is used (`2`, `2.0`). */
  id?: string
  label?: string
  /** `Mod+C`, `Shift+Mod+P`, `Alt+Enter`, `F2`. `Mod` is Command on a Mac and Control elsewhere. Shown, not bound. */
  shortcut?: string
  disabled?: boolean
  /** A dividing line. Everything else on the item is ignored. */
  separator?: boolean
  /** A submenu. */
  children?: MenuItem[]
  /** `true` or `false` makes the item a checkbox; left out it is a plain item. */
  checked?: boolean
  /** Drawn in the danger colour: delete, discard. */
  danger?: boolean
  /** Anything the host wants back in the `select` event. */
  value?: unknown
}

/** An item as the view draws it: with its id settled and its place in the tree. */
export interface ResolvedItem extends MenuItem {
  id: string
  /** Indexes from the top menu down to this item. */
  path: number[]
  children?: ResolvedItem[]
}

export interface MenuPoint { x: number, y: number }
export interface MenuSize { width: number, height: number }
export interface MenuBox { left: number, top: number, right: number, bottom: number }

/**
 * Settle a list of items: every item gets an id, and separators that divide
 * nothing are dropped (one at either end, or two in a row), so a host can
 * build a list out of optional groups without tidying it.
 */
export function resolveItems(items: readonly MenuItem[] | null | undefined, parent: number[] = []): ResolvedItem[] {
  const resolved: ResolvedItem[] = []
  if (!Array.isArray(items))
    return resolved

  for (const item of items) {
    if (!item || typeof item !== 'object')
      continue
    if (item.separator) {
      if (resolved.length > 0 && !resolved[resolved.length - 1].separator)
        resolved.push({ separator: true, id: '', path: [] })
      continue
    }
    resolved.push({ ...item, id: item.id == null ? '' : String(item.id), path: [] } as ResolvedItem)
  }
  while (resolved.length > 0 && resolved[resolved.length - 1].separator)
    resolved.pop()

  resolved.forEach((item, index) => {
    item.path = [...parent, index]
    if (item.separator || item.id === '')
      item.id = item.path.join('.')
    if (!item.separator && Array.isArray(item.children))
      item.children = resolveItems(item.children, item.path)
  })
  return resolved
}

/** Whether the keyboard can land on an item. A disabled item can be read, so it can; a separator cannot. */
export function isFocusable(item: MenuItem | undefined): boolean {
  return Boolean(item) && !item!.separator
}

/** Whether choosing the item does anything. */
export function isActionable(item: MenuItem | undefined): boolean {
  return Boolean(item) && !item!.separator && !item!.disabled
}

export function hasSubmenu(item: MenuItem | undefined): boolean {
  return Boolean(item) && !item!.separator && Array.isArray(item!.children) && item!.children!.length > 0
}

/**
 * The item an arrow key moves to from `from`, wrapping at the ends.
 * `from` of -1 is "nothing yet": down goes to the first item and up to the last.
 */
export function stepIndex(items: readonly MenuItem[], from: number, direction: 1 | -1): number {
  const count = items.length
  if (count === 0)
    return -1

  let index = from
  for (let tries = 0; tries < count; tries++) {
    index = index < 0 ? (direction === 1 ? 0 : count - 1) : (index + direction + count) % count
    if (isFocusable(items[index]))
      return index
  }
  return -1
}

export function firstIndex(items: readonly MenuItem[]): number {
  return stepIndex(items, -1, 1)
}

export function lastIndex(items: readonly MenuItem[]): number {
  return stepIndex(items, -1, -1)
}

/**
 * The item a typed string jumps to. A single repeated letter cycles through
 * the items starting with it; anything longer is a prefix, searched from the
 * current item so typing more keeps the match.
 */
export function typeAheadIndex(items: readonly MenuItem[], from: number, typed: string): number {
  const query = typed.toLowerCase()
  if (query === '' || items.length === 0)
    return -1

  const repeated = query.length > 1 && query.split('').every(letter => letter === query.charAt(0))
  const needle = repeated ? query.charAt(0) : query
  const start = query.length === 1 || repeated ? from + 1 : Math.max(from, 0)

  for (let offset = 0; offset < items.length; offset++) {
    const index = (start + offset + items.length) % items.length
    const item = items[index]
    if (isFocusable(item) && (item.label || '').toLowerCase().startsWith(needle))
      return index
  }
  return -1
}

/** Find an item anywhere in the tree by id. */
export function findItem(items: readonly ResolvedItem[], id: string): ResolvedItem | null {
  for (const item of items) {
    if (item.separator)
      continue
    if (item.id === id)
      return item
    if (item.children) {
      const found = findItem(item.children, id)
      if (found)
        return found
    }
  }
  return null
}

/**
 * Where a menu opened at a point goes.
 *
 * Down and to the right of the point, as a pointer expects. A menu that would
 * leave the viewport on a side opens the other way from the point instead; one
 * that fits neither way is pushed back inside, so its first items stay
 * reachable.
 */
export function placeAtPoint(point: MenuPoint, menu: MenuSize, viewport: MenuSize, margin = 8): MenuPoint {
  const fit = (at: number, size: number, limit: number): number => {
    if (at + size <= limit - margin)
      return at
    if (at - size >= margin)
      return at - size
    return Math.max(margin, limit - margin - size)
  }

  return { x: fit(point.x, menu.width, viewport.width), y: fit(point.y, menu.height, viewport.height) }
}

/** Where a menu anchored to an element goes: under it, aligned to its left edge, or above when there is no room. */
export function placeAtBox(anchor: MenuBox, menu: MenuSize, viewport: MenuSize, margin = 8, gap = 4): MenuPoint {
  let x = anchor.left
  if (x + menu.width > viewport.width - margin)
    x = Math.max(margin, Math.min(anchor.right - menu.width, viewport.width - margin - menu.width))

  let y = anchor.bottom + gap
  if (y + menu.height > viewport.height - margin) {
    const above = anchor.top - gap - menu.height
    y = above >= margin ? above : Math.max(margin, viewport.height - margin - menu.height)
  }
  return { x: Math.max(margin, x), y }
}

/**
 * Where a submenu goes: beside the item that opens it, level with it. To the
 * right when it fits, otherwise to the left, and pushed up when it would run
 * off the bottom. `overlap` tucks it slightly under its parent's edge.
 */
export function placeSubmenu(item: MenuBox, menu: MenuSize, viewport: MenuSize, margin = 8, overlap = 4): MenuPoint & { side: 'right' | 'left' } {
  let side: 'right' | 'left' = 'right'
  let x = item.right - overlap
  if (x + menu.width > viewport.width - margin) {
    const left = item.left + overlap - menu.width
    if (left >= margin) {
      x = left
      side = 'left'
    }
    else {
      x = Math.max(margin, viewport.width - margin - menu.width)
    }
  }

  const y = Math.max(margin, Math.min(item.top - overlap, viewport.height - margin - menu.height))
  return { x, y, side }
}

const APPLE_SYMBOLS: Record<string, string> = { mod: '⌘', meta: '⌘', cmd: '⌘', command: '⌘', ctrl: '⌃', control: '⌃', alt: '⌥', option: '⌥', shift: '⇧' }
const OTHER_NAMES: Record<string, string> = { mod: 'Ctrl', meta: 'Win', cmd: 'Ctrl', command: 'Ctrl', ctrl: 'Ctrl', control: 'Ctrl', alt: 'Alt', option: 'Alt', shift: 'Shift' }
const APPLE_KEYS: Record<string, string> = { enter: '↩', backspace: '⌫', delete: '⌦', escape: '⎋', esc: '⎋', tab: '⇥', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→', space: 'Space' }
const OTHER_KEYS: Record<string, string> = { escape: 'Esc', esc: 'Esc', delete: 'Del', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→', space: 'Space' }
// The order a platform writes its modifiers in, whatever order the host gave.
const APPLE_ORDER = ['ctrl', 'control', 'alt', 'option', 'shift', 'mod', 'meta', 'cmd', 'command']
const OTHER_ORDER = ['mod', 'ctrl', 'control', 'cmd', 'command', 'meta', 'alt', 'option', 'shift']

function splitShortcut(shortcut: string): { modifiers: string[], key: string } {
  // A trailing `+` is the plus key itself: `Mod++`.
  const parts = shortcut.endsWith('++') ? [...shortcut.slice(0, -2).split('+'), '+'] : shortcut.split('+')
  const cleaned = parts.map(part => part.trim()).filter(part => part !== '')
  const key = cleaned.pop() || ''
  return { modifiers: cleaned.map(part => part.toLowerCase()), key }
}

function capitalize(key: string): string {
  return key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1)
}

/** A shortcut as this platform writes it: `⇧⌘P` on a Mac, `Ctrl+Shift+P` elsewhere. */
export function formatShortcut(shortcut: string | undefined, apple: boolean): string {
  if (!shortcut)
    return ''
  const { modifiers, key } = splitShortcut(shortcut)
  const order = apple ? APPLE_ORDER : OTHER_ORDER
  const sorted = [...modifiers].sort((a, b) => order.indexOf(a) - order.indexOf(b))
  const names = sorted.map(modifier => (apple ? APPLE_SYMBOLS : OTHER_NAMES)[modifier] ?? capitalize(modifier))
  const keyName = (apple ? APPLE_KEYS : OTHER_KEYS)[key.toLowerCase()] ?? capitalize(key)

  return apple ? names.join('') + keyName : [...new Set(names), keyName].join('+')
}

/** The same shortcut for `aria-keyshortcuts`, which has its own spelling. */
export function ariaShortcut(shortcut: string | undefined, apple: boolean): string {
  if (!shortcut)
    return ''
  const { modifiers, key } = splitShortcut(shortcut)
  const names: Record<string, string> = { mod: apple ? 'Meta' : 'Control', meta: 'Meta', cmd: 'Meta', command: 'Meta', ctrl: 'Control', control: 'Control', alt: 'Alt', option: 'Alt', shift: 'Shift' }

  return [...new Set(modifiers.map(modifier => names[modifier] ?? capitalize(modifier))), capitalize(key)].join('+')
}
