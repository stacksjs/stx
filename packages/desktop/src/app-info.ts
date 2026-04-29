/**
 * App Metadata + Process Controls
 *
 * Companion to `window.ts`. While that module is about the visible
 * window, this is about the *application* — bundle metadata, dock
 * badge, dock-icon bounce.
 *
 * Outside a Craft window, the metadata getters return best-effort
 * defaults (empty / "0.0.0") so call sites can render an About panel
 * without branching on environment.
 */

import { hasBridge } from './_bridge'

export interface AppInfo {
  /** Bundle name (e.g. "Photo Booth"). */
  name: string
  /** CFBundleShortVersionString — the user-facing version. */
  version: string
  /** Bundle identifier (e.g. "com.example.app"). */
  bundleId?: string
  /** Absolute path to the .app bundle. */
  bundlePath?: string
  /** Path to the executable inside the bundle. */
  executablePath?: string
}

export interface AppNotifyOptions {
  title: string
  body?: string
  /** macOS UNNotificationSound name, or 'default'. */
  sound?: string
}

export interface AppAPI {
  /** Hide the dock icon (turn the app into a menubar-only / accessory app). */
  hideDockIcon: () => Promise<void>
  /** Restore the dock icon. */
  showDockIcon: () => Promise<void>
  /** Quit the application. */
  quit: () => Promise<void>
  /** Read bundle metadata. Resolves to defaults outside Craft. */
  getInfo: () => Promise<AppInfo>
  /** Post a system notification (alias for `notifications.show` with smaller surface). */
  notify: (options: AppNotifyOptions) => Promise<void>
  /** Set the dock-icon badge. Pass 0 to clear. */
  setBadge: (count: number) => Promise<void>
  /**
   * Bounce the dock icon to draw attention.
   * `'critical'` keeps bouncing until the user activates the app;
   * `'informational'` bounces once.
   */
  bounce: (type?: 'critical' | 'informational') => Promise<void>
}

const DEFAULT_INFO: AppInfo = { name: '', version: '0.0.0' }

export const app: AppAPI = {
  async hideDockIcon() { if (hasBridge('app')) await window.craft!.app.hideDockIcon() },
  async showDockIcon() { if (hasBridge('app')) await window.craft!.app.showDockIcon() },
  async quit()         { if (hasBridge('app')) await window.craft!.app.quit() },
  async getInfo() {
    if (!hasBridge('app')) return DEFAULT_INFO
    const r = await window.craft!.app.getInfo()
    return { ...DEFAULT_INFO, ...(r || {}) }
  },
  async notify(options) {
    if (!options.title) throw new Error('notify: title is required')
    if (hasBridge('app')) await window.craft!.app.notify(options)
  },
  async setBadge(count: number) {
    if (hasBridge('app')) await window.craft!.app.setBadge(count)
  },
  async bounce(type = 'informational') {
    if (hasBridge('app')) await window.craft!.app.bounce(type)
  },
}
