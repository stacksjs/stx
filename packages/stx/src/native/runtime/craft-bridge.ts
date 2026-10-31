import type { AppStatePayload, DeepLinkPayload, NativeBridgeInterface } from '../bridge/protocol'
import { NativeCapabilityError, STXBridge } from '../bridge/protocol'
import { createEventSourceClass, createStreamingBody, type StreamSink } from './event-stream'
import { abortError, isNativeDocument, NativeFormData, nativeFormParts, updateNativeDocumentVisibility } from './jsc-globals'
import type { NativeLayoutChrome } from '../compiler/ir'
import type { NativeChromeButton, NativeNavigationButton, NativeNavigationChrome } from './craft'
import { buttonsKey, changedTabItems, chromePath, hostButton, mergeChromeButtons, type ButtonSide } from './navigation-chrome'
import { installNativeNavigation, nativeRouteParams } from './web-navigation'
import { installNativeWebStorage } from './web-storage'

type AnyRecord = Record<string, any>

// Refresh our own defaults when a target is reinstalled with new capabilities,
// without replacing a host method installed before or after this adapter.
const permissionFallbacks = new WeakSet<object>()

export interface CraftBridgeOptions {
  routeName?: string
  routeNames?: string[]
  /** The page's title (`useHead` in a server script): the first navigation title. */
  title?: string
  /** The layout's chrome (layout-chrome.ts): its bar links are bar buttons. */
  chrome?: NativeLayoutChrome
  /** Web-storage keys the app shares with its native side (Craft's `shareStorage`): key to secure-storage key. */
  shareStorage?: Record<string, string>
  /** The screen's view, as the project names it (`views/plans/[id].stx`): its route params come from the address. */
  source?: string
}

function capabilityFlags(capabilities: Set<string>): Record<string, boolean> {
  return {
    desktop: capabilities.has('desktop'),
    haptics: capabilities.has('haptics'),
    speechRecognition: false,
    share: capabilities.has('share'),
    camera: capabilities.has('camera'),
    files: capabilities.has('files'),
    media: capabilities.has('media'),
    biometric: capabilities.has('biometric'),
    pushNotifications: capabilities.has('push'),
    secureStorage: capabilities.has('secureStorage'),
    storage: capabilities.has('storage'),
    crypto: capabilities.has('crypto'),
    storageCompareAndSet: capabilities.has('storageCompareAndSet'),
    storageSetIfAbsent: capabilities.has('storageSetIfAbsent'),
    localDatabase: capabilities.has('database'),
    lifecycle: capabilities.has('lifecycle'),
    geolocation: capabilities.has('geolocation'),
    locationRecordingOwnership: capabilities.has('locationRecordingOwnership'),
    locationRecordingIntentIdentity: capabilities.has('locationRecordingIntentIdentity'),
    music: capabilities.has('music'),
    heartRate: capabilities.has('heartRate'),
    heartRateRecordingOwnership: capabilities.has('heartRateRecordingOwnership'),
    heartRateRecordingIntentIdentity: capabilities.has('heartRateRecordingIntentIdentity'),
    bluetooth: capabilities.has('bluetooth'),
    scheduledWorkouts: capabilities.has('scheduledWorkouts'),
    liveActivities: capabilities.has('liveActivities'),
    clipboard: capabilities.has('clipboard'),
    contacts: false,
    calendar: false,
    localNotifications: capabilities.has('notifications'),
    inAppPurchase: false,
    keepAwake: capabilities.has('keepAwake'),
    brightness: capabilities.has('brightness'),
    statusBar: capabilities.has('statusBar'),
    orientationLock: false,
    deepLinks: capabilities.has('deepLinks'),
    flashlight: false,
    speech: capabilities.has('speech'),
    audio: capabilities.has('audio'),
    audioRecording: capabilities.has('audioRecording'),
    eventStream: capabilities.has('eventStream'),
    linking: capabilities.has('linking'),
    network: capabilities.has('network'),
    deviceInfo: capabilities.has('device'),
    fetch: capabilities.has('fetch'),
    badge: capabilities.has('badge'),
    wallet: capabilities.has('wallet'),
    appReview: false,
    health: capabilities.has('health'),
    dialogs: capabilities.has('dialog'),
    browser: capabilities.has('browser'),
    web: capabilities.has('web'),
    appleSignIn: capabilities.has('appleSignIn'),
    background: capabilities.has('background'),
    crashReporter: capabilities.has('crashReporter'),
    animation: capabilities.has('animation'),
    viewFocus: capabilities.has('viewFocus'),
    viewMeasure: capabilities.has('viewMeasure'),
    viewNonModalPresentation: capabilities.has('viewNonModalPresentation'),
    nativePlatformControls: capabilities.has('nativePlatformControls'),
  }
}

/** A user agent that names the phone, in the words a browser on it would use. */
function platformUserAgent(platform: string): string {
  if (platform === 'ios') return 'Mozilla/5.0 (iPhone; CPU iPhone OS like Mac OS X) Craft'
  if (platform === 'android') return 'Mozilla/5.0 (Linux; Android) Craft'
  return 'Craft'
}

