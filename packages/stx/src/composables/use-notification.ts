/**
 * useNotification - Web Notifications API wrapper
 *
 * Display native browser notifications with reactive permission state.
 *
 * @example
 * ```ts
 * const { permission, isSupported, show, requestPermission } = useNotification()
 *
 * // Request permission
 * await requestPermission()
 *
 * // Show notification
 * const notification = show('Hello!', {
 *   body: 'This is a notification',
 *   icon: '/icon.png',
 * })
 *
 * // Handle click
 * notification?.addEventListener('click', () => {
 *   window.focus()
 * })
 * ```
 */

export type NotificationPermission = 'default' | 'granted' | 'denied'

export interface NotificationState {
  permission: NotificationPermission
  isSupported: boolean
}

export interface NotificationOptions {
  /** Notification body text */
  body?: string
  /** Icon URL */
  icon?: string
  /** Badge URL (for mobile) */
  badge?: string
  /** Image URL */
  image?: string
  /** Tag for grouping notifications */
  tag?: string
  /** Whether to require interaction to dismiss */
  requireInteraction?: boolean
  /** Renotify even if tag exists */
  renotify?: boolean
  /** Silent notification (no sound/vibration) */
  silent?: boolean
  /** Vibration pattern (mobile) */
  vibrate?: number | number[]
  /** Custom data attached to notification */
  data?: unknown
  /** Auto-close after ms (custom implementation) */
  autoClose?: number
  /** Direction of text */
  dir?: 'auto' | 'ltr' | 'rtl'
  /** Language */
  lang?: string
  /** Actions (for service worker notifications) */
  actions?: NotificationAction[]
  /** Timestamp */
  timestamp?: number
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface NotificationRef {
  /** Get current notification state */
  get: () => NotificationState
  /** Subscribe to permission changes */
  subscribe: (fn: (state: NotificationState) => void) => () => void
  /** Check if notifications are supported */
  isSupported: () => boolean
  /** Get current permission status */
  permission: () => NotificationPermission
  /** Request notification permission */
  requestPermission: () => Promise<NotificationPermission>
  /** Show a notification */
  show: (title: string, options?: NotificationOptions) => Notification | null
  /** Close all notifications with a specific tag */
  close: (tag: string) => void
}

// Track active notifications by tag
const activeNotifications = new Map<string, Notification>()

/**
 * Reactive notification controller
 */
export function useNotification(): NotificationRef {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window

  let state: NotificationState = {
    permission: isSupported ? (Notification.permission as NotificationPermission) : 'denied',
    isSupported,
  }

  let listeners: Array<(state: NotificationState) => void> = []

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const updatePermission = () => {
    if (!isSupported) return
    state = {
      ...state,
      permission: Notification.permission as NotificationPermission,
    }
    notify()
  }

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied'

    try {
      const result = await Notification.requestPermission()
      state = { ...state, permission: result as NotificationPermission }
      notify()
      return result as NotificationPermission
    } catch {
      return state.permission
    }
  }

  const show = (title: string, options: NotificationOptions = {}): Notification | null => {
    if (!isSupported || state.permission !== 'granted') {
      return null
    }

    const { autoClose, ...notificationOptions } = options

    try {
      const notification = new Notification(title, notificationOptions)

      // Track by tag
      if (options.tag) {
        // Close existing notification with same tag
        const existing = activeNotifications.get(options.tag)
        if (existing) {
          existing.close()
        }
        activeNotifications.set(options.tag, notification)

        notification.addEventListener('close', () => {
          activeNotifications.delete(options.tag!)
        })
      }

      // Auto-close
      if (autoClose && autoClose > 0) {
        setTimeout(() => {
          notification.close()
        }, autoClose)
      }

      return notification
    } catch {
      return null
    }
  }

  const close = (tag: string): void => {
    const notification = activeNotifications.get(tag)
    if (notification) {
      notification.close()
      activeNotifications.delete(tag)
    }
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      listeners.push(fn)
      fn(state)

      return () => {
        listeners = listeners.filter(l => l !== fn)
      }
    },
    isSupported: () => state.isSupported,
    permission: () => state.permission,
    requestPermission,
    show,
    close,
  }
}

/**
 * Simple notification helper
 */
export async function notify(
  title: string,
  options?: NotificationOptions
): Promise<Notification | null> {
  const notifier = useNotification()

  // Request permission if needed
  if (notifier.permission() === 'default') {
    await notifier.requestPermission()
  }

  return notifier.show(title, options)
}

/**
 * Check if notifications are supported and permitted
 */
export function canNotify(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  )
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }
  return Notification.requestPermission() as Promise<NotificationPermission>
}

/**
 * Show notification with common patterns
 */
export const notifications = {
  /** Success notification */
  success: (message: string, options?: NotificationOptions) =>
    notify('Success', { body: message, icon: '✅', ...options }),

  /** Error notification */
  error: (message: string, options?: NotificationOptions) =>
    notify('Error', { body: message, icon: '❌', ...options }),

  /** Warning notification */
  warning: (message: string, options?: NotificationOptions) =>
    notify('Warning', { body: message, icon: '⚠️', ...options }),

  /** Info notification */
  info: (message: string, options?: NotificationOptions) =>
    notify('Info', { body: message, icon: 'ℹ️', ...options }),
}
