/**
 * Capabilities — single place to ask "is this bridge usable on the
 * current host?" rather than scattering `hasBridge('xxx')` checks.
 *
 * The TypeScript SDK is largely cross-platform — every module has a
 * sensible fallback when the bridge is missing — but a number of
 * macOS-specific APIs (Vision, AppleScript, Spotlight, Continuity,
 * etc.) only return real data inside a Craft window on macOS.
 *
 * `getCapabilities()` returns a snapshot of which bridges respond. App
 * code can use this to enable or hide UI rather than relying on calls
 * that fail silently.
 */

import { hasBridge } from './_bridge'

/**
 * The set of bridges the SDK knows about, plus the platforms each is
 * implemented on. Used to power the `capabilities` map and to drive
 * docs / tooling.
 *
 * `'all'` means the bridge has a working web/non-bridge fallback too;
 * `'macos'` means it requires a Craft macOS host; `'native'` means it
 * needs *some* Craft host (mac/linux/windows) but has no web fallback.
 */
export type BridgePlatformSupport = 'all' | 'native' | 'macos'

export interface BridgeCapability {
  /** Bridge namespace as it appears under `window.craft`. */
  name: string
  /** Where the bridge is implemented today. */
  support: BridgePlatformSupport
  /** True when the bridge is reachable from the current host. */
  available: boolean
}

/**
 * Authoritative list. Keep in sync with the TS modules + native side.
 * When a new bridge ships, add a row here; the public capabilities
 * surface picks it up automatically.
 */
const BRIDGE_INDEX: Array<{ name: string, support: BridgePlatformSupport }> = [
  // Cross-platform with sensible web fallback
  { name: 'fs', support: 'native' },
  { name: 'shell', support: 'native' },
  { name: 'system', support: 'all' },
  { name: 'clipboard', support: 'all' },
  { name: 'dialog', support: 'all' },
  { name: 'window', support: 'native' },
  { name: 'tray', support: 'native' },
  { name: 'menu', support: 'native' },
  { name: 'theme', support: 'all' },
  { name: 'screen', support: 'all' },
  { name: 'network', support: 'all' },
  { name: 'power', support: 'all' },
  { name: 'battery', support: 'all' },
  { name: 'notifications', support: 'all' },
  { name: 'globalShortcuts', support: 'native' },
  { name: 'autolaunch', support: 'native' },
  { name: 'appInfo', support: 'all' },
  { name: 'localServer', support: 'native' },
  { name: 'bluetooth', support: 'native' },
  { name: 'crashReporter', support: 'all' },
  { name: 'updater', support: 'native' },
  { name: 'iap', support: 'macos' },
  { name: 'keychain', support: 'native' },
  { name: 'log', support: 'all' },

  // macOS-specific
  { name: 'biometric', support: 'macos' },
  { name: 'location', support: 'macos' },
  { name: 'audio', support: 'macos' },
  { name: 'deepLink', support: 'native' },
  { name: 'handoff', support: 'macos' },
  { name: 'liveActivities', support: 'macos' },
  { name: 'touchbar', support: 'macos' },
  { name: 'dragOut', support: 'macos' },
  { name: 'appleScript', support: 'macos' },
  { name: 'fileAssociations', support: 'native' },
  { name: 'tags', support: 'macos' },
  { name: 'pdf', support: 'macos' },
  { name: 'bonjour', support: 'macos' },
  { name: 'spotlight', support: 'macos' },
  { name: 'speechRecognition', support: 'macos' },
  { name: 'vision', support: 'macos' },
  { name: 'midi', support: 'macos' },
  { name: 'coreml', support: 'macos' },
  { name: 'continuityCamera', support: 'macos' },
  { name: 'serviceMenu', support: 'macos' },
  { name: 'serial', support: 'native' },
]

/**
 * Snapshot of every known bridge's availability on the current host.
 * Re-call after the bridge IIFE loads (e.g. `DOMContentLoaded`) — the
 * `available` field is computed against `window.craft` at call time.
 */
export function getCapabilities(): BridgeCapability[] {
  return BRIDGE_INDEX.map(({ name, support }) => ({
    name,
    support,
    available: hasBridge(name),
  }))
}

/**
 * Lookup a single capability by name. Returns `undefined` for bridges
 * the SDK doesn't know about.
 */
export function getCapability(name: string): BridgeCapability | undefined {
  const entry = BRIDGE_INDEX.find(b => b.name === name)
  if (!entry) return undefined
  return { ...entry, available: hasBridge(name) }
}

/**
 * Convenience predicate — `true` when a bridge is *both* known to the
 * SDK and currently reachable.
 */
export function isAvailable(name: string): boolean {
  const cap = getCapability(name)
  return !!cap && cap.available
}
