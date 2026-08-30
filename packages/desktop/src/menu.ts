/**
 * Application Menu (macOS top-of-screen menubar) + Dock Menu
 *
 * Outside a Craft window every call here is a no-op: there is no portable web
 * equivalent to the macOS menubar.
 *
 * ## Two rules that are not guessable
 *
 * **`set` replaces the bar.** It builds a fresh NSMenu from what you pass and
 * calls `setMainMenu:`. There is no merging: anything you leave out is gone,
 * including Edit. An app that supplies only its own View menu ends up with no
 * Copy anywhere.
 *
 * **The first menu becomes the application menu.** AppKit takes menu zero as
 * the app menu and titles it with the app name, whatever you called it. Supply
 * `[Edit, View, Window]` and the bar reads `AppName, View, Window` — Edit did
 * not fail, it was consumed. Supply one menu and the bar is only the app menu.
 *
 * Together these are why {@link standardMenus} exists: hand-writing the app,
 * Edit and Window menus for every app is boilerplate, and forgetting any of
 * them silently removes system behaviour the user expects.
 *
 * ```ts
 * await menu.set({
 *   menus: [
 *     ...standardMenus.leading('MyApp'),
 *     { label: 'View', items: [
 *       { label: 'Reload', shortcut: 'cmd+r', onClick: () => reload() },
 *     ] },
 *     standardMenus.window(),
 *   ],
 * })
 * ```
 *
 * ## Roles, not ids, wherever AppKit has one
 *
 * A role wires the item to an AppKit selector with a nil target, so the
 * responder chain performs it. Cut, copy and paste *must* use roles: an id
 * round-tripping through JS cannot reach the field editor, so Copy would do
 * nothing inside a text input. {@link standardMenus} already does this.
 *
 * ## Handling picks
 *
 * Give an item an `onClick` and `set` wires it for you. Ids are generated for
 * items that need one and omitted from what you have to think about. If you
 * would rather dispatch centrally, set your own `id` and use
 * {@link MenuAPI.onAction}; both work, and they compose.
 */
import { hasBridge, onCraftEvent } from './_bridge'

/**
 * The stock behaviours macOS already knows how to perform.
 *
 * Spelled out as a union rather than typed `string` because an unrecognised
 * role does not fail: the native side falls back to forwarding the item as an
 * event, so `'togglefullscreen'` — Electron's name for what is `'fullscreen'`
 * here — builds a menu item that looks right, is enabled, and does nothing.
 * That mistake is one letter deep and invisible until someone clicks it.
 *
 * Mirrors the table in Craft's `menu_roles.zig`. Craft matches case
 * insensitively; this list is the canonical casing.
 */
export type MenuRole =
  | 'about'
  | 'hide'
  | 'hideOthers'
  | 'showAll'
  | 'quit'
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'delete'
  | 'selectAll'
  | 'close'
  | 'minimize'
  | 'zoom'
  | 'front'
  | 'fullscreen'
  | 'reload'
  | 'forceReload'

export interface MenuItem {
  /** Stable identifier. The same id is reported by `onAction`. */
  id?: string
  /** Visible label. */
  label?: string
  /**
   * One of the stock behaviours in {@link MenuRole}.
   *
   * Cut, copy and paste *must* take this path. A role wires the item to the
   * AppKit selector with a nil target, so the responder chain performs it; an
   * id round-tripping through JS cannot reach the field editor or the
   * WKWebView's own clipboard actions, and Copy silently does nothing inside a
   * text field.
   *
   * macOS also augments menus built from roles — Writing Tools and Emoji &
   * Symbols appear under an Edit menu it recognises, Quit gains Keep Windows —
   * which it will not do for an item you wire by hand.
   */
  role?: MenuRole
  /**
   * Keyboard shortcut, lowercase and `+`-joined: `'cmd+s'`, `'cmd+shift+z'`.
   *
   * Named `shortcut` because that is the key the native side reads. It was
   * declared here as `accelerator` — Electron's name — which parsed into
   * nothing and produced menu items with no shortcut and no error.
   */
  shortcut?: string
  /** True for a separator line. Other fields ignored. */
  separator?: boolean
  /** SF Symbol or asset name (macOS only). */
  icon?: string
  /**
   * Run this when the item is picked.
   *
   * `set` gives the item an id if it has none and wires the listener, so a
   * menu can be written as a list of things and what they do, with no id
   * bookkeeping. Items with a `role` do not need one — AppKit performs those.
   */
  onClick?: () => void
}

