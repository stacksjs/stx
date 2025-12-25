/**
 * useMouse - Reactive mouse/pointer position tracking
 *
 * Track mouse position, movement, and button states.
 *
 * @example
 * ```ts
 * const mouse = useMouse()
 * mouse.subscribe(state => {
 *   console.log(`Mouse at ${state.x}, ${state.y}`)
 * })
 *
 * // Track within a specific element
 * const elementMouse = useMouseInElement(myElement)
 * ```
 */

export interface MouseState {
  x: number
  y: number
  pageX: number
  pageY: number
  clientX: number
  clientY: number
  movementX: number
  movementY: number
  buttons: number
  isPressed: boolean
  isInside: boolean
}

export interface MouseOptions {
  /** Target element (default: window) */
  target?: Window | HTMLElement | null
  /** Track touch events as mouse */
  touch?: boolean
  /** Reset to 0,0 when pointer leaves */
  resetOnLeave?: boolean
  /** Event type: 'page', 'client', 'screen', 'movement' */
  type?: 'page' | 'client' | 'screen' | 'movement'
}

export interface MouseRef {
  get: () => MouseState
  subscribe: (fn: (state: MouseState) => void) => () => void
  stop: () => void
}

export interface ElementMouseState extends MouseState {
  elementX: number
  elementY: number
  elementWidth: number
  elementHeight: number
  isOutside: boolean
}

export interface ElementMouseRef {
  get: () => ElementMouseState
  subscribe: (fn: (state: ElementMouseState) => void) => () => void
  stop: () => void
}

/**
 * Track mouse position globally or within a target
 */
export function useMouse(options: MouseOptions = {}): MouseRef {
  const {
    target = typeof window !== 'undefined' ? window : null,
    touch = true,
    resetOnLeave = false,
  } = options

  let state: MouseState = {
    x: 0,
    y: 0,
    pageX: 0,
    pageY: 0,
    clientX: 0,
    clientY: 0,
    movementX: 0,
    movementY: 0,
    buttons: 0,
    isPressed: false,
    isInside: false,
  }

  let listeners: Array<(state: MouseState) => void> = []
  let cleanup: (() => void) | null = null

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const handleMove = (event: MouseEvent | Touch, isTouch = false) => {
    const e = event as MouseEvent
    state = {
      x: e.pageX ?? e.clientX,
      y: e.pageY ?? e.clientY,
      pageX: e.pageX ?? 0,
      pageY: e.pageY ?? 0,
      clientX: e.clientX ?? 0,
      clientY: e.clientY ?? 0,
      movementX: isTouch ? 0 : (e.movementX ?? 0),
      movementY: isTouch ? 0 : (e.movementY ?? 0),
      buttons: isTouch ? 1 : (e.buttons ?? 0),
      isPressed: isTouch || (e.buttons ?? 0) > 0,
      isInside: true,
    }
    notify()
  }

  const handleMouseMove = (e: MouseEvent) => handleMove(e)
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0], true)
    }
  }

  const handleMouseDown = (e: MouseEvent) => {
    state = { ...state, buttons: e.buttons, isPressed: true }
    notify()
  }

  const handleMouseUp = (e: MouseEvent) => {
    state = { ...state, buttons: e.buttons, isPressed: false }
    notify()
  }

  const handleEnter = () => {
    state = { ...state, isInside: true }
    notify()
  }

  const handleLeave = () => {
    state = {
      ...state,
      isInside: false,
      ...(resetOnLeave ? { x: 0, y: 0, pageX: 0, pageY: 0, clientX: 0, clientY: 0 } : {}),
    }
    notify()
  }

  const setupListeners = () => {
    if (!target) return

    const t = target as EventTarget

    t.addEventListener('mousemove', handleMouseMove as EventListener)
    t.addEventListener('mousedown', handleMouseDown as EventListener)
    t.addEventListener('mouseup', handleMouseUp as EventListener)
    t.addEventListener('mouseenter', handleEnter)
    t.addEventListener('mouseleave', handleLeave)

    if (touch) {
      t.addEventListener('touchmove', handleTouchMove as EventListener)
      t.addEventListener('touchstart', handleEnter)
      t.addEventListener('touchend', handleLeave)
    }

    cleanup = () => {
      t.removeEventListener('mousemove', handleMouseMove as EventListener)
      t.removeEventListener('mousedown', handleMouseDown as EventListener)
      t.removeEventListener('mouseup', handleMouseUp as EventListener)
      t.removeEventListener('mouseenter', handleEnter)
      t.removeEventListener('mouseleave', handleLeave)

      if (touch) {
        t.removeEventListener('touchmove', handleTouchMove as EventListener)
        t.removeEventListener('touchstart', handleEnter)
        t.removeEventListener('touchend', handleLeave)
      }
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
    stop: () => {
      if (cleanup) {
        cleanup()
        cleanup = null
      }
      listeners = []
    },
  }
}

/**
 * Track mouse position relative to an element
 */
