/**
 * The `craft` object a native screen's script sees, typed.
 *
 * The shared native screen adapter and the Craft host install it on
 * `globalThis` before the script runs. A screen written in TypeScript can name it:
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
  variant?: 'accent' | 'account'
  badge?: number
  badgeStyle?: 'count' | 'dot'
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
  /**
   * The screen is on screen again (not its first showing): what was pushed
   * over it was popped, or its tab was chosen again. Reload what may have
   * changed meanwhile. Returns an unsubscribe function.
   */
  onAppear: (callback: () => unknown) => () => void
  /** Something was pushed over the screen, or another tab was chosen. */
  onDisappear: (callback: () => unknown) => () => void
  /** Whether the screen is on screen now. */
  isFocused: () => boolean
}

export interface NativeRoute {
  name: string
  /** The params the screen was opened with; replaced when it is opened again with others. */
  params: Record<string, unknown>
  /**
   * The screen was opened again with new params (`/m/messages?person=8` while
   * it shows, or a tab's path with a query). `params` is already the new set.
   */
  onParams: (callback: (params: Record<string, unknown>, previous: Record<string, unknown>) => unknown) => () => void
}

/** A sound `craft.audio.play` started. */
export interface NativeSound {
  id: string
  pause: () => Promise<void>
  resume: () => Promise<void>
  /** Stops it, fading out over `fadeOut` milliseconds first. */
  stop: (options?: { fadeOut?: number }) => Promise<void>
  /** 0 to 1, over `fade` milliseconds when given. */
  setVolume: (volume: number, options?: { fade?: number }) => Promise<void>
  /** It played to its end (never, for a looping sound). */
  onEnd: (callback: () => unknown) => () => void
  /** It stopped because it could not be played. */
  onError: (callback: (message: string) => unknown) => () => void
}

export type NativePermissionStatus = 'granted' | 'denied' | 'undetermined'

export interface NativeLocation {
  latitude: number
  longitude: number
  altitude?: number
  accuracy?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
  timestamp: number
}

export interface NativeLocationRecordingState {
  id: string | null
  active: boolean
  paused: boolean
  startedAt: number | null
}

export interface NativeShareOptions {
  title?: string
  text?: string
  url?: string
  /** Local files, as paths or file URLs. */
  files?: string[]
  /** A picture by https, file or data URL. */
  image?: string
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
  /** An app snapshot changed; read the current value with get(). */
  onChange: (callback: (name: string) => void) => () => void
  get: <T = unknown>(name: string) => T | null
  set: (name: string, value: unknown) => Promise<unknown>
}