/**
 * One top-level menu in the bar.
 *
 * The menubar is two levels — a list of menus, each a list of items — not a
 * tree. `MenuItem` has no `submenu`, because the native side does not read one.
 */
export interface Menu {
  /** The menu's title in the bar: `'File'`, `'View'`. */
  label: string
  items: MenuItem[]
}

/**
 * What `menu.set` sends.
 *
 * The native side parses `{menus: [...]}`, not a bare array. Passing an array
 * — which this package's own type used to ask for — deserialises into an empty
 * menu set and changes nothing, with no error anywhere.
 *
 * Menus are *merged into* the bar the runtime already provides rather than
 * replacing it, so a menu the runtime does not already carry (`File`, for
 * instance) is dropped. Put app commands under a menu that exists.
 */
export interface ApplicationMenu {
  menus: Menu[]
}

export interface MenuActionEvent {
  id: string
}

export interface MenuAPI {
  /**
   * Replace the menubar.
   *
   * Resolves `true` when a native bar was set, `false` when there is no bridge
   * — so a caller can tell "applied" from "silently did nothing", which is the
   * difference between a working menu and a mystery.
   *
   * Any `onClick` on an item is wired here; a second `set` replaces the
   * previous wiring rather than stacking on it.
   */
  set: (menu: ApplicationMenu) => Promise<boolean>
  /** Set the dock-icon contextual menu. */
  setDock: (items: MenuItem[]) => Promise<void>
  /** Append an item under the parent id (or top-level if parent is "" or "menubar"). */
  addItem: (parent: string, item: MenuItem) => Promise<void>
  removeItem: (id: string) => Promise<void>
  enableItem: (id: string) => Promise<void>
  disableItem: (id: string) => Promise<void>
  checkItem: (id: string) => Promise<void>
  uncheckItem: (id: string) => Promise<void>
  setItemLabel: (id: string, label: string) => Promise<void>
  /** Clear the dock-icon contextual menu. */
  clearDock: () => Promise<void>
  /** Subscribe to "user picked a menu item" events. */
  onAction: (cb: (event: MenuActionEvent) => void) => () => void
}

/**
 * The menus every Mac app is expected to have, built correctly.
 *
 * Hand-writing these is boilerplate with a penalty: omit Edit and the app has
 * no Copy; omit the app menu and the first menu you *did* write gets eaten in
 * its place. Every item here uses a role, so AppKit performs it through the
 * responder chain and macOS augments the menus with its own additions —
 * Writing Tools and Emoji & Symbols in Edit, Quit and Keep Windows in the app
 * menu — which it only does for menus it recognises.
 */
