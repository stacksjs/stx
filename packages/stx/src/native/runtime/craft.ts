/**
 * The `craft` object a native screen's script sees, typed.
 *
 * The runtime (`screen.ts`) and the Craft host install it on `globalThis`
 * before the script runs. A screen written in TypeScript can name it:
 *
 * ```ts
 * import type { NativeCraft } from '@stacksjs/stx/native'
 * const craft = (globalThis as unknown as { craft: NativeCraft }).craft
 * craft.navigation.open(`/m/workout/${id}`)
 * ```
 */

export interface NativeNavigationButton {
  id: string
  /** An SF Symbol name. */
  symbol?: string
  title?: string
  /** A picture (https URL), drawn round like an account button; the symbol or title shows until it loads. */
  image?: string
  color?: string
  accessibilityLabel?: string
  /** Kept in the screen; the host only sees the id. */
  onPress?: (event: { id: string }) => unknown
}

export interface NativeNavigationOptions {
  title?: string
  largeTitle?: boolean
  hidden?: boolean
  backTitle?: string
  rightButtons?: NativeNavigationButton[]
}

export interface NativeNavigation {
  /** Push another native screen of this bundle, by name. */
  push: (screen: string, params?: Record<string, unknown>) => string
  replace: (screen: string, params?: Record<string, unknown>) => string
  back: () => string
  /**
   * Open a path of the app (`/m/workout/42`). In a hybrid app the host shows
   * the native screen mapped to it, or pushes the web view at that path.
   */
  open: (path: string) => string
  setOptions: (options: NativeNavigationOptions) => unknown
  /** A right button was tapped; returns an unsubscribe function. */
  onButton: (callback: (event: { id: string }) => unknown) => () => void
}

export interface NativeStorage {
  get: <T = unknown>(key: string) => Promise<T | null>
  set: (key: string, value: unknown) => Promise<unknown>
  remove: (key: string) => Promise<unknown>
  clear: () => Promise<unknown>
  keys: () => Promise<string[]>
  /** What `get` would resolve to, synchronously (`null` when the host has none). */
  getSync: <T = unknown>(key: string) => T | null
  setSync: (key: string, value: unknown) => void
}

export interface NativeSecureStorage {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<unknown>
  remove: (key: string) => Promise<unknown>
  delete: (key: string) => Promise<unknown>
  clear: () => Promise<unknown>
  getSync: (key: string) => string | null
}

export interface NativeSnapshots {
  get: <T = unknown>(name: string) => T | null
  set: (name: string, value: unknown) => Promise<unknown>
}

export interface NativeCraft {
  platform: string
  capabilityProtocolVersion: number
  route: { name: string, params: Record<string, unknown> }
  capabilities: Record<string, boolean>
  navigation: NativeNavigation
  storage: NativeStorage
  secureStorage: NativeSecureStorage
  snapshots: NativeSnapshots
  appearance: { colorScheme: () => 'light' | 'dark' }
  haptics: {
    impact: (style?: string) => Promise<void>
    notification: (type?: 'success' | 'warning' | 'error') => Promise<void>
    selection: () => Promise<void>
  }
  haptic: (style?: string) => Promise<unknown>
  clipboard: { write: (text: string) => Promise<unknown>, read: () => Promise<string> }
  device: { getInfo: () => Promise<Record<string, unknown>> }
  biometrics: {
    isAvailable: () => Promise<boolean>
    getBiometricType: () => Promise<string | null>
    authenticate: (reason?: string) => Promise<unknown>
  }
  db: {
    execute: (sql: string, params?: unknown[]) => Promise<unknown>
    query: <T = unknown>(sql: string, params?: unknown[]) => Promise<T[]>
    beginTransaction: () => Promise<unknown>
    commit: () => Promise<unknown>
    rollback: () => Promise<unknown>
  }
  notifications: {
    show: (notification: unknown) => Promise<unknown>
    schedule: (notification: unknown) => Promise<unknown>
    cancel: (id: string) => Promise<unknown>
    cancelAll: () => Promise<unknown>
    pending: () => Promise<unknown[]>
  }
  lifecycle: {
    getState: () => 'active' | 'inactive' | 'background'
    onStateChange: (callback: (state: string) => unknown) => () => void
    onChange: (callback: (state: string) => unknown) => () => void
  }
  deepLinks: { getInitialURL: () => Promise<string | null>, onLink: (callback: (link: unknown) => unknown) => () => void }
}
