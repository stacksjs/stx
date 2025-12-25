/**
 * useKeyboard - Reactive keyboard input tracking
 *
 * Track keyboard state, handle hotkeys, and manage keyboard shortcuts.
 *
 * @example
 * ```ts
 * // Track all keyboard state
 * const keyboard = useKeyboard()
 * keyboard.subscribe(state => {
 *   if (state.ctrl && state.pressed.has('s')) {
 *     console.log('Ctrl+S pressed!')
 *   }
 * })
 *
 * // Simple hotkey
 * useHotkey('ctrl+s', (e) => {
 *   e.preventDefault()
 *   save()
 * })
 *
 * // Check if specific key is pressed
 * const isSpacePressed = useKeyPressed('Space')
 * ```
 */

export interface KeyboardState {
  /** Currently pressed keys */
  pressed: Set<string>
  /** Last key pressed */
  lastKey: string | null
  /** Last key event */
  lastEvent: KeyboardEvent | null
  /** Modifier states */
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  /** Timestamp of last key event */
  timestamp: number
}

export interface KeyboardOptions {
  /** Target element (default: window) */
  target?: Window | HTMLElement | Document | null
  /** Capture phase */
  capture?: boolean
  /** Passive listener */
  passive?: boolean
}

export interface KeyboardRef {
  get: () => KeyboardState
  subscribe: (fn: (state: KeyboardState) => void) => () => void
  isPressed: (key: string) => boolean
  stop: () => void
}

export interface HotkeyOptions {
  /** Target element (default: window) */
  target?: Window | HTMLElement | Document | null
  /** Prevent default behavior */
  preventDefault?: boolean
  /** Stop propagation */
  stopPropagation?: boolean
  /** Only trigger on keydown (not repeat) */
  ignoreRepeat?: boolean
  /** Trigger on keyup instead of keydown */
  keyup?: boolean
  /** Only trigger when no input is focused */
  ignoreInputs?: boolean
}

type HotkeyCallback = (event: KeyboardEvent) => void

/**
 * Parse hotkey string into components
 */
function parseHotkey(hotkey: string): {
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
} {
  const parts = hotkey.toLowerCase().split('+').map(p => p.trim())
  const key = parts[parts.length - 1]

  return {
    key,
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    alt: parts.includes('alt') || parts.includes('option'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command') || parts.includes('win'),
  }
}

/**
 * Check if event matches hotkey
 */
function matchesHotkey(
  event: KeyboardEvent,
  hotkey: { key: string; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean }
): boolean {
  const eventKey = event.key.toLowerCase()
  const eventCode = event.code.toLowerCase()

  // Match key by key value or code
  const keyMatches =
    eventKey === hotkey.key ||
    eventCode === hotkey.key ||
    eventCode === `key${hotkey.key}` ||
    eventCode === `digit${hotkey.key}` ||
    // Special keys
    (hotkey.key === 'space' && event.code === 'Space') ||
    (hotkey.key === 'enter' && event.key === 'Enter') ||
    (hotkey.key === 'escape' && event.key === 'Escape') ||
    (hotkey.key === 'esc' && event.key === 'Escape') ||
    (hotkey.key === 'tab' && event.key === 'Tab') ||
    (hotkey.key === 'backspace' && event.key === 'Backspace') ||
    (hotkey.key === 'delete' && event.key === 'Delete') ||
    (hotkey.key === 'up' && event.key === 'ArrowUp') ||
    (hotkey.key === 'down' && event.key === 'ArrowDown') ||
    (hotkey.key === 'left' && event.key === 'ArrowLeft') ||
    (hotkey.key === 'right' && event.key === 'ArrowRight')

  return (
    keyMatches &&
    event.ctrlKey === hotkey.ctrl &&
    event.altKey === hotkey.alt &&
    event.shiftKey === hotkey.shift &&
    event.metaKey === hotkey.meta
  )
}

/**
 * Check if an input element is focused
 */
function isInputFocused(): boolean {
  const active = document.activeElement
  if (!active) return false
  const tagName = active.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    (active as HTMLElement).isContentEditable
  )
}

/**
 * Track keyboard state
 */
