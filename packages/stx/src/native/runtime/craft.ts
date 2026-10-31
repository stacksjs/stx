import type { NativeLiveActivities } from '../live-activity'
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
  variant?: 'accent' | 'account' | 'neutral'
  badge?: number
  badgeStyle?: 'count' | 'dot'
  /** Kept in the screen; the host only sees the id. */
  onPress?: (event: { id: string }) => unknown
}

/** Update one tab without replacing its stack, symbol or selection. */
export interface NativeTabItemOptions {
  id: string
  /** Null restores the configured caption. */
  title?: string | null
  iconText?: string | null
  /** A platform symbol drawn in place of the configured one; null restores it. */
  symbol?: string | null
  /** The symbol while this tab is selected; null falls back to `symbol`, then the configured one. */
  selectedSymbol?: string | null
  /** Icon-only color; null restores the normal selected/unselected tint. */
  iconTint?: string | null
  /** The color while this tab is selected; null falls back to `iconTint`. */
  selectedIconTint?: string | null
  /** A subtle pulse, suppressed while inactive or when reduced motion is enabled. */
  iconPulse?: boolean
  /** The pulse while this tab is selected; null falls back to `iconPulse`. */
  selectedIconPulse?: boolean | null
  image?: string | null
  badge?: string | null
  accessibilityLabel?: string | null
}

export interface NativeNavigationOptions {
  title?: string
  largeTitle?: boolean
  hidden?: boolean
  /** Hide the app's tab bar while this screen is visible. */
  tabBarHidden?: boolean
  /** Allow the iOS interactive back gesture. Defaults to true. */
  swipeBack?: boolean
  backTitle?: string
  leftButtons?: NativeNavigationButton[]
  rightButtons?: NativeNavigationButton[]
  /** A destination in its own box beside the tab pill. Null removes it. */
  tabAccessory?: { path: string, title: string, symbol: string, badge?: string | null, accessibilityLabel?: string, iconOnly?: boolean } | null
  tabItem?: NativeTabItemOptions
}

/** A button every screen of the app carries, unless the screen is where it goes. */
export interface NativeChromeButton extends NativeNavigationButton {
  /**
   * The path of the app this button opens (`/m/calendar`). It is pressed as
   * `navigation.open(open)` unless it has an `onPress` of its own, and it is
   * left off the screen already at that path.
   */
  open?: string
  /** Screens (`craft.route.name`) it is left off as well. */
  hideOn?: string[]
}

/**
 * The app's chrome: the bar buttons and tab updates every screen shares.
 *
 * A screen's own `leftButtons`/`rightButtons` come first and the chrome's
 * follow; a screen button with a chrome button's id gives way to it.
 */
export interface NativeNavigationChrome {
  leftButtons?: NativeChromeButton[]
  rightButtons?: NativeChromeButton[]
  /** Screens (`craft.route.name`) that keep only their own buttons, such as a profile with its own actions. */
  bare?: string[]
  /** Tabs to update (an account's picture and unread count); only what changed is sent. */
  tabItems?: NativeTabItemOptions[]
  tabAccessory?: NativeNavigationOptions['tabAccessory']
}

