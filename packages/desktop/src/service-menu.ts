/**
 * macOS Services menu integration.
 *
 * The Services submenu (`AppName → Services → ...` and the right-click
 * contextual menu) lets users hand selected text/files to other apps.
 * Apps that want to appear there declare entries in `Info.plist`'s
 * `NSServices` array AND register handlers for the named selectors.
 *
 * `register(name)` records that we'll handle a service. The
 * `Info.plist` entry is still required for the system to surface the
 * menu item; runtime registration wires our handler so the user's
 * pick fires `craft:serviceMenu:invoked`.
 *
 * macOS reads `NSServices` once at app launch — there's no API for
 * adding services dynamically. Apps that need dynamic services should
 * ship a worker app extension instead.
 */

import { hasBridge, onCraftEvent } from './_bridge'

export interface ServiceMenuInvokedEvent {
  /** Service name matching the registration. */
  name: string
  /** Pasteboard payload the user invoked the service against. */
  payload?: { type: string, value: string }
}

export interface ServiceMenuAPI {
  register: (name: string) => Promise<{ ok: boolean, reason?: string }>
  unregister: (name: string) => Promise<void>
  onInvoked: (cb: (event: ServiceMenuInvokedEvent) => void) => () => void
}

export const serviceMenu: ServiceMenuAPI = {
  async register(name) {
    if (!name) throw new Error('serviceMenu.register: name is required')
    if (!hasBridge('serviceMenu')) return { ok: false, reason: 'bridge unavailable' }
    return await window.craft!.serviceMenu.register(name)
  },
  async unregister(name) {
    if (!name) throw new Error('serviceMenu.unregister: name is required')
    if (!hasBridge('serviceMenu')) return
    await window.craft!.serviceMenu.unregister(name)
  },
  onInvoked(cb) { return onCraftEvent<ServiceMenuInvokedEvent>('craft:serviceMenu:invoked', cb) },
}
