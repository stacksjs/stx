/**
 * Shared internals for craft bridge wrappers.
 *
 * Every public module in this package follows the same shape:
 *   1. Detect whether `window.craft.<namespace>` is available.
 *   2. Forward to it when running inside a Craft native window.
 *   3. Fall back gracefully (or refuse with a clear error) elsewhere.
 *
 * Centralising these helpers keeps the per-module wrappers small and
 * means a future bridge-detection change (e.g. version negotiation)
 * lives in exactly one place.
 *
 * Internal — not re-exported from index.ts. Apps that want to call the
 * bridge directly should use the namespaced public modules.
 */

// Augment the global window type so callers can import from this module
// without each one redeclaring `(window as any).craft`. Kept as a loose
// shape because the bridge is built from the Zig side and we don't want
// the TS layer to drift out of sync if a single field renames.
declare global {
  interface Window {
    craft?: Record<string, any>
    __craftPendingDeepLink?: string
    __craftCurrentTheme?: { appearance: 'light' | 'dark' }
  }
}

/** True when `window.craft.<ns>` exists. Cheap; do not memoize. */
export function hasBridge(ns: string): boolean {
  if (typeof window === 'undefined') return false
  const c = window.craft as Record<string, any> | undefined
  return !!(c && c[ns])
}

/**
 * Get the bridge namespace, or throw a clear error if it isn't there.
 * Use this in the rare case where a sensible web fallback doesn't exist
 * (e.g. system-level battery info). For everything else, prefer
 * `hasBridge` + manual fallback so the call works in browsers too.
 */
export function requireBridge<T = Record<string, any>>(ns: string): T {
  if (!hasBridge(ns)) {
    throw new Error(`craft.${ns} is not available — this API requires a Craft native window`)
  }
  return (window as Window).craft![ns] as T
}

/** Subscribe to a `craft:*` window event with auto-detached cleanup. */
export function onCraftEvent<T = unknown>(name: string, cb: (detail: T) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const h = (e: Event) => cb(((e as CustomEvent).detail || {}) as T)
  window.addEventListener(name, h as EventListener)
  return () => window.removeEventListener(name, h as EventListener)
}
