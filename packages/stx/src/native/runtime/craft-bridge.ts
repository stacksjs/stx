import type { AppStatePayload, DeepLinkPayload, NativeBridgeInterface } from '../bridge/protocol'
import { STXBridge } from '../bridge/protocol'

type AnyRecord = Record<string, any>

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
  }
}

/** Install the Craft capability surface on top of the shared typed bridge. */
export function installCraftBridge(
  protocol: STXBridge,
  nativeBridge: NativeBridgeInterface,
  target: AnyRecord = globalThis as AnyRecord,
): AnyRecord {
  const craft: AnyRecord = target.craft = target.craft || {}
  const capabilities = new Set(nativeBridge.capabilities || [])
  const request = (module: string, method: string, args: unknown[]): Promise<any> =>
    protocol.callNativeAPI(module, method, ...args)
  let appState = nativeBridge.initialAppState || 'active'
  let initialDeepLinkClaimed = false
  const appStateHandlers = new Set<(state: string) => unknown>()
  const deepLinkHandlers = new Set<(link: DeepLinkPayload) => unknown>()

  craft.platform = nativeBridge.platform || 'unknown'
  craft.capabilityProtocolVersion = Number(nativeBridge.capabilityProtocolVersion || 0)
  craft.capabilities = capabilityFlags(capabilities)
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
  craft.snapshots = Object.assign({ get: () => null, set: () => Promise.resolve(false) }, craft.snapshots || {})
  craft.biometrics = {
    isAvailable: () => request('Biometrics', 'isAvailable', []),
    getBiometricType: () => request('Biometrics', 'getBiometricType', []),
    authenticate: (reason?: string) => request('Biometrics', 'authenticate', [reason || 'Authenticate to continue']),
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
  craft.scheduleNotification = craft.notifications.schedule
  craft.cancelNotification = craft.notifications.cancel
  craft.cancelAllNotifications = craft.notifications.cancelAll
  craft.getPendingNotifications = craft.notifications.pending

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

  return craft
}
