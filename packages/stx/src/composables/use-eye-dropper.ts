/**
 * EyeDropper Composables
 *
 * Reactive utilities for the EyeDropper API to pick colors from the screen.
 */

export interface EyeDropperState {
  isSupported: boolean
  isOpen: boolean
  sRGBHex: string | null
  error: Error | null
}

export interface EyeDropperResult {
  sRGBHex: string
}

export interface EyeDropperOptions {
  /**
   * Called when a color is picked
   */
  onPick?: (color: string) => void
  /**
   * Called when the picker is aborted
   */
  onAbort?: () => void
  /**
   * Called on error
   */
  onError?: (error: Error) => void
}

export interface EyeDropperRef {
  get: () => EyeDropperState
  subscribe: (fn: (state: EyeDropperState) => void) => () => void
  open: () => Promise<string | null>
  isSupported: () => boolean
}

// Extend Window for EyeDropper
interface EyeDropperConstructor {
  new (): {
    open: (options?: { signal?: AbortSignal }) => Promise<EyeDropperResult>
  }
}

declare global {
  interface Window {
    EyeDropper?: EyeDropperConstructor
  }
}

/**
 * Check if EyeDropper API is supported
 */
export function isEyeDropperSupported(): boolean {
  return typeof window !== 'undefined' && 'EyeDropper' in window
}

/**
 * Create a reactive eye dropper color picker
 *
 * The EyeDropper API allows users to pick colors from anywhere on their
 * screen, not just within the browser window. Great for design tools,
 * color pickers, and accessibility features.
 *
 * @example
 * ```ts
 * const eyeDropper = useEyeDropper({
 *   onPick: (color) => {
 *     console.log('Picked color:', color) // e.g., "#ff6188"
 *   }
 * })
 *
 * // Subscribe to state changes
 * eyeDropper.subscribe((state) => {
 *   if (state.sRGBHex) {
 *     document.body.style.backgroundColor = state.sRGBHex
 *   }
 * })
 *
 * // Open the color picker
 * const color = await eyeDropper.open()
 * ```
 */
export function useEyeDropper(options: EyeDropperOptions = {}): EyeDropperRef {
  const { onPick, onAbort, onError } = options
  const supported = isEyeDropperSupported()
  const subscribers = new Set<(state: EyeDropperState) => void>()

  let state: EyeDropperState = {
    isSupported: supported,
    isOpen: false,
    sRGBHex: null,
    error: null,
  }

  let abortController: AbortController | null = null

  function notify() {
    subscribers.forEach(fn => fn(state))
  }

  async function open(): Promise<string | null> {
    if (!supported || !window.EyeDropper) {
      const error = new Error('EyeDropper API not supported')
      state = { ...state, error }
      notify()
      onError?.(error)
      return null
    }

    // Abort any previous picker
    abortController?.abort()
    abortController = new AbortController()

    state = { ...state, isOpen: true, error: null }
    notify()

    try {
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open({ signal: abortController.signal })

      state = { ...state, isOpen: false, sRGBHex: result.sRGBHex }
      notify()
      onPick?.(result.sRGBHex)
      return result.sRGBHex
    }
    catch (error) {
      state = { ...state, isOpen: false }

      if ((error as Error).name === 'AbortError') {
        onAbort?.()
        notify()
        return null
      }

      state = { ...state, error: error as Error }
      notify()
      onError?.(error as Error)
      return null
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
          abortController?.abort()
        }
      }
    },
    open,
    isSupported: () => supported,
  }
}

/**
 * Simple color picker that returns the color
 *
 * @example
 * ```ts
 * const color = await pickColor()
 * if (color) {
 *   console.log('Picked:', color)
 * }
 * ```
 */
export async function pickColor(): Promise<string | null> {
  if (!isEyeDropperSupported() || !window.EyeDropper) {
    return null
  }

  try {
    const eyeDropper = new window.EyeDropper()
    const result = await eyeDropper.open()
    return result.sRGBHex
  }
  catch {
    return null
  }
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}

/**
 * Convert hex color to HSL values
 */
export function hexToHsl(hex: string): { h: number, s: number, l: number } | null {
  const rgb = hexToRgb(hex)
  if (!rgb)
    return null

  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      break
    case g:
      h = ((b - r) / d + 2) / 6
      break
    case b:
      h = ((r - g) / d + 4) / 6
      break
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Pick a color with history tracking
 *
 * @example
 * ```ts
 * const colorPicker = useColorHistory({
 *   maxHistory: 10
 * })
 *
 * await colorPicker.pick()
 *
 * colorPicker.subscribe((state) => {
 *   console.log('History:', state.history)
 *   console.log('Current:', state.current)
 * })
 * ```
 */
export function useColorHistory(options: {
  maxHistory?: number
  onPick?: (color: string) => void
} = {}) {
  const { maxHistory = 20, onPick } = options
  const eyeDropper = useEyeDropper({ onPick })
  const subscribers = new Set<(state: { current: string | null, history: string[] }) => void>()

  let history: string[] = []

  function notify() {
    const state = { current: eyeDropper.get().sRGBHex, history }
    subscribers.forEach(fn => fn(state))
  }

  eyeDropper.subscribe((state) => {
    if (state.sRGBHex && !history.includes(state.sRGBHex)) {
      history = [state.sRGBHex, ...history].slice(0, maxHistory)
      notify()
    }
  })

  async function pick(): Promise<string | null> {
    return eyeDropper.open()
  }

  function clearHistory() {
    history = []
    notify()
  }

  function removeFromHistory(color: string) {
    history = history.filter(c => c !== color)
    notify()
  }

  return {
    get: () => ({ current: eyeDropper.get().sRGBHex, history }),
    subscribe: (fn: (state: { current: string | null, history: string[] }) => void) => {
      subscribers.add(fn)
      fn({ current: eyeDropper.get().sRGBHex, history })
      return () => {
        subscribers.delete(fn)
      }
    },
    pick,
    clearHistory,
    removeFromHistory,
    isSupported: eyeDropper.isSupported,
  }
}
