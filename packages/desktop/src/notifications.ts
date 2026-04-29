/**
 * System Notifications
 *
 * Send banner notifications and update the dock badge. When running
 * inside a Craft native window, uses UNUserNotificationCenter (macOS)
 * / D-Bus org.freedesktop.Notifications (Linux) / Toast (Windows).
 * In a browser, falls back to the standard `Notification` web API.
 *
 * **NOT** the same as `alerts.ts` — that module displays in-app toasts
 * (DOM overlays). This module dispatches to the OS notification center,
 * which persists in Notification Center / Action Center / etc.
 */

import { hasBridge } from './_bridge'

export interface NotificationOptions {
  /** Required title shown in bold at the top. */
  title: string
  /** Body text — may wrap. */
  body?: string
  /** Subtitle (macOS only — second line above body). */
  subtitle?: string
  /** Stable identifier so callers can `cancel(id)` later. */
  id?: string
  /** ISO timestamp / Date / epoch ms. Defaults to "now". */
  triggerAt?: string | number | Date
  /** Sound to play. `'default'` plays the system sound. */
  sound?: 'default' | 'silent' | string
  /** Icon URL (web fallback only — native uses the app icon). */
  icon?: string
  /** Number badge to display on the app icon. */
  badge?: number
  /** Custom data passed back to your `onClick` handler. */
  data?: unknown
}

export interface SystemNotifications {
  /** Show a notification immediately. */
  show: (options: NotificationOptions) => Promise<void>
  /** Schedule a future notification. Use `triggerAt` to set the time. */
  schedule: (options: NotificationOptions) => Promise<void>
  /** Cancel a scheduled or visible notification by id. */
  cancel: (id: string) => Promise<void>
  /** Cancel everything we've scheduled or shown. */
  cancelAll: () => Promise<void>
  /** Set the dock/taskbar badge count. */
  setBadge: (n: number) => Promise<void>
  /** Clear the dock/taskbar badge. */
  clearBadge: () => Promise<void>
  /**
   * Ask the user for notification permission.
   * Returns `true` if granted (or already granted).
   */
  requestPermission: () => Promise<boolean>
}

export const notifications: SystemNotifications = {
  async show(options: NotificationOptions): Promise<void> {
    if (!options.title) throw new Error('notification title is required')
    if (hasBridge('notifications')) {
      await window.craft!.notifications.show(options)
      return
    }
    // Web fallback: standard Notification API.
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const N = (window as any).Notification
      if (N.permission === 'granted') {
        new N(options.title, { body: options.body, icon: options.icon })
      }
      else if (N.permission === 'default') {
        const granted = (await N.requestPermission()) === 'granted'
        if (granted) new N(options.title, { body: options.body, icon: options.icon })
      }
    }
  },

  async schedule(options: NotificationOptions): Promise<void> {
    if (hasBridge('notifications')) {
      // The native side accepts a flat object. Normalize trigger to ISO so
      // the parser on the Zig side doesn't have to deal with Date objects.
      const o = { ...options }
      if (o.triggerAt instanceof Date) o.triggerAt = o.triggerAt.toISOString()
      await window.craft!.notifications.schedule(o)
      return
    }
    // Web has no scheduling primitive — fall back to setTimeout.
    const fireAt = toEpochMs(options.triggerAt)
    const delay = Math.max(0, fireAt - Date.now())
    setTimeout(() => { this.show(options).catch(() => {}) }, delay)
  },

  async cancel(id: string): Promise<void> {
    if (hasBridge('notifications')) {
      await window.craft!.notifications.cancel(id)
    }
    // Web has no per-id cancellation; nothing to do.
  },

  async cancelAll(): Promise<void> {
    if (hasBridge('notifications')) {
      await window.craft!.notifications.cancelAll()
    }
  },

  async setBadge(n: number): Promise<void> {
    // Negative counts cause native-side display glitches (Apple
    // documents non-negative). Clamp at the JS boundary so apps don't
    // have to remember the constraint, and round so a fractional value
    // (e.g. from a divide) doesn't render as "5.5".
    const safe = Math.max(0, Math.round(Number.isFinite(n) ? n : 0))
    if (hasBridge('notifications')) {
      await window.craft!.notifications.setBadge(safe)
      return
    }
    // Some browsers expose navigator.setAppBadge (PWA Badging API).
    if (typeof navigator !== 'undefined' && (navigator as any).setAppBadge) {
      try { await (navigator as any).setAppBadge(safe) } catch { /* ignore */ }
    }
  },

  async clearBadge(): Promise<void> {
    if (hasBridge('notifications')) {
      await window.craft!.notifications.clearBadge()
      return
    }
    if (typeof navigator !== 'undefined' && (navigator as any).clearAppBadge) {
      try { await (navigator as any).clearAppBadge() } catch { /* ignore */ }
    }
  },

  async requestPermission(): Promise<boolean> {
    if (hasBridge('notifications')) {
      return await window.craft!.notifications.requestPermission()
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const N = (window as any).Notification
      if (N.permission === 'granted') return true
      if (N.permission === 'denied') return false
      const result = await N.requestPermission()
      return result === 'granted'
    }
    return false
  },
}

function toEpochMs(t: string | number | Date | undefined): number {
  if (t == null) return Date.now()
  if (t instanceof Date) return t.getTime()
  if (typeof t === 'number') return t
  const parsed = Date.parse(t)
  return Number.isNaN(parsed) ? Date.now() : parsed
}
