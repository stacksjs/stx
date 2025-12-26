/**
 * Device Orientation & Motion Composables
 *
 * Reactive utilities for device orientation and motion sensors.
 */

export interface DeviceOrientationState {
  isSupported: boolean
  isAbsolute: boolean
  /** Rotation around Z axis (0-360 degrees) - compass direction */
  alpha: number | null
  /** Rotation around X axis (-180 to 180 degrees) - front/back tilt */
  beta: number | null
  /** Rotation around Y axis (-90 to 90 degrees) - left/right tilt */
  gamma: number | null
}

export interface DeviceMotionState {
  isSupported: boolean
  acceleration: {
    x: number | null
    y: number | null
    z: number | null
  }
  accelerationIncludingGravity: {
    x: number | null
    y: number | null
    z: number | null
  }
  rotationRate: {
    alpha: number | null
    beta: number | null
    gamma: number | null
  }
  interval: number
}

export interface DeviceOrientationRef {
  get: () => DeviceOrientationState
  subscribe: (fn: (state: DeviceOrientationState) => void) => () => void
  isSupported: () => boolean
  requestPermission: () => Promise<boolean>
}

export interface DeviceMotionRef {
  get: () => DeviceMotionState
  subscribe: (fn: (state: DeviceMotionState) => void) => () => void
  isSupported: () => boolean
  requestPermission: () => Promise<boolean>
}

/**
 * Check if DeviceOrientation is supported
 */
export function isDeviceOrientationSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
}

/**
 * Check if DeviceMotion is supported
 */
export function isDeviceMotionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window
}

/**
 * Request permission for device orientation (required on iOS 13+)
 */
export async function requestOrientationPermission(): Promise<boolean> {
  if (typeof window === 'undefined')
    return false

  // Check if permission API exists (iOS 13+)
  const DeviceOrientationEvent = window.DeviceOrientationEvent as typeof window.DeviceOrientationEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>
  }

  if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission()
      return permission === 'granted'
    }
    catch {
      return false
    }
  }

  // No permission needed on other platforms
  return true
}

/**
 * Request permission for device motion (required on iOS 13+)
 */
export async function requestMotionPermission(): Promise<boolean> {
  if (typeof window === 'undefined')
    return false

  const DeviceMotionEvent = window.DeviceMotionEvent as typeof window.DeviceMotionEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>
  }

  if (typeof DeviceMotionEvent?.requestPermission === 'function') {
    try {
      const permission = await DeviceMotionEvent.requestPermission()
      return permission === 'granted'
    }
    catch {
      return false
    }
  }

  return true
}

/**
 * Create a reactive device orientation tracker
 *
 * @example
 * ```ts
 * const orientation = useDeviceOrientation()
 *
 * // Request permission first (required on iOS)
 * await orientation.requestPermission()
 *
 * // Subscribe to orientation changes
 * orientation.subscribe((state) => {
 *   console.log('Alpha (compass):', state.alpha)
 *   console.log('Beta (front/back):', state.beta)
 *   console.log('Gamma (left/right):', state.gamma)
 * })
 * ```
 */
export function useDeviceOrientation(): DeviceOrientationRef {
  const supported = isDeviceOrientationSupported()
  const subscribers = new Set<(state: DeviceOrientationState) => void>()

  let state: DeviceOrientationState = {
    isSupported: supported,
    isAbsolute: false,
    alpha: null,
    beta: null,
    gamma: null,
  }

  let cleanup: (() => void) | null = null

  function notify() {
    subscribers.forEach(fn => fn(state))
  }

  function handleOrientation(event: DeviceOrientationEvent) {
    state = {
      ...state,
      isAbsolute: event.absolute,
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
    }
    notify()
  }

  function startListening() {
    if (!supported || cleanup)
      return

    window.addEventListener('deviceorientation', handleOrientation, true)
    cleanup = () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }

  function stopListening() {
    cleanup?.()
    cleanup = null
  }

  async function requestPermission(): Promise<boolean> {
    const granted = await requestOrientationPermission()
    if (granted) {
      startListening()
    }
    return granted
  }

  // Start immediately if permission not required
  if (supported) {
    startListening()
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      subscribers.add(fn)
      fn(state)
      return () => {
        subscribers.delete(fn)
        if (subscribers.size === 0) {
          stopListening()
        }
      }
    },
    isSupported: () => supported,
    requestPermission,
  }
}

