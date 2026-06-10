/**
 * Geolocation (CoreLocation on macOS).
 *
 * Apps that need higher-than-browser-grade accuracy use this module —
 * the macOS native path delivers GPS/WiFi-positioning samples directly
 * from `CLLocationManager`. Browser fallback uses the standard
 * `navigator.geolocation` API, which is good enough for "what city
 * am I in" but not for navigation-grade tracking.
 *
 * **Required Info.plist keys** for the permission prompt:
 *   - `NSLocationWhenInUseUsageDescription` — when in use only
 *   - `NSLocationAlwaysAndWhenInUseUsageDescription` — background access
 */
import { hasBridge, onCraftEvent } from './_bridge'

export type LocationAuthStatus = 
| 'undetermined'
| 'restricted-or-denied'
| 'authorizedAlways'
| 'authorizedWhenInUse'
| 'not-supported'
| 'unknown'

export interface LocationCoordinate {
  latitude: number
  longitude: number
  altitude?: number
  /** Horizontal accuracy in meters. Negative = invalid. */
  horizontalAccuracy?: number
  verticalAccuracy?: number
  /** Speed in m/s. Negative = invalid. */
  speed?: number
}

export interface LocationWatchOptions {
  /** `'continuous'` (high accuracy, more battery) or `'significant'`. */
  mode?: 'continuous' | 'significant'
  /** Distance in meters between updates. */
  distanceFilter?: number
}

export interface LocationAPI {
  /** Trigger the system permission prompt. */
  requestPermission: (mode?: 'whenInUse' | 'always') => Promise<LocationAuthStatus>
  /** Read current authorization status without prompting. */
  getAuthorization: () => Promise<LocationAuthStatus>
  /**
   * Request a single location sample. The result arrives via `onUpdate`,
   * not as the resolution value of this call (CoreLocation is async).
   */
  getCurrentLocation: () => Promise<{ requested: boolean }>
  /** Start streaming updates via `onUpdate`. */
  startWatching: (options?: LocationWatchOptions) => Promise<boolean>
  /** Stop the update stream. */
  stopWatching: () => Promise<void>
  /** Subscribe to location samples. */
  onUpdate: (cb: (loc: LocationCoordinate) => void) => () => void
  /** Subscribe to errors (e.g. denied, location unavailable). */
  onError: (cb: (err: { message: string }) => void) => () => void
  /** Subscribe to authorization-status changes. */
  onAuthChanged: (cb: (info: { status: LocationAuthStatus }) => void) => () => void
}

export const location: LocationAPI = {
  async requestPermission(mode = 'whenInUse') {
    if (hasBridge('location')) return await window.craft!.location.requestPermission(mode)
    if (typeof navigator !== 'undefined' && (navigator as any).geolocation) {
      // Browser geolocation prompts implicitly on the first
      // getCurrentPosition() call — there's no separate request API.
      return 'undetermined'
    }
    return 'not-supported'
  },
  async getAuthorization() {
    if (hasBridge('location')) return await window.craft!.location.getAuthorization()
    return 'unknown'
  },
  async getCurrentLocation() {
    if (hasBridge('location')) return await window.craft!.location.getCurrentLocation()
    // Web fallback: kick off navigator.geolocation.getCurrentPosition,
    // and synthesize a `craft:location:update` event so apps that
    // subscribe via `onUpdate` see the result through the same channel.
    if (typeof navigator !== 'undefined' && (navigator as any).geolocation) {
      ;(navigator as any).geolocation.getCurrentPosition(
        (pos: any) => {
          window.dispatchEvent(new CustomEvent('craft:location:update', {
            detail: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              altitude: pos.coords.altitude,
              horizontalAccuracy: pos.coords.accuracy,
              verticalAccuracy: pos.coords.altitudeAccuracy,
              speed: pos.coords.speed,
            },
          }))
        },
        (err: any) => {
          window.dispatchEvent(new CustomEvent('craft:location:error', {
            detail: { message: err.message || String(err) },
          }))
        },
      )
      return { requested: true }
    }
    return { requested: false }
  },
  async startWatching(options) {
    if (hasBridge('location')) return await window.craft!.location.startWatching(options)
    if (typeof navigator !== 'undefined' && (navigator as any).geolocation) {
      const watchId = (navigator as any).geolocation.watchPosition(
        (pos: any) => {
          window.dispatchEvent(new CustomEvent('craft:location:update', {
            detail: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              altitude: pos.coords.altitude,
              horizontalAccuracy: pos.coords.accuracy,
              verticalAccuracy: pos.coords.altitudeAccuracy,
              speed: pos.coords.speed,
            },
          }))
        },
      )
      ;(window as any).__craftWebLocationWatchId = watchId
      return true
    }
    return false
  },
  async stopWatching() {
    if (hasBridge('location')) {
      await window.craft!.location.stopWatching()
      return
    }
    if (typeof navigator !== 'undefined' && (navigator as any).geolocation) {
      const id = (window as any).__craftWebLocationWatchId
      if (id != null) {
        ;(navigator as any).geolocation.clearWatch(id)
        ;(window as any).__craftWebLocationWatchId = null
      }
    }
  },
  onUpdate(cb) { return onCraftEvent<LocationCoordinate>('craft:location:update', cb) },
  onError(cb) { return onCraftEvent<{ message: string }>('craft:location:error', cb) },
  onAuthChanged(cb) { return onCraftEvent<{ status: LocationAuthStatus }>('craft:location:authChanged', cb) },
}
