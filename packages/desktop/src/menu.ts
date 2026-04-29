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
  id: string
  /** Visible label. */
  label?: string
  /**
   * Apple's stock menu roles (e.g. `'copy'`, `'paste'`, `'close'`,
   * `'quit'`). When set, AppKit hooks the system behaviour for free
   * — you don't need to reimplement Copy/Paste yourself.
   */
  role?: string
  /** Keyboard accelerator (e.g. `'Cmd+S'`). */
  accelerator?: string
  /** True for a separator line. Other fields ignored. */
  separator?: boolean
  /** Render as a checkbox; toggle via `menu.checkItem(id)`. */
  checkable?: boolean
  /** Initial checked state for checkable items. */
  checked?: boolean
  /** Disabled at startup (still renders, can't be picked). */
  disabled?: boolean
  /** Submenu under this item. */
  submenu?: MenuItem[]
  /** SF Symbol or asset name (macOS only). */
  icon?: string
}

export interface MenuActionEvent {
  id: string
}

export interface MenuAPI {
  /** Set the application menu (replaces the entire menubar). */
  set: (items: MenuItem[]) => Promise<void>
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
  async set(items) {
    if (hasBridge('menu')) await window.craft!.menu.set(items)
  },
  async setDock(items) {
    if (hasBridge('menu')) await window.craft!.menu.setDock(items)
  },
  async addItem(parent, item) {
    if (hasBridge('menu')) await window.craft!.menu.addItem(parent, item)
  },
  async removeItem(id)         { if (hasBridge('menu')) await window.craft!.menu.removeItem(id) },
  async enableItem(id)         { if (hasBridge('menu')) await window.craft!.menu.enableItem(id) },
  async disableItem(id)        { if (hasBridge('menu')) await window.craft!.menu.disableItem(id) },
  async checkItem(id)          { if (hasBridge('menu')) await window.craft!.menu.checkItem(id) },
  async uncheckItem(id)        { if (hasBridge('menu')) await window.craft!.menu.uncheckItem(id) },
  async setItemLabel(id, lbl)  { if (hasBridge('menu')) await window.craft!.menu.setItemLabel(id, lbl) },
  async clearDock()            { if (hasBridge('menu')) await window.craft!.menu.clearDock() },
  onAction(cb) {
    return onCraftEvent<MenuActionEvent>('craft:menu:action', cb)
  },
}
