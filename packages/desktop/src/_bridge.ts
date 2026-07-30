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

// The bridge is built on the Zig side and exposes far more namespaces than
// craft-native's published types declare (audio, bluetooth, menu, updater,
// touchbar, iap, …). Widen the published interface instead of re-declaring
// `Window.craft` here: craft-native already declares that property globally as
// `CraftBridgeAPI & CraftEventEmitter`, so a second, looser declaration is a
// conflicting merge (TS2717) — and the narrower published type wins, which made
// every `craft.<ns>` access fail with TS2339 and every `craft[ns]` lookup with
// TS7053.
//
// An index signature keeps the declared namespaces exactly as typed while
// letting the ones the bridge ships ahead of the types resolve, which preserves
// the original intent: don't make the TS layer drift out of sync when a single
// field renames.
declare module 'craft-native' {
  interface CraftBridgeAPI {
    [namespace: string]: any
  }

  // `app` IS a declared namespace with precise signatures, so widen it by
  // naming the two macOS dock methods the bridge ships rather than with an
  // index signature — that keeps a typo in `craft.app.*` an error.
  interface CraftAppAPI {
    setBadge: (count: number) => Promise<void>
    bounce: (type?: 'critical' | 'informational') => Promise<void>
  }
}

declare global {
  interface Window {
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

/**
 * Central index of every `craft:*` event the SDK currently knows about,
 * mapped to its payload shape. Apps that subscribe via `onCraftEvent`
 * with a literal name get fully-typed `detail` automatically — no
 * `<unknown>` casts. Internal modules also use the map to keep their
 * own `onXxx` callbacks honest.
 *
 * When adding a new event name on the native side, add a row here so
 * the public TS surface stays in sync.
 */
export interface CraftEventMap {
  // power / system-wide
  'craft:powerSleep': void
  'craft:powerWake': void
  'craft:networkChange': { type: import('./network').ConnectionType, online: boolean }
  'craft:screen:change': void
  'craft:screenSharing:change': import('./screen-sharing').ScreenSharingState
  'craft:theme': import('./theme').ThemeInfo

  // bluetooth
  'craft:bluetooth:deviceFound': import('./bluetooth').BluetoothDevice
  'craft:bluetooth:deviceConnected': import('./bluetooth').BluetoothDevice
  'craft:bluetooth:deviceDisconnected': import('./bluetooth').BluetoothDevice
  'craft:bluetooth:characteristicValue': import('./bluetooth').BluetoothCharacteristicValueEvent

  // bonjour
  'craft:bonjour:found': import('./bonjour').BonjourService
  'craft:bonjour:lost': import('./bonjour').BonjourService

  // deep link
  'craft:deepLink': import('./deep-link').DeepLinkEvent

  // file system
  'craft:fs:change': import('./fs').FSChangeEvent

  // global shortcuts
  'craft:shortcut': import('./global-shortcuts').ShortcutFireEvent

  // handoff / continuity
  'craft:handoff:incoming': import('./handoff').HandoffIncomingEvent

  // in-app purchases
  'craft:iap:purchased': import('./iap').IAPTransactionEvent
  'craft:iap:failed': import('./iap').IAPFailureEvent
  'craft:iap:restored': import('./iap').IAPTransactionEvent
  'craft:iap:productsLoaded': { products?: import('./iap').IAPProduct[] }
  'craft:iap:refunded': import('./iap').IAPRefundEvent
  'craft:iap:subscriptionStatusChanged': import('./iap').IAPSubscriptionStatusEvent

  // local HTTP server
  'craft:localServer:request': import('./local-server').LocalServerRequestEvent

  // location
  'craft:location:update': import('./location').LocationCoordinate
  'craft:location:error': { message: string }
  'craft:location:authChanged': { status: import('./location').LocationAuthStatus }

  // menu
  'craft:menu:action': import('./menu').MenuActionEvent

  // midi
  'craft:midi:message': import('./midi').MIDIMessageEvent

  // notifications
  'craft:notification:actionClicked': import('./notifications').NotificationActionEvent
  'craft:notification:reply': import('./notifications').NotificationReplyEvent

  // serial
  'craft:serial:data': import('./serial').SerialDataEvent

  // service menu
  'craft:serviceMenu:invoked': import('./service-menu').ServiceMenuInvokedEvent

  // shell
  'craft:shell:stdout': import('./shell').ShellOutputEvent
  'craft:shell:stderr': import('./shell').ShellOutputEvent
  'craft:shell:exit': import('./shell').ShellExitEvent

  // speech recognition
  'craft:speechRecognition:partial': { transcript: string }
  'craft:speechRecognition:final': { transcript: string }

  // touch bar
  'craft:touchbar:action': import('./touchbar').TouchBarActionEvent

  // updater
  'craft:updateAvailable': import('./updater').UpdateInfo
  'craft:updateDownloaded': import('./updater').UpdateInfo

  // window
  'craft:window:focus': void
  'craft:window:blur': void
  'craft:window:resize': import('./window-events').WindowSize
  'craft:window:move': import('./window-events').WindowPosition
  'craft:window:close': void
  'craft:window:minimize': void
  'craft:window:restore': void

  // tray
  'craft:tray:menu': { id?: string }
}

/**
 * Subscribe to a `craft:*` window event with auto-detached cleanup.
 *
 * Two overloads:
 * - **Known event** (string literal in `CraftEventMap`): `detail` is
 *   typed to the matching payload, no generic argument needed.
 * - **Custom event** (any other name): pass an explicit `T` to type
 *   the payload yourself, or default to `unknown`.
 */
export function onCraftEvent<K extends keyof CraftEventMap>(
  name: K,
  cb: (detail: CraftEventMap[K]) => void,
): () => void
export function onCraftEvent<T = unknown>(
  name: string,
  cb: (detail: T) => void,
): () => void
export function onCraftEvent(name: string, cb: (detail: any) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const h = (e: Event) => cb((e as CustomEvent).detail ?? {})
  window.addEventListener(name, h as EventListener)
  return () => window.removeEventListener(name, h as EventListener)
}