export interface NativeNavigation {
  /**
   * Declare the app's chrome for this screen, or `null` to drop it. Call it
   * again when what it shows changes (an avatar, a badge): the bar is sent
   * again only when its buttons did.
   */
  setChrome: (chrome: NativeNavigationChrome | null) => void
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
  /** A toolbar button was tapped; returns an unsubscribe function. */
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
  /** Atomically replace an existing matching value; never create a missing key. */
  compareAndSet: (key: string, expectedValue: unknown, nextValue: unknown) => Promise<boolean>
  /** Atomically create a missing key. Existing JSON null is still a value. */
  setIfAbsent: (key: string, value: unknown) => Promise<boolean>
  /** What `get` would resolve to, synchronously. Throws STORAGE_SYNC_UNSUPPORTED without a host implementation. */
  getSync: <T = unknown>(key: string) => T | null
  /** Synchronously persist through the host. Throws STORAGE_SYNC_UNSUPPORTED without a host implementation. */
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

export interface NativeFile {
  path: string
  name: string
  type: string
  size: number
}

export interface NativeCraft {
  /** ActivityKit Lock Screen and Dynamic Island presentations (iOS). */
  liveActivity?: NativeLiveActivities
  /** AppKit window and menu operations (`capabilities.desktop`). */
  desktop?: NativeDesktop
  /** Web pages shown by `<WebView tab>` (`capabilities.web`: Craft's AppKit host built with `webkit: true`). */
  web?: NativeWeb
  platform: string
  capabilityProtocolVersion: number
  route: NativeRoute
  capabilities: Record<string, boolean>
  crypto?: { randomUUID: () => Promise<string> }
  navigation: NativeNavigation
  storage: NativeStorage
  secureStorage: NativeSecureStorage
  snapshots: NativeSnapshots
  appearance: { colorScheme: () => 'light' | 'dark', onChange: (callback: (scheme: 'light' | 'dark') => void) => () => void }
  /** Feedback only: every call resolves, on every host (none of them rejects). */
  haptics: {
    impact: (style?: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' | (string & {})) => Promise<void>
    /** The host's notification haptic; an impact on a host without one. */
    notification: (type?: 'success' | 'warning' | 'error') => Promise<void>
    /** The host's selection haptic; a soft impact on a host without one. */
    selection: () => Promise<void>
    /** Warm the engine so the next haptic plays at once: `impact`, `notification`, `selection`, a weight, or all. */
    prepare: (kind?: string) => Promise<void>
  }
  /** An impact (`haptics.impact`). Resolves whatever the host says. */
  haptic: (style?: string) => Promise<void>
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
  /** Native file descriptors for pickers, downloads and the share sheet (`capabilities.files`). */
  files?: {
    pickImage: (options?: { source?: 'camera' | 'library', maxPixels?: number, quality?: number }) => Promise<NativeFile | null>
    pickVideo: (options?: { source?: 'files' | 'library', maxBytes?: number }) => Promise<NativeFile | null>
    download: (url: string, options?: { headers?: Record<string, string>, name?: string }) => Promise<NativeFile>
    write: (name: string, data: string, options?: { encoding?: 'base64' | 'utf8', type?: string }) => Promise<NativeFile>
    remove: (file: string | NativeFile) => Promise<boolean>
  }
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
  /** A private bounded microphone recording, owned by the requesting screen. */
  audioRecording?: {
    start: (owner: string, options?: { maxSeconds?: number }) => Promise<boolean>
    stop: (owner: string) => Promise<NativeFile & { durationSeconds: number }>
    cancel: (owner: string) => Promise<boolean>
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
  /**
   * Host permission methods are preserved, including their receiver. STX fills
   * missing methods even without push, but only knows notification permissions
   * when push is enabled. Other fallback calls reject with PERMISSION_UNSUPPORTED
   * rather than guessing 'undetermined'. Native errors propagate unchanged.
   */
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
    startRecording: (options?: Record<string, unknown> & { recordingId?: string }) => Promise<NativeLocationRecordingState>
    pauseRecording: (options?: { expectedId: string }) => Promise<NativeLocationRecordingState>
    resumeRecording: (options?: { expectedId: string }) => Promise<NativeLocationRecordingState>
    stopRecording: (options?: { expectedId: string }) => Promise<NativeLocationRecordingState & { locations: NativeLocation[] }>
    acknowledgeRecording: (options: { expectedId: string }) => Promise<boolean>
    getRecordingState: (options?: { expectedId: string }) => Promise<NativeLocationRecordingState & { sampleCount: number }>
    readRecording: (options?: { expectedId: string }) => Promise<NativeLocation[]>
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
    /** Glucose (mg/dL), insulin (IU, basal or bolus) or carbs (g), one sample at a time, oldest first. */
    getSamples: (type: 'bloodGlucose' | 'insulinDelivery' | 'dietaryCarbohydrates', options?: { startDate?: number, endDate?: number, limit?: number }) => Promise<Array<Record<string, unknown>>>
    getSleepIntervals: (options?: { startDate?: number, endDate?: number }) => Promise<Array<Record<string, unknown>>>
    /** Mindful minutes: `id` is kept as the sample's external UUID, and saving it again keeps the first sample. */
    saveMindfulSession: (session: { id: string, startDate: number, endDate: number }) => Promise<{ id: string, externalId: string, existing: boolean }>
    getMindfulSessions: (options?: { startDate?: number, endDate?: number, limit?: number }) => Promise<Array<Record<string, unknown>>>
    /** Heart rate as Apple Health receives it, from `since` (epoch ms), as `craftHealthHeartRate` events (`{ samples }`); one stream at a time. */
    startHeartRateUpdates: (options?: { since?: number }) => Promise<boolean>
    stopHeartRateUpdates: () => Promise<boolean>
    /** Start an OS-owned live workout session. Lifecycle and metrics arrive as `craftHealthWorkout` events. */
    startWorkout: (options: { type: string, location?: 'indoor' | 'outdoor' | 'unknown' }) => Promise<{ id: string, type: string, startDate: number }>
    pauseWorkout: () => Promise<boolean>
    resumeWorkout: () => Promise<boolean>
    endWorkout: () => Promise<{ id: string, workoutId: string, endDate: number, durationSeconds: number }>
    /** Subscribe to live workout state, metrics, and error events from the native host. */
    onWorkout: (callback: (event: Record<string, unknown>) => unknown) => () => void
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
  /** Apple Wallet or Google Wallet pass presentation, when the host advertises `wallet`. */
  wallet?: {
    isAvailable: () => Promise<boolean>
    add: (source: { data?: string, url?: string }) => Promise<boolean>
    has: (serialNumber: string) => Promise<boolean>
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
  /** Permission-free app-icon badge controls (`capabilities.badge`). */
  badge?: {
    set: (count: number) => Promise<unknown>
    clear: () => Promise<unknown>
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
  /** `floating` keeps the window above others (a small window for a link from another app). */
  openWindow: (options: { name: string, route: string, title?: string, titlebarStyle?: 'standard' | 'transparent', width?: number, height?: number, minWidth?: number, minHeight?: number, floating?: boolean, params?: Record<string, unknown> }) => Promise<{ name: string }>
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
  /**
   * Run `callback` when the app is about to quit, and wait for the promise it
   * returns (a final save). The host waits a few seconds at most; returns the
   * unsubscribe.
   */
  onQuit: (callback: () => unknown) => () => void
  /** Links and files other apps open with this one (a default browser's links). Returns the unsubscribe. */
  onOpenURL: (callback: (urls: string[]) => void) => () => void
  /** What other apps opened before the screen listened (the link that launched the app); each is handed out once. */
  takeOpenedURLs: () => Promise<string[]>
  isDefaultBrowser: () => Promise<boolean>
  /** Asks macOS to make this app the browser; the person confirms. Resolves whether it now is. */
  setDefaultBrowser: () => Promise<boolean>
}

/** What a tab reports: in `create`, `state` and `list` answers and in every `state` event. */
export interface NativeWebTabState {
  tab: string
  profile: string
  private: boolean
  title: string
  url: string
  /** 0 to 1. */
  progress: number
  loading: boolean
  canGoBack: boolean
  canGoForward: boolean
  /** Every resource of the page came over a secure connection. */
  secure: boolean
  zoom: number
  /** The page's `theme-color`, as `#rrggbb`. */
  themeColor?: string
  camera: boolean
  microphone: boolean
}

export type NativeWebEvent =
  | ({ type: 'state' } & NativeWebTabState)
  | { type: 'navigationStart' | 'navigationFinish', tab: string, url: string }
  | { type: 'navigationError', tab: string, url: string, code: number, domain: string, message: string }
  | { type: 'favicon', tab: string, url: string }
  /** `target=_blank` and `window.open` bring a ready `child` tab; a modifier click brings only the `url`. */
  | { type: 'open', tab: string, url: string, child?: string, popup?: boolean, width?: number, height?: number, background?: boolean, reason: 'script' | 'modifier' }
  | { type: 'close' | 'crashed', tab: string, url?: string }
  | { type: 'download', tab: string, id: string, state: 'started' | 'progress' | 'finished' | 'failed', path: string, name: string, url: string, received: number, total: number, fraction: number, message?: string, cancelled?: boolean }
  /** A site asks for the camera or microphone; answer with `answerPermission(request, ...)`. */
  | { type: 'permission', tab: string, request: string, kind: 'camera' | 'microphone' | 'camera+microphone', origin: string, protocol: string, port: number, mainFrame: boolean }

export interface NativeWebTab {
  readonly id: string
  navigate: (url: string) => Promise<boolean>
  back: () => Promise<boolean>
  forward: () => Promise<boolean>
  reload: (options?: { ignoreCache?: boolean }) => Promise<boolean>
  stop: () => Promise<boolean>
  close: () => Promise<boolean>
  state: () => Promise<NativeWebTabState>
  focus: () => Promise<boolean>
  setZoom: (zoom: number) => Promise<number>
  setInspectable: (inspectable: boolean) => Promise<boolean>
  /** Runs in the page's own world, or `isolated` where the page's scripts cannot see it. */
  evaluate: <T = unknown>(script: string, options?: { isolated?: boolean }) => Promise<T>
  find: (text: string, options?: { backwards?: boolean, caseSensitive?: boolean, wraps?: boolean }) => Promise<{ found: boolean }>
  /** A JPEG data URL. */
  snapshot: (options?: { width?: number }) => Promise<string>
  /** Opens the print sheet. */
  print: () => Promise<boolean>
  on: <K extends NativeWebEvent['type']>(type: K | '*', callback: (event: Extract<NativeWebEvent, { type: K }>) => void) => () => void
}

/**
 * Tabs the host owns, shown by `<WebView tab="id">`. A tab outlives the view
 * showing it, so a page survives re-renders and moves between panes.
 */
export interface NativeWeb {
  /** `profile` keeps its own cookies and storage; `private` keeps nothing on disk. */
  create: (options?: { id?: string, url?: string, profile?: string, private?: boolean, inspectable?: boolean }) => Promise<NativeWebTabState>
  list: () => Promise<NativeWebTabState[]>
  tab: (id: string) => NativeWebTab
  on: <K extends NativeWebEvent['type']>(type: K | '*', callback: (event: Extract<NativeWebEvent, { type: K }>) => void) => () => void
  navigate: (id: string, url: string) => Promise<boolean>
  back: (id: string) => Promise<boolean>
  forward: (id: string) => Promise<boolean>
  reload: (id: string, options?: { ignoreCache?: boolean }) => Promise<boolean>
  stop: (id: string) => Promise<boolean>
  close: (id: string) => Promise<boolean>
  state: (id: string) => Promise<NativeWebTabState>
  focus: (id: string) => Promise<boolean>
  setZoom: (id: string, zoom: number) => Promise<number>
  setInspectable: (id: string, inspectable: boolean) => Promise<boolean>
  evaluate: <T = unknown>(id: string, script: string, options?: { isolated?: boolean }) => Promise<T>
  find: (id: string, text: string, options?: { backwards?: boolean, caseSensitive?: boolean, wraps?: boolean }) => Promise<{ found: boolean }>
  snapshot: (id: string, options?: { width?: number }) => Promise<string>
  print: (id: string) => Promise<boolean>
  /**
   * A content blocker, as a WebKit content-rule list. WebKit compiles it once
   * and keeps it by identifier and version: ask without `json` first, and send
   * the rules only when the answer is `missing`.
   */
  setContentRules: (identifier: string, list: { version: string, json?: string }) => Promise<{ identifier: string, cached?: boolean, missing?: boolean }>
  removeContentRules: (identifier: string) => Promise<boolean>
  /** Sites (and their subdomains) that load with no blocker applied. Replaces the list. */
  allowContent: (hosts: string[]) => Promise<boolean>
  /**
   * CSS and JS for named hosts (and their subdomains; none is every site), in
   * an isolated world unless `world: 'page'`. JS runs at document end unless
   * `at: 'start'`. Replaces the set; pages pick it up on their next load.
   */
  setUserScripts: (scripts: Array<{ id: string, hosts: string[], css?: string, js?: string, world?: 'isolated' | 'page', at?: 'start' | 'end', allFrames?: boolean }>) => Promise<boolean>
  /** Resolves whether the request was still waiting. */
  answerPermission: (request: string, decision: 'grant' | 'deny' | 'prompt') => Promise<boolean>
  /** A profile's cookies, storage and caches: one site's, or all of them. */
  clearData: (options: { profile: string, private?: boolean, host?: string, types?: Array<'cookies' | 'storage' | 'cache'> }) => Promise<{ cleared: boolean, records?: number }>
  cancelDownload: (id: string) => Promise<boolean>
  /** Shows a downloaded file in Finder. Only files in ~/Downloads. */
  revealDownload: (path: string) => Promise<boolean>
  /** Opens a downloaded file; an app or script is revealed instead. Only files in ~/Downloads. */
  openDownload: (path: string) => Promise<boolean>
}
