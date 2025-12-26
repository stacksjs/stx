/**
 * Idle Detection Composables
 *
 * Reactive utilities for detecting user idle state and activity.
 */

export interface IdleState {
  isIdle: boolean
  lastActive: number
  idleTime: number
}

export interface IdleOptions {
  /**
   * Time in milliseconds before considered idle
   * @default 60000 (1 minute)
   */
  timeout?: number
  /**
   * Events to listen for as activity
   * @default ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
   */
  events?: string[]
  /**
   * Element to listen for events on
   * @default document
   */
  listenTo?: EventTarget
  /**
   * Initial idle state
   * @default false
   */
  initialState?: boolean
  /**
   * Called when user becomes idle
   */
  onIdle?: () => void
  /**
   * Called when user becomes active
   */
  onActive?: () => void
}

export interface IdleRef {
  get: () => IdleState
  subscribe: (fn: (state: IdleState) => void) => () => void
  reset: () => void
  isIdle: () => boolean
}

const DEFAULT_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
  'resize',
  'visibilitychange',
]

/**
 * Create a reactive idle detector
 *
 * @example
 * ```ts
 * const idle = useIdle({
 *   timeout: 30000, // 30 seconds
 *   onIdle: () => console.log('User is idle'),
 *   onActive: () => console.log('User is active'),
 * })
 *
 * // Subscribe to idle state changes
 * idle.subscribe((state) => {
 *   console.log('Is idle:', state.isIdle)
 *   console.log('Idle for:', state.idleTime, 'ms')
 * })
 *
 * // Manually reset the idle timer
 * idle.reset()
 * ```
 */
export function useIdle(options: IdleOptions = {}): IdleRef {
  const {
    timeout = 60000,
    events = DEFAULT_EVENTS,
    listenTo = typeof document !== 'undefined' ? document : null,
    initialState = false,
    onIdle,
    onActive,
  } = options

  const subscribers = new Set<(state: IdleState) => void>()

  let state: IdleState = {
    isIdle: initialState,
    lastActive: Date.now(),
    idleTime: 0,
  }

  let idleTimer: ReturnType<typeof setTimeout> | null = null
  let idleTimeInterval: ReturnType<typeof setInterval> | null = null
  let cleanup: (() => void) | null = null

  function notify() {
    subscribers.forEach(fn => fn(state))
  }

  function setIdle(isIdle: boolean) {
    const wasIdle = state.isIdle

    if (isIdle && !wasIdle) {
      state = { ...state, isIdle: true }
      notify()
      onIdle?.()

      // Start tracking idle time
      idleTimeInterval = setInterval(() => {
        state = { ...state, idleTime: Date.now() - state.lastActive }
        notify()
      }, 1000)
    }
    else if (!isIdle && wasIdle) {
      state = {
        ...state,
        isIdle: false,
        lastActive: Date.now(),
        idleTime: 0,
      }
      notify()
      onActive?.()

      // Stop tracking idle time
      if (idleTimeInterval) {
        clearInterval(idleTimeInterval)
        idleTimeInterval = null
      }
    }
  }

  function resetTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer)
    }

    // Update last active time
    if (!state.isIdle) {
      state = { ...state, lastActive: Date.now() }
    }

    setIdle(false)

    idleTimer = setTimeout(() => {
      setIdle(true)
    }, timeout)
  }

  function handleActivity() {
    resetTimer()
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      // Treat tab hidden as idle-like state
      if (idleTimer) {
        clearTimeout(idleTimer)
      }
      // Set idle after a short delay when tab is hidden
      idleTimer = setTimeout(() => {
        setIdle(true)
      }, Math.min(timeout, 5000))
    }
    else {
      resetTimer()
    }
  }

  function startListening() {
    if (!listenTo || cleanup)
      return

    const handlers: Array<[string, EventListener]> = []

    for (const event of events) {
      const handler = event === 'visibilitychange' ? handleVisibilityChange : handleActivity
      listenTo.addEventListener(event, handler, { passive: true })
      handlers.push([event, handler])
    }

    // Start initial timer
    resetTimer()

    cleanup = () => {
      for (const [event, handler] of handlers) {
        listenTo.removeEventListener(event, handler)
      }
      if (idleTimer) {
        clearTimeout(idleTimer)
        idleTimer = null
      }
      if (idleTimeInterval) {
        clearInterval(idleTimeInterval)
        idleTimeInterval = null
      }
    }
  }

  function stopListening() {
    cleanup?.()
    cleanup = null
  }

  function reset() {
    resetTimer()
  }

  // Start listening
  if (typeof document !== 'undefined') {
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
    reset,
    isIdle: () => state.isIdle,
  }
}

/**
 * Simple boolean idle state
 *
 * @example
 * ```ts
 * const isIdle = useIdleState(30000) // 30 seconds
 *
 * isIdle.subscribe((idle) => {
 *   console.log('User idle:', idle)
 * })
 * ```
 */
export function useIdleState(timeout = 60000) {
  const idle = useIdle({ timeout })

  return {
    get: () => idle.get().isIdle,
    subscribe: (fn: (isIdle: boolean) => void) => {
      return idle.subscribe((state) => fn(state.isIdle))
    },
    reset: idle.reset,
  }
}

/**
 * Track user's last active timestamp
 *
 * @example
 * ```ts
 * const lastActive = useLastActive()
 *
 * lastActive.subscribe((timestamp) => {
 *   console.log('Last active:', new Date(timestamp))
 * })
 * ```
 */
export function useLastActive() {
  const idle = useIdle({ timeout: Number.POSITIVE_INFINITY })

  return {
    get: () => idle.get().lastActive,
    subscribe: (fn: (timestamp: number) => void) => {
      return idle.subscribe((state) => fn(state.lastActive))
    },
    reset: idle.reset,
  }
}

/**
 * Auto-logout after idle timeout
 *
 * @example
 * ```ts
 * useAutoLogout(5 * 60 * 1000, () => {
 *   // Logout user after 5 minutes of inactivity
 *   window.location.href = '/logout'
 * })
 * ```
 */
export function useAutoLogout(
  timeout: number,
  onLogout: () => void,
  options: { warningTime?: number, onWarning?: (remainingTime: number) => void } = {},
) {
  const { warningTime = 30000, onWarning } = options

  let warningInterval: ReturnType<typeof setInterval> | null = null
  let warningStarted = false

  const idle = useIdle({
    timeout: timeout - warningTime,
    onIdle: () => {
      if (onWarning) {
        warningStarted = true
        let remaining = warningTime

        onWarning(remaining)

        warningInterval = setInterval(() => {
          remaining -= 1000
          if (remaining <= 0) {
            if (warningInterval) {
              clearInterval(warningInterval)
              warningInterval = null
            }
            onLogout()
          }
          else {
            onWarning(remaining)
          }
        }, 1000)
      }
      else {
        setTimeout(onLogout, warningTime)
      }
    },
    onActive: () => {
      if (warningStarted) {
        warningStarted = false
        if (warningInterval) {
          clearInterval(warningInterval)
          warningInterval = null
        }
      }
    },
  })

  return {
    reset: idle.reset,
    get: idle.get,
    subscribe: idle.subscribe,
  }
}
