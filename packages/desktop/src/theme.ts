/**
 * System Theme (Light / Dark)
 *
 * Read the OS appearance and subscribe to changes (e.g. macOS auto
 * mode flipping at sunset). When running in a Craft native window the
 * value comes from `NSApplication.effectiveAppearance` (kept in sync
 * via KVO). Browser fallback uses `prefers-color-scheme` media query.
 *
 * The two paths report identical values, so call sites don't need to
 * branch on environment.
 */

import { hasBridge, onCraftEvent } from './_bridge'

export type Appearance = 'light' | 'dark'

export interface ThemeInfo {
  appearance: Appearance
}

export interface SystemTheme {
  /** Synchronous read of the current appearance. */
  get: () => ThemeInfo
  /**
   * Subscribe to appearance changes. Fires once on subscribe with the
   * current value, so call sites don't need a separate `get()` call.
   * Returns an unsubscribe function.
   */
  onChange: (cb: (info: ThemeInfo) => void) => () => void
  /** Promise alternative to `get()`. Useful when you want to await once. */
  current: () => Promise<ThemeInfo>
}

export const theme: SystemTheme = {
  get(): ThemeInfo {
    if (hasBridge('theme')) {
      try { return window.craft!.theme.get() } catch { /* fall through */ }
    }
    return { appearance: detectWebAppearance() }
  },

  onChange(cb): () => void {
    // Fire immediately so callers don't need a separate snapshot read.
    cb(this.get())

    if (hasBridge('theme')) {
      return onCraftEvent<ThemeInfo>('craft:theme', cb)
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => cb({ appearance: mq.matches ? 'dark' : 'light' })
      // Use the modern `addEventListener('change', ...)` form. Old Safari
      // (<14) only had `addListener`; that hasn't been supported by stx
      // anyway, so we don't fall back.
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }

    return () => {}
  },

  async current(): Promise<ThemeInfo> {
    return this.get()
  },
}

function detectWebAppearance(): Appearance {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
