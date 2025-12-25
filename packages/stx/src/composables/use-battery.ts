/**
 * useBattery - Battery Status API wrapper
 *
 * Monitor device battery status reactively.
 *
 * @example
 * ```ts
 * const battery = useBattery()
 * battery.subscribe(state => {
 *   console.log('Battery level:', state.level * 100 + '%')
 *   console.log('Charging:', state.charging)
 *   console.log('Time to full:', state.chargingTime)
 *   console.log('Time to empty:', state.dischargingTime)
 * })
 * ```
 */

export interface BatteryState {
  /** Whether the battery is currently charging */
  charging: boolean
  /** Time in seconds until the battery is fully charged (Infinity if not charging) */
  chargingTime: number
  /** Time in seconds until the battery is empty (Infinity if charging) */
  dischargingTime: number
  /** Battery level between 0 and 1 */
  level: number
}

export interface BatteryRef {
  /** Get current battery state */
  get: () => BatteryState
  /** Subscribe to battery state changes */
  subscribe: (fn: (state: BatteryState) => void) => () => void
  /** Check if Battery API is supported */
  isSupported: () => boolean
  /** Get battery level as percentage (0-100) */
  getPercentage: () => number
  /** Check if battery is low (below threshold) */
  isLow: (threshold?: number) => boolean
  /** Check if battery is critical (below 10%) */
  isCritical: () => boolean
}

interface BatteryManager extends EventTarget {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>
}

/**
 * Check if Battery API is supported
 */
function isBatterySupported(): boolean {
  return typeof navigator !== 'undefined' && 'getBattery' in navigator
}

/**
 * Create initial battery state
 */
function createInitialState(): BatteryState {
  return {
    charging: false,
    chargingTime: 0,
    dischargingTime: 0,
    level: 1,
  }
}

/**
 * Monitor battery status
 */
export function useBattery(): BatteryRef {
  const supported = isBatterySupported()

  let state: BatteryState = createInitialState()
  let listeners: Array<(state: BatteryState) => void> = []
  let battery: BatteryManager | null = null
  let initialized = false

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const updateState = () => {
    if (battery) {
      state = {
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
        level: battery.level,
      }
      notify()
    }
  }

  const init = async () => {
    if (initialized || !supported) return

    try {
      const nav = navigator as NavigatorWithBattery
      if (nav.getBattery) {
        battery = await nav.getBattery()

        // Update initial state
        state = {
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          level: battery.level,
        }

        // Listen for changes
        battery.addEventListener('chargingchange', updateState)
        battery.addEventListener('chargingtimechange', updateState)
        battery.addEventListener('dischargingtimechange', updateState)
        battery.addEventListener('levelchange', updateState)

        initialized = true
        notify()
      }
    }
    catch {
      // Battery API not available or permission denied
    }
  }

  const cleanup = () => {
    if (battery) {
      battery.removeEventListener('chargingchange', updateState)
      battery.removeEventListener('chargingtimechange', updateState)
      battery.removeEventListener('dischargingtimechange', updateState)
      battery.removeEventListener('levelchange', updateState)
      battery = null
    }
    initialized = false
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      if (listeners.length === 0) {
        init()
      }
      listeners.push(fn)
      fn(state)

      return () => {
        listeners = listeners.filter(l => l !== fn)
        if (listeners.length === 0) {
          cleanup()
        }
      }
    },
    isSupported: () => supported,
    getPercentage: () => Math.round(state.level * 100),
    isLow: (threshold = 0.2) => state.level <= threshold && !state.charging,
    isCritical: () => state.level <= 0.1 && !state.charging,
  }
}

/**
 * Get battery level as percentage
 */
export async function getBatteryLevel(): Promise<number | null> {
  if (!isBatterySupported()) return null

  try {
    const nav = navigator as NavigatorWithBattery
    if (nav.getBattery) {
      const battery = await nav.getBattery()
      return Math.round(battery.level * 100)
    }
  }
  catch {
    // Battery API not available
  }

  return null
}

/**
 * Check if device is charging
 */
export async function isCharging(): Promise<boolean | null> {
  if (!isBatterySupported()) return null

  try {
    const nav = navigator as NavigatorWithBattery
    if (nav.getBattery) {
      const battery = await nav.getBattery()
      return battery.charging
    }
  }
  catch {
    // Battery API not available
  }

  return null
}

/**
 * Check if Battery API is available
 */
export function hasBattery(): boolean {
  return isBatterySupported()
}
