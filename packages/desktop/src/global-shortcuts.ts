/**
 * Global Shortcuts (system-level hotkeys)
 *
 * **Different from `hotkeys.ts`.** That module registers in-window
 * shortcuts via document-level keyboard listeners — they only fire
 * while the Craft window has focus. This module talks to the native
 * `craft.shortcuts` bridge, which uses `RegisterEventHotKey` (macOS) /
 * `RegisterHotKey` (Windows) to make shortcuts fire **even when the
 * app isn't focused.** Choose whichever matches your use case.
 *
 * Browser builds: this module is a graceful no-op (you can call it,
 * but the shortcuts won't fire). Use `hotkeys.ts` for in-window-only
 * shortcuts that should work everywhere.
 */

import { hasBridge, onCraftEvent } from './_bridge'

export interface GlobalShortcutOptions {
  /**
   * If true, the shortcut continues to fire while the user holds the
   * keys down. Defaults to false (single fire on press).
   */
  repeats?: boolean
}

export interface ShortcutFireEvent {
  /** The id passed at registration time. */
  id: string
  /** The accelerator string that triggered this fire. */
  accelerator: string
  /** Epoch ms when the OS dispatched the shortcut. */
  timestamp: number
}

export interface GlobalShortcuts {
  /**
   * Register a system-wide hotkey under a stable id.
   * @param id - your identifier; reuse to listen via `on()`.
   * @param accelerator - e.g. `'Cmd+Shift+P'`, `'Ctrl+Alt+Space'`.
   */
  register: (id: string, accelerator: string, opts?: GlobalShortcutOptions) => Promise<void>
  /** Remove a previously-registered hotkey. */
  unregister: (id: string) => Promise<void>
  /** Remove every shortcut this app has registered. */
  unregisterAll: () => Promise<void>
  /** Re-enable a temporarily-disabled shortcut. */
  enable: (id: string) => Promise<void>
  /** Disable a shortcut without removing its registration. */
  disable: (id: string) => Promise<void>
  /** Returns true if `id` is currently registered. */
  isRegistered: (id: string) => Promise<boolean>
  /** List every registered shortcut for this app. */
  list: () => Promise<Array<{ id: string, accelerator: string, enabled: boolean }>>
  /** Subscribe to fire events. Returns an unsubscribe function. */
  on: (cb: (e: ShortcutFireEvent) => void) => () => void
}

export const globalShortcuts: GlobalShortcuts = {
  async register(id, accelerator, opts) {
    if (!hasBridge('shortcuts')) return
    await window.craft!.shortcuts.register(id, accelerator, opts)
  },
  async unregister(id) {
    if (!hasBridge('shortcuts')) return
    await window.craft!.shortcuts.unregister(id)
  },
  async unregisterAll() {
    if (!hasBridge('shortcuts')) return
    await window.craft!.shortcuts.unregisterAll()
  },
  async enable(id) {
    if (!hasBridge('shortcuts')) return
    await window.craft!.shortcuts.enable(id)
  },
  async disable(id) {
    if (!hasBridge('shortcuts')) return
    await window.craft!.shortcuts.disable(id)
  },
  async isRegistered(id) {
    if (!hasBridge('shortcuts')) return false
    return await window.craft!.shortcuts.isRegistered(id)
  },
  async list() {
    if (!hasBridge('shortcuts')) return []
    return await window.craft!.shortcuts.list()
  },
  on(cb) {
    return onCraftEvent<ShortcutFireEvent>('craft:shortcut', cb)
  },
}
