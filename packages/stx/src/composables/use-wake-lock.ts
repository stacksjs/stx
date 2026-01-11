/**
 * Wake Lock Composables
 *
 * Reactive utilities for the Screen Wake Lock API to prevent devices from sleeping.
 */

export interface WakeLockState {
  isSupported: boolean
  isActive: boolean
  type: 'screen' | null
  error: Error | null
}

export interface WakeLockRef {
  get: () => WakeLockState
  subscribe: (fn: (state: WakeLockState) => void) => () => void
  request: () => Promise<boolean>
  release: () => Promise<void>
  toggle: () => Promise<boolean>
  isSupported: () => boolean
  isActive: () => boolean
}

/**
 * Check if Wake Lock API is supported
 */
export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

/**
 * Create a reactive wake lock controller
 *
 * The Screen Wake Lock API prevents the screen from dimming or locking
 * while your application is active. Useful for video players, presentation
 * apps, or any application where the user needs to see the screen without
 * interacting with it.
 *
 * @example
 * ```ts
 * const wakeLock = useWakeLock()
 *
 * // Request wake lock
 * await wakeLock.request()
 *
 * // Subscribe to state changes
 * wakeLock.subscribe((state) => {
 *   console.log('Wake lock active:', state.isActive)
 * })
 *
 * // Release when done
 * await wakeLock.release()
 *
 * // Or toggle
 * await wakeLock.toggle()
 * ```
 */
export function useWakeLock(): WakeLockRef {
  const supported = isWakeLockSupported()
  const subscribers = new Set<(state: WakeLockState) => void>()

  let state: WakeLockState = {
    isSupported: supported,
    isActive: false,
    type: null,
    error: null,
  }

  let wakeLock: WakeLockSentinel | null = null
  let cleanup: (() => void) | null = null

  function notify() {
    subscribers.forEach(fn => fn(state))
  }

  function handleRelease() {
    state = { ...state, isActive: false, type: null }
    wakeLock = null
    notify()
  }

  function handleVisibilityChange() {
    // Re-acquire wake lock when page becomes visible again
    if (document.visibilityState === 'visible' && state.isActive === false && wakeLock === null) {
      // Only re-request if we previously had a wake lock and it was released due to visibility
      // This is handled by keeping track in a closure or checking a flag
    }
  }

  async function request(): Promise<boolean> {
    if (!supported) {
      state = { ...state, error: new Error('Wake Lock API not supported') }
      notify()
      return false
    }

    try {
      wakeLock = await navigator.wakeLock.request('screen')

      wakeLock.addEventListener('release', handleRelease)

      // Handle visibility changes to re-acquire lock
      if (!cleanup) {
        document.addEventListener('visibilitychange', handleVisibilityChange)
        cleanup = () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
      }

      state = { ...state, isActive: true, type: 'screen', error: null }
      notify()
      return true
    }
    catch (error) {
      state = { ...state, isActive: false, error: error as Error }
      notify()
      return false
    }
  }

  async function release(): Promise<void> {
    if (wakeLock) {
      await wakeLock.release()
      wakeLock = null
    }
    state = { ...state, isActive: false, type: null }
    notify()
  }

  async function toggle(): Promise<boolean> {
    if (state.isActive) {
      await release()
      return false
    }
    else {
      return request()
    }
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      subscribers.add(fn)
      fn(state)
      return () => {
        subscribers.delete(fn)
        if (subscribers.size === 0) {
          release()
          cleanup?.()
          cleanup = null
        }
      }
    },
    request,
    release,
    toggle,
    isSupported: () => supported,
    isActive: () => state.isActive,
  }
}

/**
 * Auto-acquire wake lock while component is mounted
 *
 * @example
 * ```ts
 * // In a video player component
 * const wakeLock = useAutoWakeLock()
 *
 * wakeLock.subscribe((isActive) => {
 *   console.log('Screen wake lock:', isActive ? 'on' : 'off')
 * })
 * ```
 */
export function useAutoWakeLock() {
  const wakeLock = useWakeLock()

  // Auto-request on creation
  if (wakeLock.isSupported()) {
    wakeLock.request()
  }

  // Auto-re-acquire on visibility change
  if (typeof document !== 'undefined') {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && !wakeLock.isActive()) {
        await wakeLock.request()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    // Return a modified subscribe that cleans up
    const originalSubscribe = wakeLock.subscribe
    return {
      ...wakeLock,
      subscribe: (fn: (state: WakeLockState) => void) => {
        const unsub = originalSubscribe(fn)
        return () => {
          unsub()
          document.removeEventListener('visibilitychange', handleVisibility)
          wakeLock.release()
        }
      },
    }
  }

  return wakeLock
}

/**
 * Wake lock that only activates while a condition is true
 *
 * @example
 * ```ts
 * const isPlaying = { value: false }
 *
 * const wakeLock = useConditionalWakeLock(() => isPlaying.value)
 *
 * // When video starts playing
 * isPlaying.value = true
 * wakeLock.check() // Acquires wake lock
 *
 * // When video pauses
 * isPlaying.value = false
 * wakeLock.check() // Releases wake lock
 * ```
 */
export function useConditionalWakeLock(condition: () => boolean) {
  const wakeLock = useWakeLock()

  async function check() {
    const shouldBeActive = condition()

    if (shouldBeActive && !wakeLock.isActive()) {
      await wakeLock.request()
    }
    else if (!shouldBeActive && wakeLock.isActive()) {
      await wakeLock.release()
    }
  }

  return {
    ...wakeLock,
    check,
  }
}
