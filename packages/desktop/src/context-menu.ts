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
 * `pick()` opens the menu and resolves with the chosen item's id once it
 * closes, or null when it was dismissed - which reads like any other async
 * choice:
 *
 * ```ts
 * const choice = await contextMenu.pick({
 *   x: event.clientX,
 *   y: event.clientY,
 *   items: [
 *     { id: 'reveal', title: 'Reveal in Finder', icon: 'folder' },
 *     { separator: true },
 *     { id: 'trash', title: 'Move to Trash', icon: 'trash', shortcut: 'cmd+delete' },
 *   ],
 * })
 * if (choice === 'trash') moveToTrash()
 * ```
 *
 * Outside a Craft window there is no native menu to open. `show()` reports
 * whether it opened one, so a caller can render its own fallback rather than
 * silently doing nothing; `pick()` resolves null there.
 *
 * Picks also arrive on `onAction`, for code that wants every menu's outcome.
 * They used to be expected on `craft:menu:action`, the menubar's channel,
 * where Craft never sent them: a context menu could be shown but its choice
 * never reached the page. Craft 0.0.109 answers the call itself and
 * dispatches `craft:contextmenu:action`.
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
  /** The `targetId` the menu was opened with. */
  targetId: string
}

/** What Craft answers when a context menu closes; `id` is null if dismissed. */
interface ContextMenuResult {
  id: string | null
  targetId?: string
}

export interface ContextMenuAPI {
  /**
   * Open a native menu at a point.
   *
   * Resolves `true` when a native menu was opened, `false` when there is no
   * bridge to open one with — the caller decides what to do about that.
   */
  show: (options: ContextMenuOptions) => Promise<boolean>
  /**
   * Open a native menu at a point and resolve with the chosen item's id when
   * it closes, or null when it was dismissed or no native menu could open.
   */
  pick: (options: ContextMenuOptions) => Promise<string | null>
  /** Whether this window can open native context menus at all. */
  available: () => boolean
  /** Subscribe to every context menu's pick. Dismissals are not reported. */
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
    // Craft builds a nested menu only for an item typed as one.
    type: item.submenu ? 'submenu' : undefined,
    submenu: item.submenu?.map(toBridgeItem),
  }
}

/**
 * Open the menu and wait for it to close. Null without a bridge. A runtime
 * older than Craft 0.0.109 resolves nothing, which reads as a dismissal.
 */
async function open(options: ContextMenuOptions): Promise<ContextMenuResult | null> {
  if (!options.items || options.items.length === 0)
    throw new Error('contextMenu.show requires at least one item')

  if (!hasBridge('nativeUI'))
    return null

  const result = await window.craft!.nativeUI.showContextMenu({
    targetId: options.targetId || '',
    targetType: 'general',
    // Rounded because AppKit places menus on whole points; a fractional
    // coordinate from a scaled pointer event lands the menu a hair off.
    x: Math.round(options.x),
    y: Math.round(options.y),
    items: options.items.map(toBridgeItem),
  }) as ContextMenuResult | undefined

  return { id: typeof result?.id === 'string' ? result.id : null, targetId: result?.targetId }
}

export const contextMenu: ContextMenuAPI = {
  available() {
    return hasBridge('nativeUI')
  },

  async show(options) {
    return (await open(options)) !== null
  },

  async pick(options) {
    return (await open(options))?.id ?? null
  },

  onAction(cb) {
    return onCraftEvent<ContextMenuResult>('craft:contextmenu:action', (detail) => {
      if (typeof detail.id === 'string')
        cb({ id: detail.id, targetId: detail.targetId ?? '' })
    })
  },
}
