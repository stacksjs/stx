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

import { hasBridge, onCraftEvent } from './_bridge'

export interface NotificationAttachment {
  /** Stable id within the notification. Optional — UNNotificationAttachment auto-generates one when omitted. */
  id?: string
  /** Local file URL or absolute path. UNNotificationAttachment requires a file URL. */
  url: string
  /**
   * MIME-ish hint. UNNotificationAttachment infers from the file
   * extension when absent; pass when the extension is missing or
   * ambiguous.
   */
  type?: 'image' | 'audio' | 'video' | string
}

export interface NotificationAction {
  /** Stable id sent back via `onActionClicked`. */
  id: string
  /** Visible label on the action button. */
  title: string
  /**
   * UNNotificationActionOptions — `'destructive'` shows the action in
   * red (delete-style), `'foreground'` brings the app to the foreground
   * after handling. Default is the standard non-destructive background
   * action.
   */
  style?: 'default' | 'destructive' | 'foreground'
  /** When present, hide the action behind FaceID / Touch ID before firing. */
  authenticationRequired?: boolean
}

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
  /**
   * Image / audio / video attachments shown alongside the notification
   * (UNNotificationAttachment on macOS, image-payload on Linux/Windows
   * where supported). Each entry needs a file URL or absolute path that
   * the OS can read.
   */
  attachments?: NotificationAttachment[]
  /**
   * Custom buttons added to the notification. macOS lets you ship up to
   * four; users see "More" if more are present. The `id` you set here
   * comes back via `onActionClicked` when the user taps the action.
   */
  actions?: NotificationAction[]
  /**
   * Inline reply text-field (macOS only). When set, the notification
   * shows a reply field; the user's text comes back via `onReply`.
   */
  reply?: {
    /** Placeholder text inside the reply box. */
    placeholder?: string
    /** Submit button label. Defaults to the system's "Send". */
    sendButtonTitle?: string
  }
  /**
   * Category identifier — pre-registered via UNUserNotificationCenter
   * before sending. When present, the notification reuses the actions
   * registered against that category instead of repeating them inline.
   */
  categoryId?: string
  /**
   * Replace any earlier notifications with the same thread id (groups
   * them in macOS's notification center; behaves as a "bucket" elsewhere).
   */
  threadId?: string
}

export interface NotificationActionEvent {
  /** Notification id (`options.id`). */
  notificationId?: string
  /** Action id (matches `NotificationAction.id`). */
  actionId: string
  /** When `actionId` is the system-supplied "default" tap action. */
  isDefault?: boolean
}

export interface NotificationReplyEvent {
  notificationId?: string
  /** Text the user typed into the inline reply field. */
  text: string
}

export interface NotificationCategory {
  /** Stable id referenced via `NotificationOptions.categoryId`. */
  id: string
  /** Default actions attached to every notification of this category. */
  actions: NotificationAction[]
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
  /**
   * Pre-register a category — same shape as `actions` on a single
   * notification, but reusable across many. Apps generally do this once
   * at boot so the notification center has the actions ready before any
   * notification fires.
   */
  registerCategories: (categories: NotificationCategory[]) => Promise<void>
  /**
   * Subscribe to user taps on actions (including the default tap on the
   * notification body — `event.isDefault === true` for that case).
   */
  onActionClicked: (cb: (event: NotificationActionEvent) => void) => () => void
  /**
   * Subscribe to inline-reply submissions. Only fires for notifications
   * that opted into `reply`.
   */
  onReply: (cb: (event: NotificationReplyEvent) => void) => () => void
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

  async registerCategories(categories) {
    if (!Array.isArray(categories) || categories.length === 0) return
    if (hasBridge('notifications')) {
      const fn = window.craft!.notifications.registerCategories
      if (typeof fn === 'function') await fn(categories)
    }
    // No web fallback — the standard Notification API has no equivalent.
  },

  onActionClicked(cb)  { return onCraftEvent<NotificationActionEvent>('craft:notification:actionClicked', cb) },
  onReply(cb)          { return onCraftEvent<NotificationReplyEvent>('craft:notification:reply', cb) },
}

function toEpochMs(t: string | number | Date | undefined): number {
  if (t == null) return Date.now()
  if (t instanceof Date) return t.getTime()
  if (typeof t === 'number') return t
  const parsed = Date.parse(t)
  return Number.isNaN(parsed) ? Date.now() : parsed
}
