/**
 * Display / Screen Info
 *
 * Multi-monitor info: every connected display's bounds, work area
 * (excluding menu bar + dock), and `backingScaleFactor` (1.0 / 2.0).
 *
 * Browser fallback returns a single Display synthesised from
 * `window.screen`, which is "good enough" for layout heuristics but
 * misses secondary monitors (browsers can't see those).
 */

import { hasBridge, onCraftEvent } from './_bridge'

export interface Display {
  /** Stable id within this app run (0 = primary). */
  id: number
  /** Full screen rect (origin in AppKit / display-space coords). */
  x: number
  y: number
  width: number
  height: number
  /** Work area excluding menu bar + dock. */
  workX: number
  workY: number
  workWidth: number
  workHeight: number
  /** 1.0 (Retina = 2.0). Multiply CSS px by this for device px. */
  scaleFactor: number
}

export interface ScreenAPI {
  /** Every connected display. */
  getDisplays: () => Promise<Display[]>
  /** The primary display (the one with the menu bar). */
  getPrimary: () => Promise<Display | null>
  /**
   * Subscribe to display-arrangement changes — monitor hot-plug,
   * resolution change, dock relocation. The callback receives no
   * payload; re-fetch with `getDisplays()` to read the new state.
   */
  onChange: (cb: () => void) => () => void
}

export const screen: ScreenAPI = {
  async getDisplays() {
    if (hasBridge('screen')) return await window.craft!.screen.getDisplays()
    return webDisplays()
  },
  async getPrimary() {
    if (hasBridge('screen')) {
      const r = await window.craft!.screen.getPrimary()
      return r && typeof r.width === 'number' ? r : null
    }
    return webDisplays()[0] ?? null
  },
  onChange(cb) {
    if (hasBridge('screen')) return onCraftEvent('craft:screen:change', () => cb())
    // Web fallback: window-level resize events. Not strictly equivalent
    // — they fire for window resizes too, not just monitor changes —
    // but it's the closest thing browsers expose.
    if (typeof window === 'undefined') return () => {}
    const h = () => cb()
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  },
}

function webDisplays(): Display[] {
  if (typeof window === 'undefined' || !window.screen) return []
  const s = window.screen as any
  return [{
    id: 0,
    x: s.left ?? 0,
    y: s.top ?? 0,
    width: s.width || 0,
    height: s.height || 0,
    workX: s.availLeft ?? 0,
    workY: s.availTop ?? 0,
    workWidth: s.availWidth ?? s.width ?? 0,
    workHeight: s.availHeight ?? s.height ?? 0,
    scaleFactor: window.devicePixelRatio || 1,
  }]
}