export const standardMenus = {
  /** The application menu. Must be first in the bar; AppKit titles it for you. */
  app(appName: string): Menu {
    return {
      label: appName,
      items: [
        { label: `About ${appName}`, role: 'about' },
        { separator: true },
        { label: `Hide ${appName}`, role: 'hide', shortcut: 'cmd+h' },
        { label: 'Hide Others', role: 'hideOthers', shortcut: 'cmd+alt+h' },
        { label: 'Show All', role: 'showAll' },
        { separator: true },
        { label: `Quit ${appName}`, role: 'quit', shortcut: 'cmd+q' },
      ],
    }
  },

  /** Undo/redo and the clipboard. Roles throughout, which is the only way these work. */
  edit(): Menu {
    return {
      label: 'Edit',
      items: [
        { label: 'Undo', role: 'undo', shortcut: 'cmd+z' },
        { label: 'Redo', role: 'redo', shortcut: 'cmd+shift+z' },
        { separator: true },
        { label: 'Cut', role: 'cut', shortcut: 'cmd+x' },
        { label: 'Copy', role: 'copy', shortcut: 'cmd+c' },
        { label: 'Paste', role: 'paste', shortcut: 'cmd+v' },
        { label: 'Select All', role: 'selectAll', shortcut: 'cmd+a' },
      ],
    }
  },

  /** Minimise, zoom and close. */
  window(): Menu {
    return {
      label: 'Window',
      items: [
        { label: 'Minimize', role: 'minimize', shortcut: 'cmd+m' },
        { label: 'Zoom', role: 'zoom' },
        { separator: true },
        { label: 'Close Window', role: 'close', shortcut: 'cmd+w' },
      ],
    }
  },

  /**
   * The app menu and Edit, in the order the bar needs them.
   *
   * Spread this first and add your own menus after: the app menu has to be
   * index zero, and Edit is the one people notice missing.
   */
  leading(appName: string): Menu[] {
    return [this.app(appName), this.edit()]
  },
}

/** Auto-generated ids for items that carry an `onClick` but no id of their own. */
let generatedId = 0

/**
 * Strip `onClick` from the payload and return the handlers by id.
 *
 * The native side is given plain data; the closures stay on this side, keyed by
 * the id it will report back.
 */
function extractHandlers(appMenu: ApplicationMenu): {
  payload: ApplicationMenu
  handlers: Map<string, () => void>
} {
  const handlers = new Map<string, () => void>()

  const payload: ApplicationMenu = {
    menus: appMenu.menus.map(m => ({
      label: m.label,
      items: m.items.map((item) => {
        const { onClick, ...rest } = item
        if (!onClick) return rest

        const id = rest.id ?? `stx.menu.${generatedId++}`
        handlers.set(id, onClick)
        return { ...rest, id }
      }),
    })),
  }

  return { payload, handlers }
}

/** Removes the listener installed by the previous `set`, so repeats do not stack. */
let disposeHandlers: (() => void) | null = null

export const menu: MenuAPI = {
  async set(appMenu) {
    if (!hasBridge('menu')) return false

    const { payload, handlers } = extractHandlers(appMenu)

    disposeHandlers?.()
    disposeHandlers = handlers.size > 0
      ? onCraftEvent<MenuActionEvent>('craft:menu:action', (event) => {
          handlers.get(event.id)?.()
        })
      : null

    await window.craft!.menu.set(payload)
    return true
  },
  async setDock(items) {
    if (hasBridge('menu')) await window.craft!.menu.setDock(items)
  },
  async addItem(parent, item) {
    if (hasBridge('menu')) await window.craft!.menu.addItem(parent, item)
  },
  async removeItem(id) { if (hasBridge('menu')) await window.craft!.menu.removeItem(id) },
  async enableItem(id) { if (hasBridge('menu')) await window.craft!.menu.enableItem(id) },
  async disableItem(id) { if (hasBridge('menu')) await window.craft!.menu.disableItem(id) },
  async checkItem(id) { if (hasBridge('menu')) await window.craft!.menu.checkItem(id) },
  async uncheckItem(id) { if (hasBridge('menu')) await window.craft!.menu.uncheckItem(id) },
  async setItemLabel(id, lbl) { if (hasBridge('menu')) await window.craft!.menu.setItemLabel(id, lbl) },
  async clearDock() { if (hasBridge('menu')) await window.craft!.menu.clearDock() },
  onAction(cb) {
    return onCraftEvent<MenuActionEvent>('craft:menu:action', cb)
  },
}