export interface NativeCraft {
  /** AppKit window and menu operations (`capabilities.desktop`). */
  desktop?: NativeDesktop
  platform: string
  capabilityProtocolVersion: number
  route: NativeRoute
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
  /** The in-app browser, or with `mode: 'auth'` the system's web sign-in sheet (`capabilities.browser`). */
  browser?: {
    open: (url: string, options?: { mode?: 'safari' | 'auth', callbackScheme?: string }) => Promise<{ cancelled: boolean, url?: string, error?: string }>
  }
  /** Sign in with Apple (`capabilities.appleSignIn`). */
  signInWithApple?: (options?: { nonce?: string }) => Promise<{ userId: string, email?: string, name?: string, identityToken?: string, authorizationCode?: string }>
  /** The system's alert, confirmation and action sheet (`capabilities.dialogs`). */
  dialog?: {
    alert: (options?: { title?: string, message?: string, okLabel?: string }) => Promise<void>
    confirm: (options?: { title?: string, message?: string, confirmLabel?: string, cancelLabel?: string, destructive?: boolean }) => Promise<boolean>
    actionSheet: (options?: { title?: string, message?: string, actions?: Array<{ id?: string, title: string, style?: 'default' | 'destructive' | 'cancel' }> }) => Promise<string | null>
  }
  /**
   * Animated changes (`capabilities.animation`): `next()` makes the screen's
   * next change (state changed right after it) animate instead of cutting.
   * Views that stay move and resize, new ones fade in, removed ones fade
   * out, and two with the same `transitionID` move as one. Reduce Motion
   * gives a crossfade.
   */
  animation?: {
    next: (options?: { duration?: number, curve?: 'spring' | 'easeInOut' | 'linear', bounce?: number }) => void
  }
  /** Speech (`capabilities.speech`): true once the words were said, false when cut off. */
  speech?: {
    speak: (text: string, options?: { language?: string, rate?: number, interrupt?: boolean, pitch?: number, preDelay?: number }) => Promise<boolean>
    stop: () => Promise<void>
  }
  /**
   * Background sound under the screen (`capabilities.audio`), stopped when
   * the screen closes. Muted by the silent switch unless
   * `respectSilentSwitch: false`; mixes with the person's music.
   */
  audio?: {
    play: (url: string, options?: { loop?: boolean, volume?: number, fadeIn?: number, respectSilentSwitch?: boolean }) => Promise<NativeSound>
    stopAll: (options?: { fadeOut?: number }) => Promise<void>
  }
  /** Push notifications (`capabilities.pushNotifications`). */
  push?: {
    getPermissionStatus: () => Promise<NativePermissionStatus>
    /** Asks, when iOS has not been answered yet. */
    requestPermission: () => Promise<NativePermissionStatus>
    /** The device token, asking for permission first if it never was. */
    register: () => Promise<string>
    /** A new token (after a reinstall or a restore). */
    onToken: (callback: (token: string) => unknown) => () => void
    /** This app's page in Settings, where a refused permission is turned back on. */
    openSettings: () => Promise<boolean>
  }
  /** The page's names for push, which `@stacksjs/mobile` reads. */
  registerPush?: () => Promise<string>
  permissions?: {
    check: (permission: string) => Promise<NativePermissionStatus>
    request: (permission: string) => Promise<NativePermissionStatus>
    openSettings: () => Promise<void>
  }
  /** Another app or the system (`capabilities.linking`): `webcal:`, `mailto:`, `tel:`, the App Store. */
  linking?: {
    openURL: (url: string) => Promise<boolean>
    /** Only for the schemes the app lists in LSApplicationQueriesSchemes, and http(s). */
    canOpenURL: (url: string) => Promise<boolean>
  }
  openURL?: (url: string) => Promise<boolean>
  /**
   * The system share sheet (`capabilities.share`): true once shared, false
   * when dismissed. `image` is a picture's URL, shared as the picture.
   */
  share?: ((options: NativeShareOptions) => Promise<boolean>) & { share: (options: NativeShareOptions) => Promise<boolean> }
  /**
   * GPS (`capabilities.geolocation`): the page's own recorder, which keeps
   * recording in the background and survives a relaunch. Fixes are
   * `{ latitude, longitude, altitude, accuracy, altitudeAccuracy, heading, speed, timestamp }`.
   */
  location?: {
    getCurrentPosition: (options?: { enableHighAccuracy?: boolean, timeout?: number, maximumAge?: number }) => Promise<NativeLocation>
    watchPosition: (callback: (location: NativeLocation) => unknown, options?: Record<string, unknown>) => number
    clearWatch: (id?: number) => void
    startRecording: (options?: Record<string, unknown>) => Promise<NativeLocationRecordingState>
    pauseRecording: () => Promise<NativeLocationRecordingState>
    resumeRecording: () => Promise<NativeLocationRecordingState>
    stopRecording: () => Promise<NativeLocationRecordingState & { locations: NativeLocation[] }>
    getRecordingState: () => Promise<NativeLocationRecordingState & { sampleCount: number }>
    readRecording: () => Promise<NativeLocation[]>
  }
  /** Keeps the screen from locking (`capabilities.keepAwake`), the page's name. */
  setKeepAwake?: (enabled: boolean) => Promise<boolean>
  /** The backlight, 0 to 1, system-wide (`capabilities.brightness`), the page's names. */
  getBrightness?: () => Promise<number>
  setBrightness?: (level: number) => Promise<number>
  /** The status bar's text colour (`capabilities.statusBar`). */
  statusBar?: { setStyle: (style: 'light' | 'dark' | 'default') => Promise<boolean> }
  /** Apple Health, when the app reads it (`capabilities.health`). */
  health?: {
    requestAuthorization: (types: string[], options?: { write?: boolean }) => Promise<boolean>
    getData: (type: string, options?: { startDate?: number, endDate?: number }) => Promise<unknown>
    saveWorkout: (workout: Record<string, unknown>) => Promise<{ id?: string }>
    getWorkouts: (options?: { startDate?: number, endDate?: number, limit?: number }) => Promise<Array<Record<string, unknown>>>
    getDailyStatistics: (type: string, options?: { startDate?: number, endDate?: number }) => Promise<Array<{ date: string, value: number }>>
    getHeartRateSamples: (options?: { startDate?: number, endDate?: number, limit?: number }) => Promise<Array<Record<string, unknown>>>
    getSleepIntervals: (options?: { startDate?: number, endDate?: number }) => Promise<Array<Record<string, unknown>>>
    /** Mindful minutes: `id` is kept as the sample's external UUID, and saving it again keeps the first sample. */
    saveMindfulSession: (session: { id: string, startDate: number, endDate: number }) => Promise<{ id: string, externalId: string, existing: boolean }>
    getMindfulSessions: (options?: { startDate?: number, endDate?: number, limit?: number }) => Promise<Array<Record<string, unknown>>>
    /** Heart rate as Apple Health receives it, from `since` (epoch ms), as `craftHealthHeartRate` events (`{ samples }`); one stream at a time. */
    startHeartRateUpdates: (options?: { since?: number }) => Promise<boolean>
    stopHeartRateUpdates: () => Promise<boolean>
    /**
     * Whether the store can be used (`capabilities.healthAvailability`,
     * Health Connect): `updateRequired` and `unavailable` want
     * `openSettings`, which opens the store (or its install page).
     */
    availability?: () => Promise<'available' | 'updateRequired' | 'unavailable'>
    /** The types whose reads are granted now (Health Connect says; HealthKit never does). */
    grantedTypes?: () => Promise<string[]>
    /** The store's own screen for this app's permissions, or its install page. */
    openSettings?: () => Promise<boolean>
  }
  /**
   * Structured workouts on the paired Apple Watch (`capabilities.scheduledWorkouts`,
   * WorkoutKit, iOS 17+). A plan is `{ id, date: 'YYYY-MM-DD', hour?, minute?, workout }`.
   */
  scheduledWorkouts?: {
    isSupported: () => Promise<boolean>
    authorization: () => Promise<'authorized' | 'denied' | 'notDetermined' | 'restricted' | 'unsupported'>
    requestAuthorization: () => Promise<'authorized' | 'denied' | 'notDetermined' | 'restricted' | 'unsupported'>
    list: () => Promise<Array<{ id: string, date: string, hour?: number, minute?: number, complete: boolean }>>
    schedule: (plan: Record<string, unknown>) => Promise<{ id: string, droppedAlerts?: string[] }>
    remove: (id: string) => Promise<boolean>
    removeAll: () => Promise<number>
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
  /** The app: its site (`''` when it has none), version and build. */
  app: { url: string, version: string, build: string }
  /**
   * Background time handed back to iOS (`capabilities.background`), for the
   * app script's `craftBackgroundRefresh` and `craftSilentPush`: with the
   * event's `id`, or none for everything pending.
   */
  background?: { complete: (ok?: boolean, id?: string) => Promise<boolean> }
}

export interface NativeDesktop {
  openWindow: (options: { name: string, route: string, title?: string, width?: number, height?: number, minWidth?: number, minHeight?: number, params?: Record<string, unknown> }) => Promise<{ name: string }>
  closeWindow: () => Promise<void>
  focus: (identifier: string) => Promise<void>
  setMenus: (menus: Array<{ label: string, items: Array<{ id?: string, label?: string, shortcut?: string, separator?: boolean, disabled?: boolean }> }>) => Promise<boolean>
  contextMenu: (items: Array<{ id?: string, title?: string, icon?: string, checked?: boolean, separator?: boolean, disabled?: boolean }>) => Promise<string | null>
  pickFiles: () => Promise<Array<{ path: string, name: string, type: string }>>
  uploadFiles: <T = unknown>(files: Array<{ path: string, name: string, type: string }>, url: string) => Promise<T>
  preview: (options: { url: string, title?: string, type?: 'image' | 'video' | 'audio' }) => Promise<boolean>
  exportFile: (options: { url: string, name?: string }) => Promise<boolean>
  qrCode: (text: string) => Promise<string>
  setBadge: (count: number) => Promise<boolean>
  onCommand: (callback: (id: string) => void) => () => void
}
