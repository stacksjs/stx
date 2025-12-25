/**
 * useGeolocation - Reactive Geolocation API wrapper
 *
 * Provides easy access to the browser's Geolocation API with reactive state.
 *
 * @example
 * ```ts
 * const geo = useGeolocation()
 * geo.subscribe(state => {
 *   console.log(state.coords?.latitude, state.coords?.longitude)
 * })
 *
 * // Or get current position once
 * const position = await getCurrentPosition()
 * ```
 */

export interface GeolocationCoords {
  latitude: number
  longitude: number
  altitude: number | null
  accuracy: number
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
}

export interface GeolocationState {
  coords: GeolocationCoords | null
  timestamp: number | null
  error: GeolocationPositionError | null
  loading: boolean
  supported: boolean
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  immediate?: boolean
}

export interface GeolocationRef {
  get: () => GeolocationState
  subscribe: (fn: (state: GeolocationState) => void) => () => void
  refresh: () => void
  pause: () => void
  resume: () => void
}

/**
 * Get current position as a Promise
 */
export function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Reactive geolocation composable with watch support
 */
export function useGeolocation(options: GeolocationOptions = {}): GeolocationRef {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    immediate = true,
  } = options

  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  let state: GeolocationState = {
    coords: null,
    timestamp: null,
    error: null,
    loading: false,
    supported,
  }

  let listeners: Array<(state: GeolocationState) => void> = []
  let watchId: number | null = null
  let isActive = true

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const updatePosition = (position: GeolocationPosition) => {
    state = {
      ...state,
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
      },
      timestamp: position.timestamp,
      error: null,
      loading: false,
    }
    notify()
  }

  const handleError = (error: GeolocationPositionError) => {
    state = {
      ...state,
      error,
      loading: false,
    }
    notify()
  }

  const startWatch = () => {
    if (!supported || watchId !== null) return

    state = { ...state, loading: true }
    notify()

    watchId = navigator.geolocation.watchPosition(
      updatePosition,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    )
  }

  const stopWatch = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
  }

  const refresh = () => {
    if (!supported) return

    state = { ...state, loading: true }
    notify()

    navigator.geolocation.getCurrentPosition(
      updatePosition,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    )
  }

  const pause = () => {
    isActive = false
    stopWatch()
  }

  const resume = () => {
    isActive = true
    if (listeners.length > 0) {
      startWatch()
    }
  }

  // Start watching if immediate
  if (immediate && supported) {
    startWatch()
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      listeners.push(fn)
      fn(state)

      // Start watching when first subscriber
      if (listeners.length === 1 && isActive && supported && !immediate) {
        startWatch()
      }

      return () => {
        listeners = listeners.filter(l => l !== fn)
        // Stop watching when no subscribers
        if (listeners.length === 0) {
          stopWatch()
        }
      }
    },
    refresh,
    pause,
    resume,
  }
}

/**
 * Watch position changes (alias for useGeolocation with watch)
 */
export function useGeolocationWatch(options?: GeolocationOptions): GeolocationRef {
  return useGeolocation({ ...options, immediate: true })
}
