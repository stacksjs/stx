import type { AppStatePayload, DeepLinkPayload, NativeBridgeInterface } from '../bridge/protocol'
import { STXBridge } from '../bridge/protocol'

type AnyRecord = Record<string, any>

export interface CraftBridgeOptions {
  routeName?: string
  routeNames?: string[]
}

function capabilityFlags(capabilities: Set<string>): Record<string, boolean> {
  return {
    haptics: capabilities.has('haptics'),
    speechRecognition: false,
    share: false,
    camera: false,
    biometric: capabilities.has('biometric'),
    pushNotifications: false,
    secureStorage: capabilities.has('secureStorage'),
    storage: capabilities.has('storage'),
    localDatabase: capabilities.has('database'),
    lifecycle: capabilities.has('lifecycle'),
    geolocation: false,
    clipboard: capabilities.has('clipboard'),
    contacts: false,
    calendar: false,
    localNotifications: capabilities.has('notifications'),
    inAppPurchase: false,
    keepAwake: false,
    orientationLock: false,
    deepLinks: capabilities.has('deepLinks'),
    flashlight: false,
    speech: false,
    network: false,
    deviceInfo: capabilities.has('device'),
    fetch: capabilities.has('fetch'),
    badge: false,
    appReview: false,
    health: capabilities.has('health'),
    dialogs: capabilities.has('dialog'),
    browser: capabilities.has('browser'),
    appleSignIn: capabilities.has('appleSignIn'),
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
  let appState = nativeBridge.initialAppState || 'active'
  let initialDeepLinkClaimed = false
  const appStateHandlers = new Set<(state: string) => unknown>()
  const deepLinkHandlers = new Set<(link: DeepLinkPayload) => unknown>()
  const navButtonHandlers = new Set<(event: { id: string }) => unknown>()
  const navButtonPresses = new Map<string, (event: { id: string }) => unknown>()
  const routeName = options.routeName || 'main'
  const routeNames = options.routeNames || [routeName]

  craft.platform = nativeBridge.platform || 'unknown'
  // Code shared with the page tells the phone apart by its user agent, which a
  // JavaScriptCore screen does not have: say which phone this is.
  const navigatorObject: AnyRecord = target.navigator = target.navigator || {}
  if (typeof navigatorObject.userAgent !== 'string')
    navigatorObject.userAgent = platformUserAgent(craft.platform)
  craft.capabilityProtocolVersion = Number(nativeBridge.capabilityProtocolVersion || 0)
  craft.capabilities = capabilityFlags(capabilities)
  craft.route = { name: routeName, params: target.__stxNativeParams || {} }
  craft.appearance = { colorScheme: () => nativeBridge.colorScheme === 'dark' ? 'dark' : 'light' }
  craft.device = { getInfo: () => request('Device', 'getInfo', []) }
  craft.clipboard = {
    write: (value: string) => request('Clipboard', 'write', [value]),
    read: () => request('Clipboard', 'read', []),
  }
  craft.haptic = (style?: string) => request('Haptics', 'impact', [style || 'medium'])
  const feedback = (answer: Promise<any>): Promise<void> => answer.then(() => {}, (error) => {
    if (error?.code === 'CAPABILITY_DISABLED') return
    throw error
  })
  craft.haptics = {
    impact: (style?: string) => feedback(craft.haptic(style)),
    notification: (type?: string) => feedback(craft.haptic(type === 'error' ? 'heavy' : type === 'warning' ? 'medium' : 'light')),
    selection: () => feedback(craft.haptic('soft')),
  }

  craft.storage = Object.assign({ getSync: () => null, setSync: () => undefined }, craft.storage || {}, {
    get: (key: string) => request('Storage', 'get', [key]),
    set: (key: string, value: unknown) => request('Storage', 'set', [key, value]),
    remove: (key: string) => request('Storage', 'remove', [key]),
    clear: () => request('Storage', 'clear', []),
    keys: () => request('Storage', 'keys', []),
  })
  craft.secureStorage = Object.assign({ getSync: () => null }, craft.secureStorage || {}, {
    get: (key: string) => request('SecureStorage', 'get', [key]),
    set: (key: string, value: string) => request('SecureStorage', 'set', [key, value]),
    remove: (key: string) => request('SecureStorage', 'remove', [key]),
    delete: (key: string) => request('SecureStorage', 'remove', [key]),
    clear: () => request('SecureStorage', 'clear', []),
  })
  craft.snapshots = Object.assign({ get: () => null, set: () => Promise.resolve(false) }, craft.snapshots || {}, {
    onChange: (callback: (name: string) => void) => protocol.on<{ name: string }>('SNAPSHOT_CHANGED', (message) => {
      if (typeof message.payload?.name === 'string') callback(message.payload.name)
    }),
  })
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
  if (capabilities.has('appleSignIn'))
    craft.signInWithApple = (options: AnyRecord = {}) => ask('Auth', 'signInWithApple', [options])

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
      getSleepIntervals: (options: AnyRecord = {}) => request('Health', 'getSleepIntervals', [options]),
    }
  }
  craft.scheduleNotification = craft.notifications.schedule
  craft.cancelNotification = craft.notifications.cancel
  craft.cancelAllNotifications = craft.notifications.cancelAll
  craft.getPendingNotifications = craft.notifications.pending

  const navigate = (type: 'NAVIGATE' | 'NAVIGATE_REPLACE', screen: string, params?: Record<string, unknown>): string => {
    if (!routeNames.includes(screen)) throw new Error(`Unknown native screen: ${screen}`)
    if (params !== undefined && (params === null || typeof params !== 'object' || Array.isArray(params)))
      throw new TypeError('Navigation params must be an object')
    return protocol.send(type, { screen, params: params || {} })
  }
  const hostSetOptions = craft.navigation && typeof craft.navigation.setOptions === 'function'
    ? craft.navigation.setOptions.bind(craft.navigation)
    : null
  craft.navigation = Object.assign(craft.navigation || {}, {
    push: (screen: string, params?: Record<string, unknown>) => navigate('NAVIGATE', screen, params),
    replace: (screen: string, params?: Record<string, unknown>) => navigate('NAVIGATE_REPLACE', screen, params),
    back: () => protocol.goBack(),
    open: (path: string) => {
      if (typeof path !== 'string' || !path.trim()) throw new TypeError('navigation.open needs a path, such as /m/workout/42')
      return protocol.send('NAVIGATE_OPEN', { path })
    },
    setOptions: (navigationOptions: AnyRecord) => {
      if (!navigationOptions || typeof navigationOptions !== 'object') throw new TypeError('navigation.setOptions needs an object')
      const payload: AnyRecord = {}
      for (const key of Object.keys(navigationOptions)) {
        if (key === 'rightButtons' && Array.isArray(navigationOptions.rightButtons)) {
          navButtonPresses.clear()
          payload.rightButtons = navigationOptions.rightButtons.map((button: AnyRecord) => {
            const { onPress, ...rest } = button || {}
            if (typeof onPress === 'function' && rest.id != null) navButtonPresses.set(String(rest.id), onPress)
            return rest
          })
        }
        else if (typeof navigationOptions[key] !== 'function') payload[key] = navigationOptions[key]
      }
      return hostSetOptions ? hostSetOptions(payload) : protocol.send('NAVIGATION_SET_OPTIONS', payload)
    },
    onButton: (callback: (event: { id: string }) => unknown) => {
      if (typeof callback !== 'function') throw new TypeError('navigation.onButton needs a function')
      navButtonHandlers.add(callback)
      return () => navButtonHandlers.delete(callback)
    },
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
    appStateHandlers.forEach(handler => handler(appState))
  })
  protocol.on<DeepLinkPayload>('DEEP_LINK', ({ payload }) => {
    if (initialDeepLinkClaimed && payload.initial) return
    deepLinkHandlers.forEach(handler => handler(payload))
  })
  const dispatchNavButton = (event: { id?: unknown }): void => {
    const id = event?.id == null ? '' : String(event.id)
    navButtonPresses.get(id)?.({ id })
    navButtonHandlers.forEach(handler => handler({ id }))
  }
  protocol.on<{ id?: unknown }>('NAV_BUTTON', ({ payload }) => dispatchNavButton(payload))
  protocol.on<any>('EVENT', ({ payload }) => {
    if (payload?.handlerId === 'navButton' || payload?.handlerName === 'navButton')
      dispatchNavButton(payload.nativeEvent || {})
  })

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
      const body = init.body !== undefined ? init.body : source.body
      if (body != null && typeof body !== 'string') return Promise.reject(new TypeError('fetch in a native screen sends string bodies only'))
      if (body != null && (method === 'GET' || method === 'HEAD')) return Promise.reject(new TypeError('A GET or HEAD request cannot have a body'))
      return request('Network', 'fetch', [{ url, method, headers, body: body == null ? null : body }]).then((data: AnyRecord) => {
        const responseHeaders = data?.headers && typeof data.headers === 'object' ? data.headers : {}
        const responseBody = data?.body == null ? '' : String(data.body)
        let bodyUsed = false
        const consume = (): Promise<string> => {
          if (bodyUsed) return Promise.reject(new TypeError('Body has already been consumed'))
          bodyUsed = true
          return Promise.resolve(responseBody)
        }
        return {
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
          get bodyUsed() { return bodyUsed },
          text: consume,
          json: () => consume().then(JSON.parse),
        }
      }, (error: any) => {
        if (error?.code === 'INVALID_ARGUMENT') throw error
        const failure: any = new TypeError(error?.message || 'Network request failed')
        failure.code = error?.code || 'NETWORK_ERROR'
        throw failure
      })
    }
  }

  return craft
}