export function useKeyboard(options: KeyboardOptions = {}): KeyboardRef {
  const {
    target = typeof window !== 'undefined' ? window : null,
    capture = false,
    passive = true,
  } = options

  let state: KeyboardState = {
    pressed: new Set(),
    lastKey: null,
    lastEvent: null,
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    timestamp: 0,
  }

  let listeners: Array<(state: KeyboardState) => void> = []
  let cleanup: (() => void) | null = null

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const newPressed = new Set(state.pressed)
    newPressed.add(e.key.toLowerCase())
    newPressed.add(e.code.toLowerCase())

    state = {
      pressed: newPressed,
      lastKey: e.key,
      lastEvent: e,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey,
      timestamp: Date.now(),
    }
    notify()
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    const newPressed = new Set(state.pressed)
    newPressed.delete(e.key.toLowerCase())
    newPressed.delete(e.code.toLowerCase())

    state = {
      pressed: newPressed,
      lastKey: e.key,
      lastEvent: e,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey,
      timestamp: Date.now(),
    }
    notify()
  }

  const handleBlur = () => {
    // Clear all pressed keys when window loses focus
    state = {
      ...state,
      pressed: new Set(),
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
    }
    notify()
  }

  const setupListeners = () => {
    if (!target) return

    const t = target as EventTarget
    const opts = { capture, passive }

    t.addEventListener('keydown', handleKeyDown as EventListener, opts)
    t.addEventListener('keyup', handleKeyUp as EventListener, opts)
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', handleBlur)
    }

    cleanup = () => {
      t.removeEventListener('keydown', handleKeyDown as EventListener, opts)
      t.removeEventListener('keyup', handleKeyUp as EventListener, opts)
      if (typeof window !== 'undefined') {
        window.removeEventListener('blur', handleBlur)
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
    isPressed: (key: string) => {
      const k = key.toLowerCase()
      return state.pressed.has(k)
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
 * Register a hotkey handler
 */
export function useHotkey(
  hotkey: string | string[],
  callback: HotkeyCallback,
  options: HotkeyOptions = {}
): () => void {
  const {
    target = typeof window !== 'undefined' ? window : null,
    preventDefault = true,
    stopPropagation = false,
    ignoreRepeat = true,
    keyup = false,
    ignoreInputs = true,
  } = options

  if (!target) return () => {}

  const hotkeys = Array.isArray(hotkey) ? hotkey : [hotkey]
  const parsedHotkeys = hotkeys.map(parseHotkey)

  const handler = (e: KeyboardEvent) => {
    // Ignore if repeat and ignoreRepeat is true
    if (ignoreRepeat && e.repeat) return

    // Ignore if input is focused and ignoreInputs is true
    if (ignoreInputs && isInputFocused()) return

    // Check if any hotkey matches
    const matches = parsedHotkeys.some(hk => matchesHotkey(e, hk))
    if (!matches) return

    if (preventDefault) e.preventDefault()
    if (stopPropagation) e.stopPropagation()

    callback(e)
  }

  const eventType = keyup ? 'keyup' : 'keydown'
  const t = target as EventTarget
  t.addEventListener(eventType, handler as EventListener)

  return () => {
    t.removeEventListener(eventType, handler as EventListener)
  }
}

/**
 * Check if a specific key is currently pressed
 */
export function useKeyPressed(key: string, options: KeyboardOptions = {}): {
  get: () => boolean
  subscribe: (fn: (pressed: boolean) => void) => () => void
} {
  const keyboard = useKeyboard(options)
  const targetKey = key.toLowerCase()

  let listeners: Array<(pressed: boolean) => void> = []
  let lastValue = false
  let unsubKeyboard: (() => void) | null = null

  return {
    get: () => keyboard.isPressed(targetKey),
    subscribe: (fn) => {
      if (listeners.length === 0) {
        unsubKeyboard = keyboard.subscribe((state) => {
          const isPressed = state.pressed.has(targetKey)
          if (isPressed !== lastValue) {
            lastValue = isPressed
            listeners.forEach(l => l(isPressed))
          }
        })
      }
      listeners.push(fn)
      fn(keyboard.isPressed(targetKey))

      return () => {
        listeners = listeners.filter(l => l !== fn)
        if (listeners.length === 0 && unsubKeyboard) {
          unsubKeyboard()
          unsubKeyboard = null
        }
      }
    },
  }
}

/**
 * Detect key sequences (like Konami code)
 */
export function useKeySequence(
  sequence: string[],
  callback: () => void,
  options: { timeout?: number; target?: Window | HTMLElement | Document | null } = {}
): () => void {
  const { timeout = 1000, target = typeof window !== 'undefined' ? window : null } = options

  if (!target) return () => {}

  let buffer: string[] = []
  let lastTime = 0

  const handler = (e: KeyboardEvent) => {
    const now = Date.now()

    // Reset if too much time passed
    if (now - lastTime > timeout) {
      buffer = []
    }
    lastTime = now

    buffer.push(e.key.toLowerCase())

    // Keep buffer at sequence length
    if (buffer.length > sequence.length) {
      buffer = buffer.slice(-sequence.length)
    }

    // Check if sequence matches
    if (buffer.length === sequence.length) {
      const matches = buffer.every((key, i) => key === sequence[i].toLowerCase())
      if (matches) {
        callback()
        buffer = []
      }
    }
  }

  const t = target as EventTarget
  t.addEventListener('keydown', handler as EventListener)

  return () => {
    t.removeEventListener('keydown', handler as EventListener)
  }
}

/**
 * Common keyboard shortcuts helper
 */
export const shortcuts = {
  save: 'ctrl+s',
  undo: 'ctrl+z',
  redo: 'ctrl+shift+z',
  copy: 'ctrl+c',
  paste: 'ctrl+v',
  cut: 'ctrl+x',
  selectAll: 'ctrl+a',
  find: 'ctrl+f',
  replace: 'ctrl+h',
  newTab: 'ctrl+t',
  closeTab: 'ctrl+w',
  refresh: 'ctrl+r',
  escape: 'escape',
  enter: 'enter',
  // Mac alternatives
  saveMac: 'meta+s',
  undoMac: 'meta+z',
  redoMac: 'meta+shift+z',
  copyMac: 'meta+c',
  pasteMac: 'meta+v',
  cutMac: 'meta+x',
} as const
