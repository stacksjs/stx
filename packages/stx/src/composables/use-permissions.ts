/**
 * usePermissions - Permissions API wrapper
 *
 * Query and monitor browser permission states for various APIs.
 *
 * @example
 * ```ts
 * // Check camera permission
 * const camera = usePermission('camera')
 * camera.subscribe(state => {
 *   console.log('Camera permission:', state.state) // 'granted', 'denied', 'prompt'
 * })
 *
 * // Check multiple permissions
 * const permissions = usePermissions(['camera', 'microphone', 'geolocation'])
 * permissions.subscribe(states => {
 *   console.log('Camera:', states.camera)
 *   console.log('Microphone:', states.microphone)
 * })
 * ```
 */

export type PermissionName =
  | 'accelerometer'
  | 'accessibility-events'
  | 'ambient-light-sensor'
  | 'background-fetch'
  | 'background-sync'
  | 'bluetooth'
  | 'camera'
  | 'clipboard-read'
  | 'clipboard-write'
  | 'device-info'
  | 'display-capture'
  | 'geolocation'
  | 'gyroscope'
  | 'magnetometer'
  | 'microphone'
  | 'midi'
  | 'nfc'
  | 'notifications'
  | 'payment-handler'
  | 'periodic-background-sync'
  | 'persistent-storage'
  | 'push'
  | 'screen-wake-lock'
  | 'speaker-selection'
  | 'storage-access'
  | 'window-management'
  | 'xr-spatial-tracking'

export type PermissionState = 'granted' | 'denied' | 'prompt'

export interface PermissionStatus {
  state: PermissionState
  isGranted: boolean
  isDenied: boolean
  isPrompt: boolean
}

export interface PermissionRef {
  /** Get current permission state */
  get: () => PermissionStatus
  /** Subscribe to permission changes */
  subscribe: (fn: (status: PermissionStatus) => void) => () => void
  /** Query permission (refresh state) */
  query: () => Promise<PermissionStatus>
  /** Check if Permissions API is supported */
  isSupported: () => boolean
}

export interface MultiPermissionRef {
  /** Get all permission states */
  get: () => Record<string, PermissionStatus>
  /** Subscribe to any permission change */
  subscribe: (fn: (states: Record<string, PermissionStatus>) => void) => () => void
  /** Query all permissions */
  queryAll: () => Promise<Record<string, PermissionStatus>>
  /** Check if Permissions API is supported */
  isSupported: () => boolean
}

/**
 * Create a PermissionStatus object from state
 */
function createStatus(state: PermissionState): PermissionStatus {
  return {
    state,
    isGranted: state === 'granted',
    isDenied: state === 'denied',
    isPrompt: state === 'prompt',
  }
}

/**
 * Check if Permissions API is supported
 */
function isPermissionsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'permissions' in navigator
}

/**
 * Query a single permission
 */
export function usePermission(name: PermissionName): PermissionRef {
  const supported = isPermissionsSupported()

  let status: PermissionStatus = createStatus('prompt')
  let listeners: Array<(status: PermissionStatus) => void> = []
  let permissionStatus: globalThis.PermissionStatus | null = null
  let cleanup: (() => void) | null = null

  const notify = () => {
    listeners.forEach(fn => fn(status))
  }

  const updateStatus = () => {
    if (permissionStatus) {
      status = createStatus(permissionStatus.state as PermissionState)
      notify()
    }
  }

  const query = async (): Promise<PermissionStatus> => {
    if (!supported) {
      return createStatus('prompt')
    }

    try {
      permissionStatus = await navigator.permissions.query({ name: name as globalThis.PermissionName })
      status = createStatus(permissionStatus.state as PermissionState)

      // Listen for changes
      permissionStatus.addEventListener('change', updateStatus)
      cleanup = () => {
        permissionStatus?.removeEventListener('change', updateStatus)
      }

      return status
    } catch {
      // Permission name not supported
      return createStatus('prompt')
    }
  }

  return {
    get: () => status,
    subscribe: (fn) => {
      if (listeners.length === 0 && supported) {
        query() // Initial query
      }
      listeners.push(fn)
      fn(status)

      return () => {
        listeners = listeners.filter(l => l !== fn)
        if (listeners.length === 0 && cleanup) {
          cleanup()
          cleanup = null
        }
      }
    },
    query,
    isSupported: () => supported,
  }
}

/**
 * Query multiple permissions at once
 */
export function usePermissions(names: PermissionName[]): MultiPermissionRef {
  const supported = isPermissionsSupported()

  let states: Record<string, PermissionStatus> = {}
  let listeners: Array<(states: Record<string, PermissionStatus>) => void> = []
  const permissionRefs: Record<string, PermissionRef> = {}
  const unsubscribers: (() => void)[] = []

  // Initialize states
  for (const name of names) {
    states[name] = createStatus('prompt')
    permissionRefs[name] = usePermission(name)
  }

  const notify = () => {
    listeners.forEach(fn => fn(states))
  }

  const queryAll = async (): Promise<Record<string, PermissionStatus>> => {
    const results = await Promise.all(
      names.map(async (name) => {
        const result = await permissionRefs[name].query()
        return [name, result] as const
      })
    )

    states = Object.fromEntries(results)
    return states
  }

  return {
    get: () => states,
    subscribe: (fn) => {
      if (listeners.length === 0) {
        // Subscribe to each permission
        for (const name of names) {
          const unsub = permissionRefs[name].subscribe((status) => {
            states[name] = status
            notify()
          })
          unsubscribers.push(unsub)
        }
      }
      listeners.push(fn)
      fn(states)

      return () => {
        listeners = listeners.filter(l => l !== fn)
        if (listeners.length === 0) {
          unsubscribers.forEach(unsub => unsub())
          unsubscribers.length = 0
        }
      }
    },
    queryAll,
    isSupported: () => supported,
  }
}

/**
 * Check if a permission is granted
 */
export async function isPermissionGranted(name: PermissionName): Promise<boolean> {
  const permission = usePermission(name)
  const status = await permission.query()
  return status.isGranted
}

/**
 * Check if camera permission is granted
 */
export async function hasCameraPermission(): Promise<boolean> {
  return isPermissionGranted('camera')
}

/**
 * Check if microphone permission is granted
 */
export async function hasMicrophonePermission(): Promise<boolean> {
  return isPermissionGranted('microphone')
}

/**
 * Check if geolocation permission is granted
 */
export async function hasGeolocationPermission(): Promise<boolean> {
  return isPermissionGranted('geolocation')
}

/**
 * Check if notifications permission is granted
 */
export async function hasNotificationPermission(): Promise<boolean> {
  return isPermissionGranted('notifications')
}

/**
 * Request camera and microphone permissions by accessing media
 */
export async function requestMediaPermissions(
  options: { video?: boolean; audio?: boolean } = { video: true, audio: true }
): Promise<{ granted: boolean; stream?: MediaStream; error?: Error }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return { granted: false, error: new Error('MediaDevices API not supported') }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(options)
    return { granted: true, stream }
  } catch (err) {
    return {
      granted: false,
      error: err instanceof Error ? err : new Error(String(err)),
    }
  }
}

/**
 * Common permission groups
 */
export const permissionGroups = {
  media: ['camera', 'microphone'] as PermissionName[],
  location: ['geolocation'] as PermissionName[],
  notifications: ['notifications', 'push'] as PermissionName[],
  sensors: ['accelerometer', 'gyroscope', 'magnetometer'] as PermissionName[],
  clipboard: ['clipboard-read', 'clipboard-write'] as PermissionName[],
}