/**
 * Create a reactive device motion tracker
 *
 * @example
 * ```ts
 * const motion = useDeviceMotion()
 *
 * // Request permission first (required on iOS)
 * await motion.requestPermission()
 *
 * // Subscribe to motion changes
 * motion.subscribe((state) => {
 *   console.log('Acceleration:', state.acceleration)
 *   console.log('Rotation rate:', state.rotationRate)
 * })
 * ```
 */
export function useDeviceMotion(): DeviceMotionRef {
  const supported = isDeviceMotionSupported()
  const subscribers = new Set<(state: DeviceMotionState) => void>()

  let state: DeviceMotionState = {
    isSupported: supported,
    acceleration: { x: null, y: null, z: null },
    accelerationIncludingGravity: { x: null, y: null, z: null },
    rotationRate: { alpha: null, beta: null, gamma: null },
    interval: 0,
  }

  let cleanup: (() => void) | null = null

  function notify() {
    subscribers.forEach(fn => fn(state))
  }

  function handleMotion(event: DeviceMotionEvent) {
    state = {
      ...state,
      acceleration: {
        x: event.acceleration?.x ?? null,
        y: event.acceleration?.y ?? null,
        z: event.acceleration?.z ?? null,
      },
      accelerationIncludingGravity: {
        x: event.accelerationIncludingGravity?.x ?? null,
        y: event.accelerationIncludingGravity?.y ?? null,
        z: event.accelerationIncludingGravity?.z ?? null,
      },
      rotationRate: {
        alpha: event.rotationRate?.alpha ?? null,
        beta: event.rotationRate?.beta ?? null,
        gamma: event.rotationRate?.gamma ?? null,
      },
      interval: event.interval,
    }
    notify()
  }

  function startListening() {
    if (!supported || cleanup)
      return

    window.addEventListener('devicemotion', handleMotion, true)
    cleanup = () => {
      window.removeEventListener('devicemotion', handleMotion, true)
    }
  }

  function stopListening() {
    cleanup?.()
    cleanup = null
  }

  async function requestPermission(): Promise<boolean> {
    const granted = await requestMotionPermission()
    if (granted) {
      startListening()
    }
    return granted
  }

  // Start immediately if permission not required
  if (supported) {
    startListening()
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      subscribers.add(fn)
      fn(state)
      return () => {
        subscribers.delete(fn)
        if (subscribers.size === 0) {
          stopListening()
        }
      }
    },
    isSupported: () => supported,
    requestPermission,
  }
}

/**
 * Simple tilt detection for parallax effects
 *
 * @example
 * ```ts
 * const tilt = useParallax()
 *
 * tilt.subscribe(({ x, y }) => {
 *   element.style.transform = `translate(${x * 10}px, ${y * 10}px)`
 * })
 * ```
 */
export function useParallax() {
  const orientation = useDeviceOrientation()
  const subscribers = new Set<(state: { x: number, y: number }) => void>()

  let tilt = { x: 0, y: 0 }

  orientation.subscribe((state) => {
    if (state.gamma !== null && state.beta !== null) {
      // Normalize to -1 to 1 range
      tilt = {
        x: Math.max(-1, Math.min(1, (state.gamma || 0) / 45)),
        y: Math.max(-1, Math.min(1, (state.beta || 0) / 45)),
      }
      subscribers.forEach(fn => fn(tilt))
    }
  })

  return {
    get: () => tilt,
    subscribe: (fn: (state: { x: number, y: number }) => void) => {
      subscribers.add(fn)
      fn(tilt)
      return () => {
        subscribers.delete(fn)
      }
    },
    isSupported: orientation.isSupported,
    requestPermission: orientation.requestPermission,
  }
}
