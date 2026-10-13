import type { AppStatePayload, DeepLinkPayload, NativeBridgeInterface } from '../bridge/protocol'
import { STXBridge } from '../bridge/protocol'
import { createEventSourceClass, createStreamingBody, type StreamSink } from './event-stream'
import { abortError, NativeFormData, nativeFormParts } from './jsc-globals'

type AnyRecord = Record<string, any>

export interface CraftBridgeOptions {
  routeName?: string
  routeNames?: string[]
}

function capabilityFlags(capabilities: Set<string>): Record<string, boolean> {
  return {
    haptics: capabilities.has('haptics'),
    speechRecognition: false,
    share: capabilities.has('share'),
    camera: capabilities.has('camera'),
    files: capabilities.has('files'),
    biometric: capabilities.has('biometric'),
    pushNotifications: capabilities.has('push'),
    secureStorage: capabilities.has('secureStorage'),
    storage: capabilities.has('storage'),
    localDatabase: capabilities.has('database'),
    lifecycle: capabilities.has('lifecycle'),
    geolocation: capabilities.has('geolocation'),
    music: capabilities.has('music'),
    heartRate: capabilities.has('heartRate'),
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
    eventStream: capabilities.has('eventStream'),
    linking: capabilities.has('linking'),
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
  const appearHandlers = new Set<() => unknown>()
  const disappearHandlers = new Set<() => unknown>()
  let focused = true
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
  // The params a screen was opened with. A hybrid app that opens the screen
  // again with others (`/m/messages?person=8`, or a tab's path with a query)
  // changes them in place and tells `route.onParams`.
  const paramsHandlers = new Set<(params: Record<string, unknown>, previous: Record<string, unknown>) => unknown>()
  craft.route = { name: routeName, params: target.__stxNativeParams || {} }
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
      startRecording: (options: AnyRecord = {}) => ask('Location', 'startRecording', [options]),
      pauseRecording: () => request('Location', 'pauseRecording', []),
      resumeRecording: () => request('Location', 'resumeRecording', []),
      stopRecording: () => request('Location', 'stopRecording', []),
      getRecordingState: () => request('Location', 'getRecordingState', []),
      readRecording: () => request('Location', 'readRecording', []),
    }
    target.addEventListener?.('craftLocationUpdate', (event: AnyRecord) => {
      watchers.forEach(callback => callback(event?.detail))
    })
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
      startRecording: () => strap('startRecording'),
      pauseRecording: () => strap('pauseRecording'),
      resumeRecording: () => strap('resumeRecording'),
      stopRecording: () => strap('stopRecording'),
      getRecordingState: () => strap('getRecordingState'),
      readRecording: (options: AnyRecord = {}) => strap('readRecording', { since: typeof options.since === 'number' ? options.since : null }),
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
      pickImage: (options: AnyRecord = {}) => ask('Files', 'pickImage', [{
        source: options.source === 'camera' ? 'camera' : 'library',
        ...(typeof options.maxPixels === 'number' ? { maxPixels: options.maxPixels } : {}),
        ...(typeof options.quality === 'number' ? { quality: options.quality } : {}),
      }]).then((file: unknown) => file ?? null),
      download: (url: string, options: AnyRecord = {}) => {
        if (typeof url !== 'string' || !url) return Promise.reject(new TypeError('files.download needs a URL'))
        const headers: Record<string, string> = {}
        const given = options.headers
        if (given && typeof given === 'object') Object.keys(given).forEach((name) => { headers[name] = String(given[name]) })
        return request('Files', 'download', [url, { headers, ...(typeof options.name === 'string' ? { name: options.name } : {}) }])
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
    craft.permissions = Object.assign({}, craft.permissions, {
      check: (permission: string) => permission === 'notifications' ? craft.push.getPermissionStatus() : Promise.resolve('undetermined'),
      request: (permission: string) => permission === 'notifications' ? craft.push.requestPermission() : Promise.resolve('undetermined'),
      openSettings: () => craft.push.openSettings().then(() => undefined),
    })
    protocol.on<{ token?: string }>('PUSH_TOKEN', ({ payload }) => {
      const token = String(payload?.token || '')
      if (!token) return
      tokenHandlers.forEach(handler => handler(token))
      if (typeof target.dispatchEvent === 'function' && typeof target.CustomEvent === 'function')
        target.dispatchEvent(new target.CustomEvent('craftPushToken', { detail: { token } }))
    })
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
      const answer = request('Network', 'fetch', [{ url, method, headers, body: body == null ? null : body, ...(form ? { form } : {}) }]).then((data: AnyRecord) => {
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