/** Install the Craft capability surface on top of the shared typed bridge. */
export function installCraftBridge(
  protocol: STXBridge,
  nativeBridge: NativeBridgeInterface,
  target: AnyRecord = globalThis as AnyRecord,
  options: CraftBridgeOptions = {},
): AnyRecord {
  const craft: AnyRecord = target.craft = target.craft || {}
  const capabilities = new Set(nativeBridge.capabilities || [])
  const request = (module: string, method: string, args: unknown[]): Promise<any> =>
    protocol.callNativeAPI(module, method, ...args)
  const ask = (module: string, method: string, args: unknown[]): Promise<any> =>
    protocol.callPersonFacingAPI(module, method, ...args)
  const recordingRequest = (module: 'Location' | 'HeartRate', method: string, options?: AnyRecord): Promise<any> => {
    if (options && Object.prototype.hasOwnProperty.call(options, 'expectedId')) {
      if (typeof options.expectedId !== 'string' || !options.expectedId.trim())
        return Promise.reject(Object.assign(new Error('expectedId must be a nonempty recording ID'), { code: 'INVALID_ARGUMENT' }))
      const flag = module === 'Location' ? 'locationRecordingOwnership' : 'heartRateRecordingOwnership'
      if (!capabilities.has(flag))
        return Promise.reject(Object.assign(new Error('This app build cannot enforce recording ownership'), { code: 'RECORDING_OWNERSHIP_UNSUPPORTED' }))
    }
    return request(module, method, options === undefined ? [] : [options])
  }
  const recordingStart = async (module: 'Location' | 'HeartRate', options: AnyRecord = {}): Promise<any> => {
    if (Object.prototype.hasOwnProperty.call(options, 'recordingId')) {
      if (typeof options.recordingId !== 'string' || !options.recordingId.trim())
        throw Object.assign(new Error('recordingId must be a nonempty recording ID'), { code: 'INVALID_ARGUMENT' })
      const prefix = module === 'Location' ? 'location' : 'heartRate'
      if (!capabilities.has(`${prefix}RecordingIntentIdentity`) || !capabilities.has(`${prefix}RecordingOwnership`))
        throw Object.assign(new Error('This app build cannot start the persisted recording intent'), { code: 'RECORDING_INTENT_IDENTITY_UNSUPPORTED' })
    }
    const result = await ask(module, 'startRecording', [options])
    if (options.recordingId !== undefined && result?.id !== options.recordingId)
      throw Object.assign(new Error('The native recording does not match the persisted intent'), { code: 'RECORDING_CONFLICT' })
    return result
  }
  if (capabilities.has('crypto'))
    craft.crypto = { randomUUID: () => request('Crypto', 'randomUUID', []) }
  let appState = nativeBridge.initialAppState || 'active'
  updateNativeDocumentVisibility(target, appState)
  let initialDeepLinkClaimed = false
  const appStateHandlers = new Set<(state: string) => unknown>()
  const deepLinkHandlers = new Set<(link: DeepLinkPayload) => unknown>()
  const navButtonHandlers = new Set<(event: { id: string }) => unknown>()
  const navButtonPresses = {
    leftButtons: new Map<string, (event: { id: string }) => unknown>(),
    rightButtons: new Map<string, (event: { id: string }) => unknown>(),
  }
  const appearHandlers = new Set<() => unknown>()
  const disappearHandlers = new Set<() => unknown>()
  // A screen the host prepared out of sight - an adjacent tab, made ahead of
  // a swipe - starts unfocused, and the host says so before the script runs
  // (`__stxNativeFocused`). Defaulting to true let such a screen act as if it
  // were in front: a prepared Record tab's sign-in guard pushed Login over the
  // Feed at launch. Every later change still arrives as SCREEN_FOCUS.
  let focused = target.__stxNativeFocused !== false
  const routeName = options.routeName || 'main'
  const routeNames = options.routeNames || [routeName]

  craft.platform = nativeBridge.platform || 'unknown'
  // Code shared with the page tells the phone apart by its user agent, which a
  // JavaScriptCore screen does not have: say which phone this is.
  const navigatorObject: AnyRecord = target.navigator || (target.navigator = {})
  if (typeof navigatorObject.userAgent !== 'string')
    navigatorObject.userAgent = platformUserAgent(craft.platform)
  craft.capabilityProtocolVersion = Number(nativeBridge.capabilityProtocolVersion || 0)
  craft.capabilities = capabilityFlags(capabilities)
  // The params a screen was opened with. A hybrid app that opens the screen
  // again with others (`/m/messages?person=8`, or a tab's path with a query)
  // changes them in place and tells `route.onParams`.
  const paramsHandlers = new Set<(params: Record<string, unknown>, previous: Record<string, unknown>) => unknown>()
  craft.route = { name: routeName, params: target.__stxNativeParams || {}, ...(nativeBridge.routeURL ? { path: nativeBridge.routeURL } : {}) }
  // Not enumerable: `route` stays the plain `{ name, params }` it always was.
  Object.defineProperty(craft.route, 'onParams', {
    value: (callback: (params: Record<string, unknown>, previous: Record<string, unknown>) => unknown) => {
      if (typeof callback !== 'function') throw new TypeError('route.onParams needs a function')
      paramsHandlers.add(callback)
      return () => paramsHandlers.delete(callback)
    },
  })
  protocol.on<{ params?: Record<string, unknown> }>('ROUTE_PARAMS', ({ payload }) => {
    const previous = craft.route.params
    const params = payload?.params && typeof payload.params === 'object' ? payload.params : {}
    craft.route.params = params
    target.__stxNativeParams = params
    paramsHandlers.forEach(handler => handler(params, previous))
  })
  // The scheme now, and each change of it: what a screen colours itself (a space's palette) cannot leave to `dark:` classes.
  craft.appearance = {
    colorScheme: () => nativeBridge.colorScheme === 'dark' ? 'dark' : 'light',
    onChange: (callback: (scheme: 'light' | 'dark') => void) => protocol.on<AnyRecord>('APPEARANCE', ({ payload }) => {
      if (payload?.colorScheme === 'light' || payload?.colorScheme === 'dark') callback(payload.colorScheme)
    }),
  }
  craft.device = { getInfo: () => request('Device', 'getInfo', []) }
  craft.clipboard = {
    write: (value: string) => request('Clipboard', 'write', [value]),
    read: () => request('Clipboard', 'read', []),
  }
  /*
   * Haptics are feedback, never an outcome: every call resolves, whatever the
   * host says (UNSUPPORTED, CAPABILITY_DISABLED, an unknown action, a missing
   * bridge), so a screen never writes `?.catch?.(() => {})` after a tap.
   *
   * notification() and selection() play the host's own notification and
   * selection haptics (Craft iOS: UINotificationFeedbackGenerator and
   * UISelectionFeedbackGenerator). They used to be played as impacts of a
   * guessed weight. A host that does not know them (UNKNOWN_ACTION) gets that
   * impact instead, and is not asked again.
   */
  const settle = (send: () => Promise<any>): Promise<void> => {
    try {
      return Promise.resolve(send()).then(() => {}, () => {})
    }
    catch {
      return Promise.resolve()
    }
  }
  const unknownHaptics = new Set<string>()
  const hapticOr = (method: string, args: unknown[], impact: string): Promise<void> => {
    if (unknownHaptics.has(method))
      return settle(() => request('Haptics', 'impact', [impact]))
    return settle(() => request('Haptics', method, args).catch((error: any) => {
      if (error?.code !== 'UNKNOWN_ACTION') throw error
      unknownHaptics.add(method)
      return request('Haptics', 'impact', [impact])
    }))
  }
  craft.haptic = (style?: string) => settle(() => request('Haptics', 'impact', [style || 'medium']))
  craft.haptics = {
    impact: (style?: string) => craft.haptic(style),
    notification: (type?: string) => {
      const kind = type === 'error' || type === 'warning' ? type : 'success'
      return hapticOr('notification', [kind], kind === 'error' ? 'heavy' : kind === 'warning' ? 'medium' : 'light')
    },
    selection: () => hapticOr('selection', [], 'soft'),
    // Warm the engine so the next haptic plays without its wake-up delay.
    prepare: (kind?: string) => {
      if (unknownHaptics.has('prepare')) return Promise.resolve()
      return settle(() => request('Haptics', 'prepare', kind === undefined ? [] : [kind]).catch((error: any) => {
        if (error?.code === 'UNKNOWN_ACTION') unknownHaptics.add('prepare')
      }))
    },
  }

  const synchronousStorageUnsupported = () => {
    throw new NativeCapabilityError('STORAGE_SYNC_UNSUPPORTED', 'This host does not provide synchronous storage')
  }
  craft.storage = Object.assign({ getSync: synchronousStorageUnsupported, setSync: synchronousStorageUnsupported }, craft.storage || {}, {
    get: (key: string) => request('Storage', 'get', [key]),
    set: (key: string, value: unknown) => request('Storage', 'set', [key, value]),
    remove: (key: string) => request('Storage', 'remove', [key]),
    clear: () => request('Storage', 'clear', []),
    keys: () => request('Storage', 'keys', []),
    setIfAbsent: (key: string, value: unknown) => {
      if (!capabilities.has('storageSetIfAbsent'))
        return Promise.reject(Object.assign(new Error('This host cannot atomically register an intent'), { code: 'STORAGE_SET_IF_ABSENT_UNSUPPORTED' }))
      return request('Storage', 'setIfAbsent', [key, value])
    },
    compareAndSet: (key: string, expectedValue: unknown, nextValue: unknown) => {
      if (!capabilities.has('storageCompareAndSet'))
        return Promise.reject(Object.assign(new Error('This host cannot atomically checkpoint existing storage'), { code: 'STORAGE_COMPARE_AND_SET_UNSUPPORTED' }))
      return request('Storage', 'compareAndSet', [key, expectedValue, nextValue])
    },
  })
  craft.secureStorage = Object.assign({ getSync: () => null }, craft.secureStorage || {}, {
    get: (key: string) => request('SecureStorage', 'get', [key]),
    set: (key: string, value: string) => request('SecureStorage', 'set', [key, value]),
    remove: (key: string) => request('SecureStorage', 'remove', [key]),
    delete: (key: string) => request('SecureStorage', 'remove', [key]),
    clear: () => request('SecureStorage', 'clear', []),
  })
  /*
   * The signed-in account (Craft's `craft.session`, docs/api/mobile/session.md):
   * the host sends SESSION_CHANGED { key, token, previous } once per change of
   * the token in secure storage, written by any screen, the page or a native
   * sign-in, after storage holds it. A screen that keeps per-account state
   * resets on it instead of comparing snapshots on every change. What the
   * host installed itself (a `key`, its own `token`) is kept.
   */
  const sessionKey = String(craft.session?.key || nativeBridge.sessionTokenKey || 'auth.token')
  // Older native hosts can load this runtime and subscribe, but never emit
  // SESSION_CHANGED. A callable listener alone does not advertise support.
  const supportsSessionEvents = craft.session?.supportsEvents === true
    || (typeof nativeBridge.sessionTokenKey === 'string' && nativeBridge.sessionTokenKey.length > 0)
  craft.session = Object.assign({
    token: () => {
      const value = craft.secureStorage.getSync(sessionKey)
      return typeof value === 'string' && value ? value : null
    },
  }, craft.session || {}, {
    key: sessionKey,
    supportsEvents: supportsSessionEvents,
    onChange: (callback: (token: string | null, previous: string | null) => void) =>
      protocol.on<{ key?: string, token?: string | null, previous?: string | null }>('SESSION_CHANGED', ({ payload }) => {
        if (payload?.key && payload.key !== sessionKey) return
        const token = typeof payload?.token === 'string' && payload.token ? payload.token : null
        const previous = typeof payload?.previous === 'string' && payload.previous ? payload.previous : null
        if (token !== previous) callback(token, previous)
      }),
  })
  // The web's localStorage and sessionStorage, over the app's storage
  // (web-storage.ts): a web view reads its session on the first draw. Only
  // in a native realm: a browser, or a test's DOM, keeps its own. The keys
  // the app shares with its native side (Craft's `shareStorage`) are its
  // secure storage too, so the web view's sign-in is craft.session's.
  if (isNativeDocument(target.document)) {
    const shareStorage = { ...options.shareStorage, ...nativeBridge.shareStorage }
    const shared = installNativeWebStorage(target, craft, {
      shareStorage,
      ...(capabilities.has('secureStorage') ? { secure: () => craft.secureStorage } : {}),
      adopted: (key, value) => target.dispatchEvent?.(new target.CustomEvent('craftsharedstorage', { detail: { key, value } })),
    })
    if (shared) craft.session.onChange(() => shared.changed(sessionKey))
  }
  craft.snapshots = Object.assign({ get: () => null, set: () => Promise.resolve(false) }, craft.snapshots || {}, {
    onChange: (callback: (name: string) => void) => protocol.on<{ name: string }>('SNAPSHOT_CHANGED', (message) => {
      if (typeof message.payload?.name === 'string') callback(message.payload.name)
    }),
  })
  // A native connection is a path, not proof that any particular server
  // answers. Preserve both names used by Craft's page and native clients.
  if (capabilities.has('network')) {
    const status = (data: AnyRecord = {}) => {
      const connected = data.isConnected === true || data.connected === true
      const type = typeof data.type === 'string' ? data.type : 'unknown'
      return { ...data, connected, isConnected: connected, type, isWifi: connected && type === 'wifi', isCellular: connected && type === 'cellular' }
    }
    craft.network = {
      getStatus: () => request('Network', 'getStatus', []).then(status),
      onChange: (callback: (value: AnyRecord) => void) => protocol.on<any>('CRAFT_EVENT', ({ payload }) => {
        if (payload?.event === 'craftNetworkChange') callback(status(payload.detail))
      }),
    }
  }
  craft.biometrics = {
    isAvailable: () => request('Biometrics', 'isAvailable', []),
    getBiometricType: () => request('Biometrics', 'getBiometricType', []),
    authenticate: (reason?: string) => ask('Biometrics', 'authenticate', [reason || 'Authenticate to continue']),
  }
  craft.db = {
    execute: (sql: string, params: unknown[] = []) => request('Database', 'execute', [sql, params]),
    query: (sql: string, params: unknown[] = []) => request('Database', 'query', [sql, params]),
    beginTransaction: () => request('Database', 'beginTransaction', []),
    commit: () => request('Database', 'commit', []),
    rollback: () => request('Database', 'rollback', []),
  }
  craft.notifications = {
    show: (notification: unknown) => request('Notifications', 'schedule', [notification]),
    schedule: (notification: unknown) => request('Notifications', 'schedule', [notification]),
    cancel: (id: string) => request('Notifications', 'cancel', [id]),
    cancelAll: () => request('Notifications', 'cancelAll', []),
    pending: () => request('Notifications', 'pending', []),
  }
  // Permission-free app-icon badge controls. Hosts advertise this only when
  // they can apply it (currently the iOS native-screen host); keeping the
  // object capability-gated avoids a misleading API on Android and WebView
  // screens.
  if (capabilities.has('badge')) {
    craft.badge = {
      set: (count: number) => request('Badge', 'set', [count]),
      clear: () => request('Badge', 'clear', []),
    }
  }
  // The system's alert, confirmation and action sheet, the page's
  // `craft.dialog` shape. A person answers them, so they are never timed out.
  if (capabilities.has('dialog')) {
    craft.dialog = {
      alert: (options: AnyRecord = {}) => ask('Dialog', 'alert', [options]).then(() => undefined),
      confirm: (options: AnyRecord = {}) => ask('Dialog', 'confirm', [options]).then(Boolean),
      actionSheet: (options: AnyRecord = {}) => ask('Dialog', 'actionSheet', [options]).then((id: unknown) => (typeof id === 'string' ? id : null)),
    }
  }

  // The in-app browser and the system's web sign-in sheet, and Sign in with
  // Apple: the page's `craft.browser` and `craft.signInWithApple`. A person
  // answers each, so they are never timed out.
  if (capabilities.has('browser'))
    craft.browser = { open: (url: string, options: AnyRecord = {}) => ask('Browser', 'open', [url, options]) }

  // The app itself: its site (where the API and its web pages are, so a
  // screen needs no page to have told it), version and build.
  craft.app = {
    url: typeof nativeBridge.appURL === 'string' ? nativeBridge.appURL : '',
    version: typeof nativeBridge.appVersion === 'string' ? nativeBridge.appVersion : '',
    build: typeof nativeBridge.appBuild === 'string' ? nativeBridge.appBuild : '',
  }

  // AppKit screens use the same native protocol as mobile screens. These
  // operations are available only when the host advertises desktop support.
  if (capabilities.has('desktop')) {
    // Work to finish before the app quits. The host waits (a few seconds at
    // most) only while a screen holds the quit, so an app without handlers
    // quits at once. One listener answers for all of a screen's handlers.
    const quitHandlers = new Set<() => unknown>()
    let stopQuitListener: (() => void) | null = null
    const onQuit = (callback: () => unknown): (() => void) => {
      quitHandlers.add(callback)
      if (!stopQuitListener) {
        stopQuitListener = protocol.on<AnyRecord>('CRAFT_EVENT', ({ payload }) => {
          if (payload?.event !== 'craftDesktopQuit') return
          const token = typeof payload.detail?.token === 'string' ? payload.detail.token : null
          void Promise.allSettled([...quitHandlers].map(async handler => handler()))
            .then(() => request('Desktop', 'quitReady', [token]))
            .catch(() => {})
        })
        request('Desktop', 'holdQuit', [true]).catch(() => {})
      }
      return () => {
        if (!quitHandlers.delete(callback) || quitHandlers.size) return
        stopQuitListener?.()
        stopQuitListener = null
        request('Desktop', 'holdQuit', [false]).catch(() => {})
      }
    }
    craft.desktop = {
      openWindow: (options: AnyRecord) => request('Desktop', 'openWindow', [options]),
      closeWindow: () => request('Desktop', 'closeWindow', []),
      focus: (identifier: string) => request('Desktop', 'focus', [identifier]),
      setMenus: (menus: unknown[]) => request('Desktop', 'setMenus', [menus]),
      contextMenu: (items: unknown[]) => ask('Desktop', 'contextMenu', [items]),
      pickFiles: () => ask('Desktop', 'pickFiles', []),
      uploadFiles: (files: unknown[], url: string) => request('Desktop', 'uploadFiles', [files, url]),
      preview: (options: AnyRecord) => request('Desktop', 'preview', [options]),
      exportFile: (options: AnyRecord) => ask('Desktop', 'exportFile', [options]),
      qrCode: (text: string) => request('Desktop', 'qrCode', [text]),
      setBadge: (count: number) => request('Desktop', 'setBadge', [count]),
      onCommand: (callback: (id: string) => void) => protocol.on<AnyRecord>('CRAFT_EVENT', ({ payload }) => {
        if (payload?.event === 'craftDesktopCommand' && typeof payload.detail?.id === 'string') callback(payload.detail.id)
      }),
      onQuit,
      onOpenURL: (callback: (urls: string[]) => void) => protocol.on<AnyRecord>('CRAFT_EVENT', ({ payload }) => {
        if (payload?.event === 'craftDesktopOpenURL' && Array.isArray(payload.detail?.urls)) callback(payload.detail.urls.filter((url: unknown) => typeof url === 'string'))
      }),
      takeOpenedURLs: () => request('Desktop', 'takeOpenedURLs', []),
      isDefaultBrowser: () => request('Desktop', 'isDefaultBrowser', []),
      setDefaultBrowser: () => request('Desktop', 'setDefaultBrowser', []),
    }
  }

  // Web pages in a `<WebView tab>`: tabs the host owns (Craft's AppKit host built
  // with `webkit: true`). Events arrive as CRAFT_EVENT `craftWebView`.
  if (capabilities.has('web')) {
    const call = (method: string, args: unknown[]) => request('Web', method, args)
    const web: AnyRecord = {
      create: (options: AnyRecord = {}) => call('create', [options]),
      list: () => call('list', []),
      on: (type: string, callback: (event: AnyRecord) => void) => protocol.on<AnyRecord>('CRAFT_EVENT', ({ payload }) => {
        if (payload?.event === 'craftWebView' && payload.detail && (type === '*' || payload.detail.type === type)) callback(payload.detail)
      }),
    }
    const tabMethods = ['navigate', 'back', 'forward', 'reload', 'stop', 'close', 'state', 'focus', 'setZoom', 'setInspectable', 'evaluate', 'find', 'snapshot', 'print']
    for (const method of tabMethods)
      web[method] = (id: string, ...args: unknown[]) => call(method, [String(id), ...args])
    // What applies to every tab: content blockers, user scripts, site data, downloads, permission answers.
    Object.assign(web, {
      setContentRules: (identifier: string, list: AnyRecord) => call('setContentRules', [identifier, list]),
      removeContentRules: (identifier: string) => call('removeContentRules', [identifier]),
      allowContent: (hosts: string[]) => call('allowContent', [hosts]),
      setUserScripts: (scripts: unknown[]) => call('setUserScripts', [scripts]),
      answerPermission: (request: string, decision: string) => call('answerPermission', [request, decision]),
      clearData: (options: AnyRecord) => call('clearData', [options]),
      cancelDownload: (id: string) => call('cancelDownload', [id]),
      revealDownload: (path: string) => call('revealDownload', [path]),
      openDownload: (path: string) => call('openDownload', [path]),
    })
    // One tab's methods and events, bound to its id: `craft.web.tab(id).back()`.
    web.tab = (id: string): AnyRecord => {
      const tab: AnyRecord = { id: String(id) }
      for (const method of tabMethods)
        tab[method] = (...args: unknown[]) => web[method](id, ...args)
      tab.on = (type: string, callback: (event: AnyRecord) => void) => web.on(type, (event: AnyRecord) => { if (event.tab === tab.id) callback(event) })
      return tab
    }
    craft.web = web
  }

  // Background time handed back to iOS: the page's `craft.background.complete`
  // for a `craftBackgroundRefresh` or `craftSilentPush` the app script heard
  // (with the event's `id`, or none for everything pending), so
  // `@stacksjs/mobile`'s background work runs unchanged with no page.
  if (capabilities.has('background'))
    craft.background = { complete: (ok: boolean = true, id?: string) => request('Background', 'complete', [ok !== false, typeof id === 'string' ? id : null]).then(() => true, () => false) }
  if (capabilities.has('appleSignIn'))
    craft.signInWithApple = (options: AnyRecord = {}) => ask('Auth', 'signInWithApple', [options])

  // Another app or the system: `webcal:` subscriptions, `mailto:`, `tel:`,
  // the App Store, `app-settings:` for this app's page in Settings.
  if (capabilities.has('linking')) {
    craft.linking = {
      openURL: (url: string) => request('Linking', 'openURL', [String(url)]).then(Boolean),
      canOpenURL: (url: string) => request('Linking', 'canOpenURL', [String(url)]).then(Boolean),
    }
    craft.openURL = craft.linking.openURL
  }

  // The system share sheet, in the page's shape: callable, and as
  // `craft.share.share(options)`, which `@stacksjs/mobile` calls. True once
  // something was shared, false when the sheet was dismissed.
  if (capabilities.has('share')) {
    const share = (options: AnyRecord = {}) => ask('Share', 'share', [options]).then(Boolean)
    craft.share = Object.assign(share, { share })
  }

  // The app's crash and error reporter (bughq), when the app's config turns it
  // on: an error SDK on a screen or in the app script hands its events here,
  // so they share the native outbox (sent when online), the session and the
  // device's context. Craft already reports a screen's uncaught errors on its
  // own; this is for handled ones, the signed-in user and breadcrumbs.
  if (capabilities.has('crashReporter')) {
    craft.crashReporter = {
      capture: (event: AnyRecord) => request('CrashReporter', 'capture', [event || {}]).then(queued => queued !== false),
      setUser: (id: string | number | null) => request('CrashReporter', 'setUser', [id == null ? null : String(id)]).then(Boolean),
      addBreadcrumb: (breadcrumb: AnyRecord) => request('CrashReporter', 'addBreadcrumb', [breadcrumb || {}]).then(Boolean),
      flush: () => request('CrashReporter', 'flush', []).then(Boolean),
      context: () => request('CrashReporter', 'context', []),
    }
  }

  // The screen's next change animates rather than cutting: sent before the
  // state changes, so the host has it before the patch that follows.
  if (capabilities.has('animation')) {
    craft.animation = {
      next: (options: AnyRecord = {}) => {
        protocol.send('ANIMATE_NEXT', options && typeof options === 'object' ? options : {})
      },
    }
  }

  // Speech, the page's `craft.speech`: settles true once the words were said,
  // false when they were cut off. Never timed out, since a long cue takes as
  // long as it takes.
  if (capabilities.has('speech')) {
    craft.speech = {
      speak: (text: string, options: AnyRecord = {}) => {
        if (typeof text !== 'string' || !text.trim())
          return Promise.reject(Object.assign(new TypeError('speech.speak needs some text to say'), { code: 'INVALID_ARGUMENT' }))
        return ask('Speech', 'speak', [text, options]).then(spoken => spoken === true)
      },
      stop: () => request('Speech', 'stop', []).then(() => undefined),
    }
  }

  if (capabilities.has('audioRecording')) {
    craft.audioRecording = {
      start: (owner: string, options: AnyRecord = {}) => ask('AudioRecording', 'start', [owner, options]),
      stop: (owner: string) => ask('AudioRecording', 'stop', [owner]),
      cancel: (owner: string) => ask('AudioRecording', 'cancel', [owner]),
    }
  }

  // Background sound under the screen (rain under a breathing exercise),
  // stopped when the screen closes. Each `play` answers a handle.
  if (capabilities.has('audio')) {
    let nextSound = 0
    const soundHandlers = new Map<string, { end: Set<() => unknown>, error: Set<(message: string) => unknown> }>()
    const done = (): undefined => undefined
    const handle = (id: string): AnyRecord => {
      const handlers = { end: new Set<() => unknown>(), error: new Set<(message: string) => unknown>() }
      soundHandlers.set(id, handlers)
      return {
        id,
        pause: () => request('Audio', 'pause', [id]).then(done),
        resume: () => request('Audio', 'resume', [id]).then(done),
        stop: (options: { fadeOut?: number } = {}) => request('Audio', 'stop', [id, options]).then(done),
        setVolume: (volume: number, options: { fade?: number } = {}) => request('Audio', 'setVolume', [id, Number(volume), options]).then(done),
        onEnd: (callback: () => unknown) => {
          handlers.end.add(callback)
          return () => handlers.end.delete(callback)
        },
        onError: (callback: (message: string) => unknown) => {
          handlers.error.add(callback)
          return () => handlers.error.delete(callback)
        },
      }
    }
    craft.audio = {
      play: (url: string, options: AnyRecord = {}) => {
        if (typeof url !== 'string' || !url) return Promise.reject(new TypeError('audio.play needs a URL'))
        const id = `sound-${++nextSound}`
        const sound = handle(id)
        return request('Audio', 'play', [id, url, options]).then(() => sound, (error) => {
          soundHandlers.delete(id)
          throw error
        })
      },
      stopAll: (options: { fadeOut?: number } = {}) => request('Audio', 'stopAll', [options]).then(done),
    }
    protocol.on<{ id?: string, event?: string, message?: string }>('SOUND_EVENT', ({ payload }) => {
      const handlers = soundHandlers.get(String(payload?.id))
      if (!handlers) return
      soundHandlers.delete(String(payload?.id))
      if (payload?.event === 'ended') handlers.end.forEach(handler => handler())
      else handlers.error.forEach(handler => handler(String(payload?.message || 'The sound could not be played')))
    })
  }

  // The page's own services, in the page's names, so `@stacksjs/mobile`'s
  // keepAwake, brightness and statusBar work on a native screen unchanged.
  if (capabilities.has('keepAwake'))
    craft.setKeepAwake = (enabled: boolean) => request('KeepAwake', 'set', [enabled !== false])
  if (capabilities.has('brightness')) {
    craft.getBrightness = () => request('Brightness', 'get', [])
    craft.setBrightness = (level: number) => request('Brightness', 'set', [Number(level)])
  }
  if (capabilities.has('statusBar'))
    craft.statusBar = { setStyle: (style: string) => request('StatusBar', 'setStyle', [style]) }

  // GPS: one fix, a watch, and the route recording that keeps going in the
  // background (the page's recorder, so a run started on either is the same
  // run). `@stacksjs/mobile`'s location and createRouteRecorder call these.
  if (capabilities.has('geolocation')) {
    const watchers = new Map<number, (location: AnyRecord) => unknown>()
    let nextWatch = 0
    const unwatched = (): void => {
      if (watchers.size === 0) request('Location', 'clearWatch', []).catch(() => {})
    }
    craft.location = {
      // A first fix may wait on the permission sheet; the host bounds it by `timeout`.
      getCurrentPosition: (options: AnyRecord = {}) => ask('Location', 'getCurrentPosition', [options]),
      watchPosition: (callback: (location: AnyRecord) => unknown, options: AnyRecord = {}) => {
        if (typeof callback !== 'function') throw new TypeError('location.watchPosition needs a function')
        const id = ++nextWatch
        const first = watchers.size === 0
        watchers.set(id, callback)
        if (first) ask('Location', 'watchPosition', [options]).catch(() => {})
        return id
      },
      clearWatch: (id?: number) => {
        if (id === undefined) watchers.clear()
        else if (!watchers.delete(id)) return
        unwatched()
      },
      startRecording: (options: AnyRecord = {}) => recordingStart('Location', options),
      pauseRecording: (options?: AnyRecord) => recordingRequest('Location', 'pauseRecording', options),
      resumeRecording: (options?: AnyRecord) => recordingRequest('Location', 'resumeRecording', options),
      stopRecording: (options?: AnyRecord) => recordingRequest('Location', 'stopRecording', options),
      getRecordingState: (options?: AnyRecord) => recordingRequest('Location', 'getRecordingState', options),
      acknowledgeRecording: (options: AnyRecord) => recordingRequest('Location', 'acknowledgeRecording', options),
      readRecording: (options?: AnyRecord) => recordingRequest('Location', 'readRecording', options),
    }
    target.addEventListener?.('craftLocationUpdate', (event: AnyRecord) => {
      watchers.forEach(callback => callback(event?.detail))
    })
  }

  // Real ActivityKit services, advertised only by supported native hosts.
  // Keep the page SDK's singular craft.liveActivity shape on native screens.
  if (capabilities.has('liveActivities')) {
    craft.liveActivity = {
      isAvailable: () => request('LiveActivities', 'isAvailable', []).then(Boolean),
      list: () => request('LiveActivities', 'list', []),
      start: (options: AnyRecord) => request('LiveActivities', 'start', [options]),
      update: (idOrState: string | AnyRecord, state: AnyRecord = {}) => request('LiveActivities', 'update', typeof idOrState === 'string' ? [idOrState, state] : [null, idOrState]),
      end: (id?: string, state: AnyRecord = {}) => request('LiveActivities', 'end', [id ?? null, state]),
    }
  }

  // The Music app's song and transport, in the page's names: `craft.music`
  // and its `craftMusicChange` events, so `@stacksjs/mobile`'s `music` works
  // on a native screen too. Asking for access is a question to the person.
  if (capabilities.has('music')) {
    const control = (command: string, extra: AnyRecord = {}) => request('Music', 'control', [{ command, ...extra }])
    craft.music = {
      getAuthorizationStatus: () => request('Music', 'getAuthorizationStatus', []),
      requestAuthorization: () => ask('Music', 'requestAuthorization', []),
      getNowPlaying: () => request('Music', 'getNowPlaying', []),
      play: () => control('play'),
      pause: () => control('pause'),
      togglePlayPause: () => control('togglePlayPause'),
      skipToNext: () => control('skipToNext'),
      skipToPrevious: (options: AnyRecord = {}) => control('skipToPrevious', { restartAfter: typeof options.restartAfter === 'number' ? options.restartAfter : null }),
      observe: (enabled?: boolean) => request('Music', 'observe', [{ enabled: enabled !== false }]),
    }
  }

  // A Bluetooth heart-rate strap, in the page's names: `craft.heartRate` and
  // its `craftHeartRate` events, so `@stacksjs/mobile`'s `heartRate` works on
  // a native screen too. One connection and one recording for the whole app,
  // whichever side started them. Scanning and connecting can show iOS's
  // Bluetooth prompt, so they wait on the person (connect answers TIMEOUT
  // natively after 15 s).
  // A generic, selected GATT channel. Permission prompts have no JS deadline.
  if (capabilities.has('bluetooth')) {
    craft.bluetooth = {
      getState: () => request('Bluetooth', 'getState', []),
      scan: (options: AnyRecord) => ask('Bluetooth', 'scan', [options]),
      stopScan: () => request('Bluetooth', 'stopScan', []),
      connect: (options: AnyRecord) => ask('Bluetooth', 'connect', [options]),
      exchange: (options: AnyRecord) => request('Bluetooth', 'exchange', [options]),
      read: (options: AnyRecord) => request('Bluetooth', 'read', [options]),
      write: (options: AnyRecord) => request('Bluetooth', 'write', [options]),
      disconnect: () => request('Bluetooth', 'disconnect', []),
    }
  }

  if (capabilities.has('heartRate')) {
    const strap = (method: string, options: AnyRecord = {}) => request('HeartRate', method, [options])
    craft.heartRate = {
      getState: () => strap('getState'),
      requestAuthorization: () => ask('HeartRate', 'requestAuthorization', [{}]),
      scan: (options: AnyRecord = {}) => ask('HeartRate', 'scan', [{ timeout: typeof options.timeout === 'number' ? options.timeout : null }]),
      stopScan: () => strap('stopScan'),
      getDevices: () => strap('getDevices'),
      connect: (id: string | AnyRecord) => ask('HeartRate', 'connect', [{ id: typeof id === 'string' ? id : id?.id }]),
      reconnect: () => strap('reconnect'),
      disconnect: (options: AnyRecord = {}) => strap('disconnect', { forget: !!options.forget }),
      startRecording: (options: AnyRecord = {}) => recordingStart('HeartRate', options),
      pauseRecording: (options?: AnyRecord) => recordingRequest('HeartRate', 'pauseRecording', options),
      resumeRecording: (options?: AnyRecord) => recordingRequest('HeartRate', 'resumeRecording', options),
      stopRecording: (options?: AnyRecord) => recordingRequest('HeartRate', 'stopRecording', options),
      getRecordingState: (options?: AnyRecord) => recordingRequest('HeartRate', 'getRecordingState', options),
      acknowledgeRecording: (options: AnyRecord) => recordingRequest('HeartRate', 'acknowledgeRecording', options),
      readRecording: (options: AnyRecord = {}) => recordingRequest('HeartRate', 'readRecording', options),
    }
  }

  // Structured workouts on the paired Apple Watch (WorkoutKit, iOS 17+), in
  // the page's names: `craft.scheduledWorkouts`, so `@stacksjs/mobile`'s
  // `scheduledWorkouts` works on a native screen too. Asking to schedule is a
  // question to the person; the rest answer from WorkoutKit.
  if (capabilities.has('scheduledWorkouts')) {
    const scheduled = (method: string, options: AnyRecord = {}) => request('ScheduledWorkouts', method, [options])
    craft.scheduledWorkouts = {
      isSupported: () => scheduled('isSupported'),
      authorization: () => scheduled('authorization'),
      requestAuthorization: () => ask('ScheduledWorkouts', 'requestAuthorization', [{}]),
      list: () => scheduled('list'),
      schedule: (plan: AnyRecord) => plan && typeof plan === 'object'
        ? scheduled('schedule', plan)
        : Promise.reject(new TypeError('scheduledWorkouts.schedule needs a plan')),
      remove: (id: string | AnyRecord) => scheduled('remove', { id: typeof id === 'string' ? id : id?.id }),
      removeAll: () => scheduled('removeAll'),
    }
  }

  // Video and audio kept on the phone for offline (CraftNativeMedia): `keep`
  // fetches an address once and resolves `{ ok, url, path, size }` (or
  // `{ ok: false, status }`); a native Video given that address then plays
  // the copy. `keep` is untimed: a long video on a slow signal outlasts the
  // bridge's deadline, and the host's own download timeout still applies.
  // `cellular: false` keeps it to Wi-Fi: on a metered connection nothing is
  // fetched and the answer is `{ ok: false, reason: 'cellular' }` (Craft
  // >= 0.0.170; an older host fetches it anyway).
  if (capabilities.has('media')) {
    craft.media = {
      keep: (url: string, options: AnyRecord = {}) => {
        if (typeof url !== 'string' || !url) return Promise.reject(new TypeError('media.keep needs a URL'))
        const headers: Record<string, string> = {}
        const given = options.headers
        if (given && typeof given === 'object') Object.keys(given).forEach((name) => { headers[name] = String(given[name]) })
        return ask('Media', 'keep', [url, options.cellular === false ? { headers, cellular: false } : { headers }])
      },
      path: (url: string) => typeof url === 'string' && url
        ? request('Media', 'path', [url]).then((path: unknown) => (typeof path === 'string' ? path : null))
        : Promise.resolve(null),
      prune: (urls: string[] = []) => request('Media', 'prune', [(Array.isArray(urls) ? urls : []).filter(url => typeof url === 'string')]),
      clear: () => request('Media', 'clear', []),
      usage: () => request('Media', 'usage', []),
    }
  }

  // Files on the phone (CraftNativeFiles.swift): a photo picked from the
  // library or taken with the camera (`source: 'camera'`, capability
  // `camera`), a file downloaded for the share sheet, and FormData, which
  // `fetch` sends as multipart with the files read natively. A file is
  // `{ path, name, type, size }`; its bytes stay on disk. Picking waits on
  // the person; null when they closed the picker.
  if (capabilities.has('files')) {
    craft.files = {
      pickVideo: (options: AnyRecord = {}) => ask('Files', 'pickVideo', [{
        source: options.source === 'files' ? 'files' : 'library',
        ...(typeof options.maxBytes === 'number' ? { maxBytes: options.maxBytes } : {}),
      }]).then((file: unknown) => nativeBridge.resolveFile ? nativeBridge.resolveFile(file) : file ?? null),
      pickImage: (options: AnyRecord = {}) => ask('Files', 'pickImage', [{
        source: options.source === 'camera' ? 'camera' : 'library',
        ...(typeof options.maxPixels === 'number' ? { maxPixels: options.maxPixels } : {}),
        ...(typeof options.quality === 'number' ? { quality: options.quality } : {}),
      }]).then((file: unknown) => nativeBridge.resolveFile ? nativeBridge.resolveFile(file) : file ?? null),
      download: (url: string, options: AnyRecord = {}) => {
        if (typeof url !== 'string' || !url) return Promise.reject(new TypeError('files.download needs a URL'))
        const headers: Record<string, string> = {}
        const given = options.headers
        if (given && typeof given === 'object') Object.keys(given).forEach((name) => { headers[name] = String(given[name]) })
        return request('Files', 'download', [url, { headers, ...(typeof options.name === 'string' ? { name: options.name } : {}) }]).then(file => nativeBridge.resolveFile ? nativeBridge.resolveFile(file) : file)
      },
      // What the screen made itself (a CSV export): text as it is, bytes as
      // `{ encoding: 'base64' }`. `craft.share({ files: [file] })` takes it.
      write: (name: string, data: string, options: AnyRecord = {}) => {
        if (typeof name !== 'string' || !name.trim()) return Promise.reject(new TypeError('files.write needs a file name'))
        if (typeof data !== 'string') return Promise.reject(new TypeError('files.write needs its contents as a string'))
        return request('Files', 'write', [name, data, {
          encoding: options.encoding === 'base64' ? 'base64' : 'utf8',
          ...(typeof options.type === 'string' ? { type: options.type } : {}),
        }]).then(file => nativeBridge.resolveFile ? nativeBridge.resolveFile(file) : file)
      },
      remove: (file: string | AnyRecord) => request('Files', 'remove', [typeof file === 'string' ? file : file?.path]).then(Boolean),
    }
    target.FormData ??= NativeFormData
  }

  // The host's events in the page's names (`craftLocationUpdate`), as
  // CustomEvents on the screen's global, where the page's code listens.
  protocol.on<{ event?: string, detail?: unknown }>('CRAFT_EVENT', ({ payload }) => {
    if (typeof payload?.event !== 'string' || typeof target.dispatchEvent !== 'function' || typeof target.CustomEvent !== 'function') return
    target.dispatchEvent(new target.CustomEvent(payload.event, { detail: payload.detail ?? {} }))
  })

  // Push, as the page has it: the permission, the device token and new
  // tokens. `craft.registerPush`, `craft.permissions` and the
  // `craftPushToken` event are the page's own names, so `@stacksjs/mobile`'s
  // `pushNotifications` and `permissions` work on a native screen too.
  if (capabilities.has('push')) {
    const tokenHandlers = new Set<(token: string) => unknown>()
    craft.push = {
      getPermissionStatus: () => request('Push', 'getPermissionStatus', []),
      requestPermission: () => ask('Push', 'requestPermission', []),
      register: () => ask('Push', 'register', []).then(String),
      onToken: (callback: (token: string) => unknown) => {
        if (typeof callback !== 'function') throw new TypeError('push.onToken needs a function')
        tokenHandlers.add(callback)
        return () => tokenHandlers.delete(callback)
      },
      openSettings: () => request('Push', 'openSettings', []).then(Boolean),
    }
    craft.registerPush = craft.push.register
    protocol.on<{ token?: string }>('PUSH_TOKEN', ({ payload }) => {
      const token = String(payload?.token || '')
      if (!token) return
      tokenHandlers.forEach(handler => handler(token))
      if (typeof target.dispatchEvent === 'function' && typeof target.CustomEvent === 'function')
        target.dispatchEvent(new target.CustomEvent('craftPushToken', { detail: { token } }))
    })
  }

  // A permission question is not conditional on push being enabled. Preserve
  // the host object itself (including prototypes and method receivers), filling
  // only missing methods. Unsupported questions reject, not a guessed status.
  const permissions = craft.permissions ??= {}
  const unsupportedPermission = (method: string, permission?: string): Promise<never> =>
    Promise.reject(new NativeCapabilityError('PERMISSION_UNSUPPORTED',
      `Native permissions.${method}${permission === undefined ? '' : `("${permission}")`} is not supported by this host`))
  const permissionDefaults = {
    check: (permission: string) => capabilities.has('push') && permission === 'notifications'
      ? craft.push.getPermissionStatus() : unsupportedPermission('check', permission),
    request: (permission: string) => capabilities.has('push') && permission === 'notifications'
      ? craft.push.requestPermission() : unsupportedPermission('request', permission),
    openSettings: () => capabilities.has('push')
      ? craft.push.openSettings().then(() => undefined) : unsupportedPermission('openSettings'),
  }
  for (const [method, fallback] of Object.entries(permissionDefaults)) {
    if (typeof permissions[method] === 'function' && !permissionFallbacks.has(permissions[method])) continue
    permissions[method] = fallback
    permissionFallbacks.add(fallback)
  }

  // Apple Health, the page's `craft.health` shape: present only when the app
  // reads it, so `health.supports(method)` stays true to the build.
  if (capabilities.has('health')) {
    craft.health = {
      requestAuthorization: (types: string[], options: AnyRecord = {}) => ask('Health', 'requestAuthorization', [types, options]),
      getData: (type: string, options: AnyRecord = {}) => request('Health', 'getData', [type, options]),
      saveWorkout: (workout: AnyRecord) => request('Health', 'saveWorkout', [workout]),
      getWorkouts: (options: AnyRecord = {}) => request('Health', 'getWorkouts', [options]),
      getDailyStatistics: (type: string, options: AnyRecord = {}) => request('Health', 'getDailyStatistics', [type, options]),
      getHeartRateSamples: (options: AnyRecord = {}) => request('Health', 'getHeartRateSamples', [options]),
      // Glucose, insulin and carbs one sample at a time (Craft 0.0.291).
      getSamples: (type: string, options: AnyRecord = {}) => request('Health', 'getSamples', [type, options]),
      getSleepIntervals: (options: AnyRecord = {}) => request('Health', 'getSleepIntervals', [options]),
      saveMindfulSession: (session: AnyRecord) => request('Health', 'saveMindfulSession', [session]),
      getMindfulSessions: (options: AnyRecord = {}) => request('Health', 'getMindfulSessions', [options]),
      // Heart rate as Apple Health receives it (Craft 0.0.165): each batch
      // arrives as a `craftHealthHeartRate` event, like the strap's readings.
      startHeartRateUpdates: (options: AnyRecord = {}) => request('Health', 'startHeartRateUpdates', [{ since: typeof options.since === 'number' ? options.since : null }]),
      stopHeartRateUpdates: () => request('Health', 'stopHeartRateUpdates', [{}]),
      startWorkout: (options: AnyRecord = {}) => request('Health', 'startWorkout', [{
        type: typeof options.type === 'string' ? options.type : '',
        ...(typeof options.location === 'string' ? { location: options.location } : {}),
      }]),
      pauseWorkout: () => request('Health', 'pauseWorkout', []),
      resumeWorkout: () => request('Health', 'resumeWorkout', []),
      endWorkout: () => request('Health', 'endWorkout', []),
      onWorkout: (callback: (event: Record<string, unknown>) => unknown) => {
        if (typeof callback !== 'function') throw new TypeError('health.onWorkout needs a function')
        const handler = (event: AnyRecord) => callback((event as AnyRecord).detail || {})
        target.addEventListener?.('craftHealthWorkout', handler)
        return () => target.removeEventListener?.('craftHealthWorkout', handler)
      },
    }
    // A store that may be missing or out of date, with grants managed in its
    // own screen (Health Connect on Android): whether it can be used, the
    // types granted now, and its screen for this app. Only on hosts that
    // report them, so `health.supports('availability')` is true to the build.
    if (capabilities.has('healthAvailability')) {
      craft.health.availability = () => request('Health', 'availability', [])
      craft.health.grantedTypes = () => request('Health', 'grantedTypes', []).then((types: unknown) => (Array.isArray(types) ? types.filter(type => typeof type === 'string') : []))
      craft.health.openSettings = () => ask('Health', 'openSettings', []).then(Boolean)
    }
  }

  if (capabilities.has('wallet')) {
    craft.wallet = {
      isAvailable: () => request('Wallet', 'isAvailable', []).then(Boolean),
      add: (source: { data?: string, url?: string }) => request('Wallet', 'add', [source]).then(Boolean),
      has: (serialNumber: string) => request('Wallet', 'has', [serialNumber]).then(Boolean),
    }
  }
  craft.scheduleNotification = craft.notifications.schedule
  craft.cancelNotification = craft.notifications.cancel
  craft.cancelAllNotifications = craft.notifications.cancelAll
  craft.getPendingNotifications = craft.notifications.pending

  const navigate = (type: 'NAVIGATE' | 'NAVIGATE_REPLACE', screen: string, params?: Record<string, unknown>): string => {
    const pathReplacement = type === 'NAVIGATE_REPLACE' && typeof screen === 'string' && screen.startsWith('/') && !screen.startsWith('//')
    if (!pathReplacement && !routeNames.includes(screen)) throw new Error(`Unknown native screen: ${screen}`)
    if (params !== undefined && (params === null || typeof params !== 'object' || Array.isArray(params)))
      throw new TypeError('Navigation params must be an object')
    if (pathReplacement && params && Object.keys(params).length)
      throw new TypeError('Replacement paths carry parameters in their query string')
    return protocol.send(type, { screen, params: params || {} })
  }
  const hostSetOptions = craft.navigation && typeof craft.navigation.setOptions === 'function'
    ? craft.navigation.setOptions.bind(craft.navigation)
    : null
  // The screen's own bar buttons and the app's chrome, merged on every send
  // (navigation-chrome.ts). The host only ever sees ids; presses stay here.
  const ownButtons: Record<ButtonSide, AnyRecord[]> = { leftButtons: [], rightButtons: [] }
  const sentButtons: Record<ButtonSide, string> = { leftButtons: '[]', rightButtons: '[]' }
  const sentTabItems = new Map<string, string>()
  let sentAccessory: string | undefined
  let chrome: NativeNavigationChrome | null = null
  // The layout's bar links, after the app's own chrome: a button the app
  // already has for the same path is not added twice.
  const layoutButtons: NativeChromeButton[] = (options.chrome?.bar ?? []).map(item => ({
    id: `layout:${item.path}`,
    open: item.path,
    accessibilityLabel: item.title,
    ...(item.symbol ? { symbol: item.symbol } : { title: item.title }),
  }))
  const effectiveChrome = (): NativeNavigationChrome | null => {
    if (!layoutButtons.length) return chrome
    const right = chrome?.rightButtons ?? []
    const taken = new Set([...right, ...(chrome?.leftButtons ?? [])].filter(button => button?.open).map(button => chromePath(button.open)))
    return { ...chrome, rightButtons: [...right, ...layoutButtons.filter(button => !taken.has(chromePath(button.open)))] }
  }
  const barButtons = (side: ButtonSide): NativeNavigationButton[] => {
    const merged = mergeChromeButtons(ownButtons[side] as NativeNavigationButton[], effectiveChrome(), side, { name: craft.route?.name ?? '', path: craft.route?.path })
    const presses = navButtonPresses[side]
    presses.clear()
    for (const button of merged) {
      const id = String(button.id)
      if (typeof button.onPress === 'function') presses.set(id, button.onPress)
      else if (button.open) {
        const path = button.open
        presses.set(id, () => craft.navigation.open(path))
      }
    }
    sentButtons[side] = buttonsKey(merged)
    return merged.map(hostButton)
  }
  const sendOptions = (payload: AnyRecord): unknown => hostSetOptions ? hostSetOptions(payload) : protocol.send('NAVIGATION_SET_OPTIONS', payload)
  craft.navigation = Object.assign(craft.navigation || {}, {
    push: (screen: string, params?: Record<string, unknown>) => navigate('NAVIGATE', screen, params),
    replace: (screen: string, params?: Record<string, unknown>) => navigate('NAVIGATE_REPLACE', screen, params),
    back: () => protocol.goBack(),
    // A finished task (a saved workout) closes to where its stack began.
    popToRoot: () => protocol.popToRoot(),
    open: (path: string) => {
      if (typeof path !== 'string' || !path.trim()) throw new TypeError('navigation.open needs a path, such as /m/workout/42')
      return protocol.send('NAVIGATE_OPEN', { path })
    },
    setOptions: (navigationOptions: AnyRecord) => {
      if (!navigationOptions || typeof navigationOptions !== 'object') throw new TypeError('navigation.setOptions needs an object')
      const payload: AnyRecord = {}
      for (const key of Object.keys(navigationOptions)) {
        if ((key === 'leftButtons' || key === 'rightButtons') && Array.isArray(navigationOptions[key])) {
          ownButtons[key] = navigationOptions[key].filter(Boolean)
          // Asked for, so always sent: the screen may be restoring a bar the
          // host changed underneath it.
          payload[key] = barButtons(key)
        }
        else if (typeof navigationOptions[key] !== 'function') payload[key] = navigationOptions[key]
      }
      return sendOptions(payload)
    },
    setChrome: (next: NativeNavigationChrome | null) => {
      if (next !== null && (typeof next !== 'object' || Array.isArray(next))) throw new TypeError('navigation.setChrome needs an object, or null')
      chrome = next
      const payload: AnyRecord = {}
      for (const side of ['leftButtons', 'rightButtons'] as const) {
        const before = sentButtons[side]
        const buttons = barButtons(side)
        if (sentButtons[side] !== before) payload[side] = buttons
      }
      const items = changedTabItems(chrome, sentTabItems)
      // One tab per send: the host's `tabItem` names one tab.
      if (items.length) payload.tabItem = items[0]
      const accessory = chrome && 'tabAccessory' in chrome ? JSON.stringify(chrome.tabAccessory ?? null) : undefined
      if (accessory !== undefined && accessory !== sentAccessory) {
        sentAccessory = accessory
        payload.tabAccessory = chrome!.tabAccessory ?? null
      }
      if (Object.keys(payload).length) sendOptions(payload)
      for (const item of items.slice(1)) sendOptions({ tabItem: item })
    },
    onButton: (callback: (event: { id: string }) => unknown) => {
      if (typeof callback !== 'function') throw new TypeError('navigation.onButton needs a function')
      navButtonHandlers.add(callback)
      return () => navButtonHandlers.delete(callback)
    },
    // The screen is on screen again: what was pushed over it (a web page, a
    // screen) was popped, or its tab was chosen again. Not its first showing.
    onAppear: (callback: () => unknown) => {
      if (typeof callback !== 'function') throw new TypeError('navigation.onAppear needs a function')
      appearHandlers.add(callback)
      return () => appearHandlers.delete(callback)
    },
    // Something was pushed over the screen, or another tab was chosen.
    onDisappear: (callback: () => unknown) => {
      if (typeof callback !== 'function') throw new TypeError('navigation.onDisappear needs a function')
      disappearHandlers.add(callback)
      return () => disappearHandlers.delete(callback)
    },
    isFocused: () => focused,
  })
  if (layoutButtons.length) {
    const buttons = barButtons('rightButtons')
    if (buttons.length) sendOptions({ rightButtons: buttons })
  }
  // A browser renderer keeps its own document, location and history.
  if (isNativeDocument(target.document)) {
    // Links, navigate(), location and history move by web path (web-navigation.ts).
    installNativeNavigation(target, craft, { routeURL: nativeBridge.routeURL, appURL: craft.app?.url })
    // useRoute().params, as the web's server hands them to a file-routed view
    // (`[id]` from the address), with the params the host opened it with.
    // Read by the signals runtime when it starts (`__stx_rp`), and set again
    // when the host opens the screen with others.
    const pathParams = options.source ? nativeRouteParams(options.source, String(target.location?.pathname ?? '/')) : {}
    target.__stx_rp = { ...pathParams, ...craft.route.params }
    craft.route.onParams((params: Record<string, unknown>) => target.stx?.setRouteParams?.({ ...pathParams, ...params }))
    // The page's title names the screen, as <title> names a browser tab:
    // `useHead({ title })` (and `document.title = ...`) set the navigation title.
    let title = typeof options.title === 'string' ? options.title : ''
    Object.defineProperty(target.document, 'title', {
      configurable: true,
      enumerable: true,
      get: () => title,
      set: (value: unknown) => {
        const next = value == null ? '' : String(value)
        if (next === title) return
        title = next
        sendOptions({ title: next })
      },
    })
    if (title) sendOptions({ title })
  }

  protocol.on<{ focused?: boolean }>('SCREEN_FOCUS', ({ payload }) => {
    focused = payload?.focused !== false
    const handlers = focused ? appearHandlers : disappearHandlers
    handlers.forEach(handler => handler())
  })

  const onAppStateChange = (callback: (state: string) => unknown): (() => void) => {
    if (typeof callback !== 'function') throw new TypeError('lifecycle.onStateChange needs a function')
    appStateHandlers.add(callback)
    return () => appStateHandlers.delete(callback)
  }
  craft.lifecycle = { getState: () => appState, onStateChange: onAppStateChange, onChange: onAppStateChange }
  craft.getAppState = craft.lifecycle.getState
  craft.onAppStateChange = onAppStateChange
  craft.deepLinks = {
    getInitialURL: () => {
      initialDeepLinkClaimed = true
      return request('DeepLinks', 'getInitialURL', [])
    },
    onLink: (callback: (link: DeepLinkPayload) => unknown) => {
      if (typeof callback !== 'function') throw new TypeError('deepLinks.onLink needs a function')
      deepLinkHandlers.add(callback)
      return () => deepLinkHandlers.delete(callback)
    },
  }

  protocol.on<AppStatePayload>('APP_STATE', ({ payload }) => {
    if (payload.state === appState) return
    appState = payload.state
    updateNativeDocumentVisibility(target, appState)
    appStateHandlers.forEach(handler => handler(appState))
  })
  protocol.on<DeepLinkPayload>('DEEP_LINK', ({ payload }) => {
    if (initialDeepLinkClaimed && payload.initial) return
    deepLinkHandlers.forEach(handler => handler(payload))
  })
  const dispatchNavButton = (event: { id?: unknown }): void => {
    const id = event?.id == null ? '' : String(event.id)
    const onPress = navButtonPresses.rightButtons.get(id) ?? navButtonPresses.leftButtons.get(id)
    onPress?.({ id })
    navButtonHandlers.forEach(handler => handler({ id }))
  }
  protocol.on<{ id?: unknown }>('NAV_BUTTON', ({ payload }) => dispatchNavButton(payload))
  protocol.on<any>('EVENT', ({ payload }) => {
    if (payload?.handlerId === 'navButton' || payload?.handlerName === 'navButton')
      dispatchNavButton(payload.nativeEvent || {})
  })

  // A response read as it arrives (`Accept: text/event-stream`), from hosts
  // that can send one (`eventStream`): event-stream.ts.
  const streaming = capabilities.has('eventStream')
  const streamSinks = new Map<string, StreamSink>()
  let nextStream = 0
  if (streaming) {
    protocol.on<{ id?: string, chunk?: string, done?: boolean, error?: string }>('NETWORK_STREAM', ({ payload }) => {
      const sink = streamSinks.get(String(payload?.id))
      if (!sink) return
      if (typeof payload.chunk === 'string') return sink.push(payload.chunk)
      streamSinks.delete(String(payload.id))
      if (payload.error) sink.fail(payload.error)
      else sink.end()
    })
  }
  const streamingFetch = (url: string, method: string, headers: Record<string, string>, body: string | null, signal?: AnyRecord): Promise<any> => {
    const id = `stream-${++nextStream}`
    const encoder = new target.TextEncoder()
    let settled = false
    const cancel = (): void => {
      streamSinks.delete(id)
      request('Network', 'cancelStream', [id]).catch(() => {})
    }
    const stream = createStreamingBody(text => encoder.encode(text), cancel)
    streamSinks.set(id, stream.sink)
    return new Promise((resolve, reject) => {
      signal?.addEventListener?.('abort', () => {
        stream.body.cancel()
        if (settled) return
        settled = true
        reject(abortError(signal.reason))
      })
      request('Network', 'stream', [{ id, url, method, headers, body }]).then((data: AnyRecord) => {
        if (settled) return
        settled = true
        resolve(response(data, { get bodyUsed() { return stream.used() }, text: stream.text, body: stream.body }))
      }, (error: any) => {
        streamSinks.delete(id)
        if (settled) return
        settled = true
        try { networkFailure(error) }
        catch (failure) { reject(failure) }
      })
    })
  }

  if (capabilities.has('fetch') && typeof target.fetch !== 'function') {
    target.fetch = (input: any, init: AnyRecord = {}): Promise<any> => {
      const source = input && typeof input === 'object' ? input : {}
      const url = typeof input === 'string' ? input : String(source.url || input)
      const method = String(init.method || source.method || 'GET').toUpperCase()
      const headers: Record<string, string> = {}
      const inputHeaders = init.headers || source.headers
      const addHeader = (name: string, value: unknown): void => { headers[String(name).toLowerCase()] = String(value) }
      if (Array.isArray(inputHeaders)) inputHeaders.forEach(pair => addHeader(pair[0], pair[1]))
      else if (inputHeaders && typeof inputHeaders.forEach === 'function') inputHeaders.forEach(addHeader)
      else if (inputHeaders && typeof inputHeaders === 'object') Object.keys(inputHeaders).forEach(name => addHeader(name, inputHeaders[name]))
      let body = init.body !== undefined ? init.body : source.body
      // A FormData: the host builds the multipart body and its boundary.
      let form: ReturnType<typeof nativeFormParts> | undefined
      if (body instanceof NativeFormData) {
        if (!capabilities.has('files')) return Promise.reject(new TypeError('This app cannot send a form from a native screen'))
        if (method === 'GET' || method === 'HEAD') return Promise.reject(new TypeError('A GET or HEAD request cannot have a body'))
        form = nativeFormParts(body)
        body = null
        delete headers['content-type']
      }
      if (body != null && typeof body !== 'string') return Promise.reject(new TypeError('fetch in a native screen sends string bodies only'))
      if (body != null && (method === 'GET' || method === 'HEAD')) return Promise.reject(new TypeError('A GET or HEAD request cannot have a body'))
      const signal: AnyRecord | undefined = init.signal || source.signal
      if (signal?.aborted) return Promise.reject(abortError(signal.reason))
      if (streaming && !form && /text\/event-stream/i.test(headers.accept || ''))
        return streamingFetch(url, method, headers, body == null ? null : body, signal)
      const answer = (form ? ask : request)('Network', 'fetch', [{ url, method, headers, body: body == null ? null : body, ...(form ? { form } : {}) }]).then((data: AnyRecord) => {
        const responseBody = data?.body == null ? '' : String(data.body)
        let bodyUsed = false
        const consume = (): Promise<string> => {
          if (bodyUsed) return Promise.reject(new TypeError('Body has already been consumed'))
          bodyUsed = true
          return Promise.resolve(responseBody)
        }
        return response(data, { get bodyUsed() { return bodyUsed }, text: consume })
      }, networkFailure)
      // The host's request runs to its end; an aborted fetch stops waiting for it.
      return signal ? Promise.race([answer, aborted(signal)]) : answer
    }
  }
  if (streaming && typeof target.fetch === 'function' && typeof target.EventSource !== 'function')
    target.EventSource = createEventSourceClass(target)

  return craft
}

