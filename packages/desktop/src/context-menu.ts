/**
 * Native context menu (right-click / long-press).
 *
 * `menu.ts` builds the menubar and the dock menu, both of which live in fixed
 * places. This is the other kind: a menu that opens at the pointer, over
 * whatever the user right-clicked.
 *
 * It is a real `NSMenu`, not a styled `<div>` — it inherits the system accent
 * and vibrancy, tracks the pointer the way the OS expects, dismisses on the
 * same gestures as every other menu on the machine, and cannot be clipped by
 * the page. A web imitation gets the appearance close and the behaviour wrong,
 * which is exactly the sort of near-miss that makes an app feel unfinished.
 *
 * Outside a Craft window there is no native menu to open. `show()` reports
 * whether it opened one, so a caller can render its own fallback rather than
 * silently doing nothing:
 *
 * ```ts
 * const opened = await contextMenu.show({
 *   x: event.clientX,
 *   y: event.clientY,
 *   items: [
 *     { id: 'reveal', title: 'Reveal in Finder', icon: 'folder' },
 *     { separator: true },
 *     { id: 'trash', title: 'Move to Trash', icon: 'trash', shortcut: 'cmd+delete' },
 *   ],
 * })
 * if (!opened) showMyOwnMenu()
 * ```
 *
 * Picks arrive on `craft:menu:action`, the same channel the menubar uses, so
 * ids must be unique across whatever else is registered.
 */
import { hasBridge, onCraftEvent } from './_bridge'

export interface ContextMenuItem {
  /** Stable identifier, reported back when the item is picked. */
  id?: string
  /** Visible label. */
  title?: string
  /** True for a divider. Every other field is ignored. */
  separator?: boolean
  /** SF Symbol name, e.g. `'folder'`, `'trash'`, `'doc.on.doc'`. */
  icon?: string
  /** Keyboard accelerator shown right-aligned, e.g. `'cmd+delete'`. */
  shortcut?: string
  /** Renders greyed and unpickable. */
  disabled?: boolean
  /** Nested menu under this item. */
  submenu?: ContextMenuItem[]
}

export interface ContextMenuOptions {
  /** Items, top to bottom. At least one is required. */
  items: ContextMenuItem[]
  /** Window coordinates, normally `event.clientX` / `event.clientY`. */
  x: number
  y: number
  /**
   * What was right-clicked. Reported alongside the pick so one handler can
   * serve a list — pass the row id rather than wiring a listener per row.
   */
  targetId?: string
}

export interface ContextMenuActionEvent {
  id: string
}

export interface ContextMenuAPI {
  /**
   * Open a native menu at a point.
   *
   * Resolves `true` when a native menu was opened, `false` when there is no
   * bridge to open one with — the caller decides what to do about that.
   */
  show: (options: ContextMenuOptions) => Promise<boolean>
  /** Whether this window can open native context menus at all. */
  available: () => boolean
  /** Subscribe to picks. Shares a channel with the menubar, so ids must be unique. */
  onAction: (cb: (event: ContextMenuActionEvent) => void) => () => void
}

/** The bridge takes `{type: 'separator'}`; the public shape uses a boolean. */
function toBridgeItem(item: ContextMenuItem): Record<string, unknown> {
  if (item.separator)
    return { id: item.id || '', title: '', type: 'separator' }

  return {
    id: item.id || '',
    title: item.title || '',
    icon: item.icon,
    shortcut: item.shortcut,
    enabled: item.disabled ? false : undefined,
    submenu: item.submenu?.map(toBridgeItem),
  }
}

export const contextMenu: ContextMenuAPI = {
  available() {
    return hasBridge('nativeUI')
  },

  async show(options) {
    if (!options.items || options.items.length === 0)
      throw new Error('contextMenu.show requires at least one item')

    if (!hasBridge('nativeUI'))
      return false

    await window.craft!.nativeUI.showContextMenu({
      targetId: options.targetId || '',
      targetType: 'general',
      // Rounded because AppKit places menus on whole points; a fractional
      // coordinate from a scaled pointer event lands the menu a hair off.
      x: Math.round(options.x),
      y: Math.round(options.y),
      items: options.items.map(toBridgeItem),
    })

    return true
  },

  onAction(cb) {
    return onCraftEvent<ContextMenuActionEvent>('craft:menu:action', cb)
  },
}