export function useMouseInElement(
  element: HTMLElement | (() => HTMLElement | null) | null,
  options: Omit<MouseOptions, 'target'> = {}
): ElementMouseRef {
  const { touch = true, resetOnLeave = true } = options

  let state: ElementMouseState = {
    x: 0,
    y: 0,
    pageX: 0,
    pageY: 0,
    clientX: 0,
    clientY: 0,
    movementX: 0,
    movementY: 0,
    buttons: 0,
    isPressed: false,
    isInside: false,
    elementX: 0,
    elementY: 0,
    elementWidth: 0,
    elementHeight: 0,
    isOutside: true,
  }

  let listeners: Array<(state: ElementMouseState) => void> = []
  let cleanup: (() => void) | null = null

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const getElement = (): HTMLElement | null => {
    if (typeof element === 'function') return element()
    return element
  }

  const updateElementPosition = (clientX: number, clientY: number) => {
    const el = getElement()
    if (!el) return

    const rect = el.getBoundingClientRect()
    const elementX = clientX - rect.left
    const elementY = clientY - rect.top
    const isOutside = elementX < 0 || elementY < 0 || elementX > rect.width || elementY > rect.height

    state = {
      ...state,
      elementX,
      elementY,
      elementWidth: rect.width,
      elementHeight: rect.height,
      isOutside,
      isInside: !isOutside,
    }
  }

  const handleMove = (event: MouseEvent | Touch, isTouch = false) => {
    const e = event as MouseEvent
    state = {
      ...state,
      x: e.pageX ?? e.clientX,
      y: e.pageY ?? e.clientY,
      pageX: e.pageX ?? 0,
      pageY: e.pageY ?? 0,
      clientX: e.clientX ?? 0,
      clientY: e.clientY ?? 0,
      movementX: isTouch ? 0 : (e.movementX ?? 0),
      movementY: isTouch ? 0 : (e.movementY ?? 0),
      buttons: isTouch ? 1 : (e.buttons ?? 0),
      isPressed: isTouch || (e.buttons ?? 0) > 0,
    }
    updateElementPosition(e.clientX, e.clientY)
    notify()
  }

  const handleMouseMove = (e: MouseEvent) => handleMove(e)
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0], true)
    }
  }

  const handleLeave = () => {
    state = {
      ...state,
      isInside: false,
      isOutside: true,
      ...(resetOnLeave ? { elementX: 0, elementY: 0 } : {}),
    }
    notify()
  }

  const setupListeners = () => {
    if (typeof window === 'undefined') return

    // Listen on window to track even outside element
    window.addEventListener('mousemove', handleMouseMove)

    if (touch) {
      window.addEventListener('touchmove', handleTouchMove)
    }

    cleanup = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (touch) {
        window.removeEventListener('touchmove', handleTouchMove)
      }
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
    stop: () => {
      if (cleanup) {
        cleanup()
        cleanup = null
      }
      listeners = []
    },
  }
}

/**
 * Track pointer (unified mouse + touch + pen)
 */
export function usePointer(options: MouseOptions = {}): MouseRef {
  const { target = typeof window !== 'undefined' ? window : null } = options

  let state: MouseState = {
    x: 0,
    y: 0,
    pageX: 0,
    pageY: 0,
    clientX: 0,
    clientY: 0,
    movementX: 0,
    movementY: 0,
    buttons: 0,
    isPressed: false,
    isInside: false,
  }

  let listeners: Array<(state: MouseState) => void> = []
  let cleanup: (() => void) | null = null

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const handlePointerMove = (e: PointerEvent) => {
    state = {
      x: e.pageX,
      y: e.pageY,
      pageX: e.pageX,
      pageY: e.pageY,
      clientX: e.clientX,
      clientY: e.clientY,
      movementX: e.movementX,
      movementY: e.movementY,
      buttons: e.buttons,
      isPressed: e.buttons > 0 || e.pressure > 0,
      isInside: true,
    }
    notify()
  }

  const handlePointerDown = (e: PointerEvent) => {
    state = { ...state, buttons: e.buttons, isPressed: true }
    notify()
  }

  const handlePointerUp = (e: PointerEvent) => {
    state = { ...state, buttons: e.buttons, isPressed: false }
    notify()
  }

  const setupListeners = () => {
    if (!target) return

    const t = target as EventTarget
    t.addEventListener('pointermove', handlePointerMove as EventListener)
    t.addEventListener('pointerdown', handlePointerDown as EventListener)
    t.addEventListener('pointerup', handlePointerUp as EventListener)

    cleanup = () => {
      t.removeEventListener('pointermove', handlePointerMove as EventListener)
      t.removeEventListener('pointerdown', handlePointerDown as EventListener)
      t.removeEventListener('pointerup', handlePointerUp as EventListener)
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
    stop: () => {
      if (cleanup) {
        cleanup()
        cleanup = null
      }
      listeners = []
    },
  }
}