function aborted(signal: AnyRecord): Promise<never> {
  return new Promise((_, reject) => signal.addEventListener?.('abort', () => reject(abortError(signal.reason))))
}

function networkFailure(error: any): never {
  if (error?.code === 'INVALID_ARGUMENT') throw error
  const failure: any = new TypeError(error?.message || 'Network request failed')
  failure.code = error?.code || 'NETWORK_ERROR'
  throw failure
}

/** A `Response` from the host's answer, with the body `reading` gives it. */
function response(data: AnyRecord, reading: AnyRecord): AnyRecord {
  const responseHeaders = data?.headers && typeof data.headers === 'object' ? data.headers : {}
  const result: AnyRecord = {
    type: 'basic',
    url: data?.url || '',
    status: Number(data?.status) || 0,
    statusText: data?.statusText || '',
    ok: Number(data?.status) >= 200 && Number(data?.status) < 300,
    redirected: Boolean(data?.redirected),
    headers: {
      get: (name: string) => responseHeaders[String(name).toLowerCase()] == null ? null : String(responseHeaders[String(name).toLowerCase()]),
      has: (name: string) => responseHeaders[String(name).toLowerCase()] != null,
      forEach: (callback: (value: string, name: string) => void) => Object.keys(responseHeaders).forEach(name => callback(String(responseHeaders[name]), name)),
    },
    text: reading.text,
    json: () => reading.text().then(JSON.parse),
  }
  Object.defineProperty(result, 'bodyUsed', { enumerable: true, get: () => reading.bodyUsed })
  if (reading.body) result.body = reading.body
  return result
}
