/**
 * useFullscreen - Reactive Fullscreen API wrapper
 *
 * Control fullscreen mode for elements or the entire document.
 *
 * @example
 * ```ts
 * // Document fullscreen
 * const { isFullscreen, toggle, enter, exit } = useFullscreen()
 *
 * // Element fullscreen
 * const { isFullscreen, toggle } = useFullscreen(videoElement)
 *
 * // With keyboard shortcut
 * useHotkey('f', () => toggle())
 * ```
 */

export interface FullscreenState {
  isFullscreen: boolean
  isSupported: boolean
  element: Element | null
}

export interface FullscreenOptions {
  /** Navigation UI preference */
  navigationUI?: 'auto' | 'hide' | 'show'
  /** Auto exit on escape (browser default, can't be disabled) */
  autoExit?: boolean
}

export interface FullscreenRef {
  /** Get current fullscreen state */
  get: () => FullscreenState
  /** Subscribe to fullscreen changes */
  subscribe: (fn: (state: FullscreenState) => void) => () => void
  /** Check if currently fullscreen */
  isFullscreen: () => boolean
  /** Check if fullscreen is supported */
  isSupported: () => boolean
  /** Enter fullscreen mode */
  enter: () => Promise<void>
  /** Exit fullscreen mode */
  exit: () => Promise<void>
  /** Toggle fullscreen mode */
  toggle: () => Promise<void>
}

/**
 * Get the fullscreen element (cross-browser)
 */
function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    null
  )
}

/**
 * Check if fullscreen is supported
 */
function isFullscreenSupported(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  )
}

/**
 * Request fullscreen (cross-browser)
 */
async function requestFullscreen(element: Element, options?: FullscreenOptions): Promise<void> {
  const opts = options?.navigationUI ? { navigationUI: options.navigationUI } : undefined

  if (element.requestFullscreen) {
    await element.requestFullscreen(opts)
  } else if ((element as any).webkitRequestFullscreen) {
    await (element as any).webkitRequestFullscreen()
  } else if ((element as any).mozRequestFullScreen) {
    await (element as any).mozRequestFullScreen()
  } else if ((element as any).msRequestFullscreen) {
    await (element as any).msRequestFullscreen()
  }
}

/**
 * Exit fullscreen (cross-browser)
 */
async function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) {
    await document.exitFullscreen()
  } else if ((document as any).webkitExitFullscreen) {
    await (document as any).webkitExitFullscreen()
  } else if ((document as any).mozCancelFullScreen) {
    await (document as any).mozCancelFullScreen()
  } else if ((document as any).msExitFullscreen) {
    await (document as any).msExitFullscreen()
  }
}

/**
 * Reactive fullscreen controller
 */
export function useFullscreen(
  target?: Element | (() => Element | null) | null,
  options: FullscreenOptions = {}
): FullscreenRef {
  const supported = typeof document !== 'undefined' && isFullscreenSupported()

  let state: FullscreenState = {
    isFullscreen: false,
    isSupported: supported,
    element: null,
  }

  let listeners: Array<(state: FullscreenState) => void> = []
  let cleanup: (() => void) | null = null

  const getElement = (): Element => {
    if (!target) return document.documentElement
    if (typeof target === 'function') return target() || document.documentElement
    return target
  }

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const updateState = () => {
    const fullscreenElement = getFullscreenElement()
    state = {
      ...state,
      isFullscreen: !!fullscreenElement,
      element: fullscreenElement,
    }
    notify()
  }

  const setupListeners = () => {
    if (typeof document === 'undefined') return

    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ]

    for (const event of events) {
      document.addEventListener(event, updateState)
    }

    cleanup = () => {
      for (const event of events) {
        document.removeEventListener(event, updateState)
      }
    }

    // Initialize state
    updateState()
  }

  const enter = async (): Promise<void> => {
    if (!supported) return
    const element = getElement()
    await requestFullscreen(element, options)
  }

  const exit = async (): Promise<void> => {
    if (!supported) return
    if (getFullscreenElement()) {
      await exitFullscreen()
    }
  }

  const toggle = async (): Promise<void> => {
    if (state.isFullscreen) {
      await exit()
    } else {
      await enter()
    }
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      if (listeners.length === 0) {
        setupListeners()
      }
      listeners.push(fn)
      fn(state)

      return () => {
        listeners = listeners.filter(l => l !== fn)
        if (listeners.length === 0 && cleanup) {
          cleanup()
          cleanup = null
        }
      }
    },
    isFullscreen: () => state.isFullscreen,
    isSupported: () => state.isSupported,
    enter,
    exit,
    toggle,
  }
}

/**
 * Simple fullscreen toggle for document
 */
export function toggleFullscreen(): Promise<void> {
  const fs = useFullscreen()
  return fs.toggle()
}

/**
 * Check if currently in fullscreen mode
 */
export function isInFullscreen(): boolean {
  return !!getFullscreenElement()
}
