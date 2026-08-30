/**
 * Application Menu (macOS top-of-screen menubar) + Dock Menu
 *
 * Build the native menubar (`File`, `Edit`, `View`, ...) and the
 * dock-icon contextual menu. When running outside a Craft window this
 * module is a no-op — there's no portable web equivalent to the
 * macOS menubar.
 *
 * Each menu item is identified by an `id`. The native side fires a
 * `craft:menu:action` event with `{id}` when the user picks it; use
 * `menu.onAction(cb)` to listen.
 */
import { hasBridge, onCraftEvent } from './_bridge'

export interface MenuItem {
  /** Stable identifier. The same id is reported by `onAction`. */
  id?: string
  /** Visible label. */
  label?: string
  /**
   * Apple's stock menu roles (e.g. `'copy'`, `'paste'`, `'close'`,
   * `'quit'`, `'togglefullscreen'`).
   *
   * Cut, copy and paste *must* take this path. A role wires the item to the
   * AppKit selector with a nil target, so the responder chain performs it; an
   * id round-tripping through JS cannot reach the field editor or the
   * WKWebView's own clipboard actions, and Copy silently does nothing inside a
   * text field.
   */
  role?: string
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
   * Set the application menu.
   *
   * Merged into the runtime's existing bar, not a replacement: a menu the bar
   * does not already have is silently dropped.
   */
  set: (menu: ApplicationMenu) => Promise<void>
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

export const menu: MenuAPI = {
  async set(menu) {
    if (hasBridge('menu')) await window.craft!.menu.set(menu)
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
