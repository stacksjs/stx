/**
 * useNetwork - Reactive network status composables
 *
 * Provides reactive tracking of network connectivity and information.
 */

export interface NetworkState {
  /** Whether the browser is online */
  isOnline: boolean
  /** Whether the browser is offline */
  isOffline: boolean
  /** Connection type (if available) */
  type: string | null
  /** Effective connection type (if available) */
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | null
  /** Downlink speed in Mbps (if available) */
  downlink: number | null
  /** Round-trip time in ms (if available) */
  rtt: number | null
  /** Whether data saver is enabled (if available) */
  saveData: boolean
}

export interface NetworkRef extends NetworkState {
  /** Subscribe to changes */
  subscribe: (callback: (state: NetworkState) => void) => () => void
}

/**
 * Create a reactive network status tracker
 *
 * @example
 * ```ts
 * const network = useNetwork()
 *
 * network.subscribe((state) => {
 *   if (state.isOffline) {
 *     showOfflineMessage()
 *   }
 * })
 *
 * if (network.effectiveType === '2g') {
 *   loadLowQualityImages()
 * }
 * ```
 */
export function useNetwork(): NetworkRef {
  const subscribers = new Set<(state: NetworkState) => void>()
  const isClient = typeof window !== 'undefined'

  const getConnection = (): NetworkInformation | null => {
    if (!isClient) return null
    return (navigator as Navigator & { connection?: NetworkInformation }).connection || null
  }

  const getState = (): NetworkState => {
    if (!isClient) {
      return {
        isOnline: true,
        isOffline: false,
        type: null,
        effectiveType: null,
        downlink: null,
        rtt: null,
        saveData: false,
      }
    }

    const connection = getConnection()

    return {
      isOnline: navigator.onLine,
      isOffline: !navigator.onLine,
      type: connection?.type || null,
      effectiveType: connection?.effectiveType || null,
      downlink: connection?.downlink || null,
      rtt: connection?.rtt || null,
      saveData: connection?.saveData || false,
    }
  }

  let currentState = getState()

  const notify = () => {
    const newState = getState()
    currentState = newState
    for (const callback of subscribers) {
      try {
        callback(newState)
      } catch (e) {
        console.error('[useNetwork] Subscriber error:', e)
      }
    }
  }

  if (isClient) {
    window.addEventListener('online', notify)
    window.addEventListener('offline', notify)

    const connection = getConnection()
    if (connection) {
      connection.addEventListener('change', notify)
    }
  }

  return {
    get isOnline() { return currentState.isOnline },
    get isOffline() { return currentState.isOffline },
    get type() { return currentState.type },
    get effectiveType() { return currentState.effectiveType },
    get downlink() { return currentState.downlink },
    get rtt() { return currentState.rtt },
    get saveData() { return currentState.saveData },
    subscribe: (callback) => {
      subscribers.add(callback)
      callback(currentState)
      return () => subscribers.delete(callback)
    },
  }
}

/**
 * Simple online/offline tracker
 */
export function useOnline(): { isOnline: boolean; subscribe: (cb: (online: boolean) => void) => () => void } {
  const network = useNetwork()
  return {
    get isOnline() { return network.isOnline },
    subscribe: (callback) => {
      return network.subscribe((state) => callback(state.isOnline))
    },
  }
}

// Type for Network Information API
interface NetworkInformation extends EventTarget {
  type?: string
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
  downlink?: number
  rtt?: number
  saveData?: boolean
}
