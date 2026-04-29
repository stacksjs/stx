/**
 * Window Lifecycle Events
 *
 * Subscribe to focus, blur, resize, move, minimize, restore, and close
 * events on the main Craft window. Backed by an `NSWindowDelegate` on
 * the macOS side; in browser builds these fall back to the equivalent
 * `window.addEventListener('focus' | 'blur' | 'resize' | 'beforeunload')`.
 *
 * **Note on close:** the native `onClose` event fires *after* AppKit
 * has committed to closing — you can't `event.preventDefault()` from
 * here. For a real "are you sure you want to close?" gate, attach
 * `beforeunload` in JS, which fires before AppKit's close path runs.
 */

import { hasBridge, onCraftEvent } from './_bridge'

export interface WindowSize {
  /**
   * Stable window identifier — opaque string. In multi-window apps, use
   * this to correlate events back to the right window. Single-window
   * apps can ignore it.
   */
  id?: string
  width: number
  height: number
}

export interface WindowPosition {
  id?: string
  x: number
  y: number
}

export interface WindowEvents {
  /** Window became key (received focus). */
  onFocus: (cb: () => void) => () => void
  /** Window lost focus / resigned key state. */
  onBlur: (cb: () => void) => () => void
  /** Window was resized. Detail contains the new size. */
  onResize: (cb: (size: WindowSize) => void) => () => void
  /** Window was moved. Detail contains the new origin. */
  onMove: (cb: (pos: WindowPosition) => void) => () => void
  /** Window is closing (fires after AppKit commits — not interceptable). */
  onClose: (cb: () => void) => () => void
  /** Window was minimized to the dock. */
  onMinimize: (cb: () => void) => () => void
  /** Window was restored from minimize. */
  onRestore: (cb: () => void) => () => void
}

export const windowEvents: WindowEvents = {
  onFocus(cb) {
    if (hasBridge('window')) return onCraftEvent('craft:window:focus', () => cb())
    return webEvent('focus', cb)
  },
  onBlur(cb) {
    if (hasBridge('window')) return onCraftEvent('craft:window:blur', () => cb())
    return webEvent('blur', cb)
  },
  onResize(cb) {
    if (hasBridge('window')) return onCraftEvent<WindowSize>('craft:window:resize', cb)
    if (typeof window === 'undefined') return () => {}
    const h = () => cb({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  },
  onMove(cb) {
    if (hasBridge('window')) return onCraftEvent<WindowPosition>('craft:window:move', cb)
    // Browsers don't expose window-position changes, so this is no-op
    // outside Craft. Returning the same shape keeps callers branchless.
    return () => {}
  },
  onClose(cb) {
    if (hasBridge('window')) return onCraftEvent('craft:window:close', () => cb())
    return webEvent('beforeunload', cb)
  },
  onMinimize(cb) {
    if (hasBridge('window')) return onCraftEvent('craft:window:minimize', () => cb())
    // Closest browser equivalent is visibilitychange → 'hidden'.
    if (typeof document === 'undefined') return () => {}
    const h = () => { if (document.visibilityState === 'hidden') cb() }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  },
  onRestore(cb) {
    if (hasBridge('window')) return onCraftEvent('craft:window:restore', () => cb())
    if (typeof document === 'undefined') return () => {}
    const h = () => { if (document.visibilityState === 'visible') cb() }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  },
}

function webEvent(name: string, cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const h = () => cb()
  window.addEventListener(name, h)
  return () => window.removeEventListener(name, h)
}
