/**
 * mDNS / Bonjour service discovery.
 *
 * `browse(serviceType)` starts watching for services of the given
 * type (e.g. `_http._tcp.`, `_airplay._tcp.`); discovered services
 * arrive on the `craft:bonjour:found` event, and `craft:bonjour:lost`
 * fires when an advertised service goes away.
 *
 * Service browsing is opt-in — apps must call `browse()` before
 * subscribers see anything, and `stop()` to release the network
 * resources. Forgetting `stop()` keeps the system browsing in the
 * background which is wasteful but not harmful.
 */
import { hasBridge, onCraftEvent } from './_bridge'

export interface BonjourService {
  /** Service instance name (e.g. "Living Room AppleTV"). */
  name: string
  /** Resolved hostname when known; absent until address resolution. */
  host?: string
  port?: number
  /** Service type (the same string passed to `browse`). */
  type: string
}

export interface BonjourAPI {
  /**
   * Start browsing for services of the given type
   * (e.g. `_http._tcp.`, `_airplay._tcp.`).
   */
  browse: (serviceType: string) => Promise<{ started: boolean, reason?: string }>
  stop: () => Promise<void>
  onFound: (cb: (service: BonjourService) => void) => () => void
  onLost: (cb: (service: BonjourService) => void) => () => void
}

export const bonjour: BonjourAPI = {
  async browse(serviceType) {
    if (!hasBridge('bonjour')) return { started: false, reason: 'bridge unavailable' }
    return await window.craft!.bonjour.browse(serviceType)
  },
  async stop() { if (hasBridge('bonjour')) await window.craft!.bonjour.stop() },
  onFound(cb) { return onCraftEvent<BonjourService>('craft:bonjour:found', cb) },
  onLost(cb) { return onCraftEvent<BonjourService>('craft:bonjour:lost', cb) },
}
