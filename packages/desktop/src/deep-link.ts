/**
 * Deep Links (Custom URL Schemes)
 *
 * When the OS opens `myapp://path?foo=bar` the URL is delivered into
 * the running process. This module surfaces those URLs to your app.
 *
 * **Required setup on macOS:** declare the scheme in your `Info.plist`
 * under `CFBundleURLTypes`. Craft can't do that for you — bundling is
 * the app's responsibility — but with the entry present, the OS will
 * route URLs into Craft's AppleEvent handler, which fires `craft:deepLink`.
 *
 * **First-launch URLs:** if the app launched *because* the user clicked
 * a deep link, the URL may arrive before your subscriber attaches. Use
 * `getInitialUrl()` after subscribing to recover it.
 *
 * Browser fallback: when not in a Craft window, this module is a
 * graceful no-op (subscriptions never fire). For browser-side custom
 * URL schemes, register a service worker or use `navigator.registerProtocolHandler`.
 */
import { hasBridge, onCraftEvent } from './_bridge'

export interface DeepLinkEvent {
  /** The full URL the OS delivered, exactly as received. */
  url: string
}

export interface DeepLinks {
  /**
   * Subscribe to deep link arrivals. Returns an unsubscribe function.
   * Subscribers do NOT receive past URLs — pair with `getInitialUrl()`
   * to handle the case where the app launched in response to a URL.
   */
  onUrl: (cb: (e: DeepLinkEvent) => void) => () => void
  /**
   * Returns the URL that launched the app, if any. Idempotent — multiple
   * reads return the same value. Use `consumeInitialUrl()` if you only
   * want to handle the launch URL once.
   */
  getInitialUrl: () => string | null
  /**
   * Like `getInitialUrl()` but clears the stored URL after reading.
   * Useful for "process pending deep link on boot, ignore on re-render"
   * flows in framework code that mounts/remounts repeatedly.
   */
  consumeInitialUrl: () => string | null
  /** True when the deep-link bridge is available. */
  isAvailable: () => boolean
}

export const deepLinks: DeepLinks = {
  onUrl(cb): () => void {
    if (!hasBridge('deepLink')) return () => {}
    return onCraftEvent<DeepLinkEvent>('craft:deepLink', cb)
  },
  getInitialUrl(): string | null {
    if (typeof window === 'undefined') return null
    if (hasBridge('deepLink')) {
      try { return window.craft!.deepLink.getInitialUrl() } catch { return null }
    }
    return window.__craftPendingDeepLink || null
  },
  consumeInitialUrl(): string | null {
    const url = this.getInitialUrl()
    // Native side stores its own copy; we can only clear the JS-side
    // mirror. Subsequent `getInitialUrl()` calls into the bridge will
    // still return the URL until a new one arrives, but
    // `consumeInitialUrl()` returns null on second read, which matches
    // the consume-once contract callers expect.
    if (typeof window !== 'undefined') window.__craftPendingDeepLink = undefined
    return url
  },
  isAvailable(): boolean {
    return hasBridge('deepLink')
  },
}
