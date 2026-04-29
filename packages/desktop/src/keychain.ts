/**
 * Keychain — Secure Secret Storage
 *
 * Wraps platform-specific credential stores: macOS Keychain Services,
 * iOS Keychain, Windows Credential Manager, Linux Secret Service
 * (D-Bus / GNOME Keyring).
 *
 * Use this for OAuth refresh tokens, API keys, login passwords —
 * anything you'd be uncomfortable storing in `localStorage`. Items
 * are scoped under a `service` namespace, typically your app's
 * bundle identifier.
 *
 * No web fallback. The whole point is OS-protected storage; falling
 * back to localStorage would silently downgrade security guarantees.
 * Calls outside a Craft window throw.
 */

import { requireBridge } from './_bridge'

export interface KeychainAPI {
  /**
   * Store a secret. Overwrites any existing entry under (service, account).
   * The password may be any UTF-8 string.
   */
  set: (service: string, account: string, password: string) => Promise<void>
  /**
   * Read a secret. Returns `null` (not undefined) if no entry exists,
   * so callers can distinguish "not found" from "found, value is empty".
   */
  get: (service: string, account: string) => Promise<string | null>
  /** Delete a secret. No-op if it doesn't exist. */
  delete: (service: string, account: string) => Promise<void>
  /** Check whether a secret exists, without reading it (no decrypt cost). */
  has: (service: string, account: string) => Promise<boolean>
}

export const keychain: KeychainAPI = {
  async set(service, account, password) {
    if (!service) throw new Error('keychain.set: service is required')
    if (!account) throw new Error('keychain.set: account is required')
    await requireBridge('keychain').set(service, account, password)
  },
  async get(service, account) {
    if (!service) throw new Error('keychain.get: service is required')
    if (!account) throw new Error('keychain.get: account is required')
    const v = await requireBridge('keychain').get(service, account)
    return typeof v === 'string' ? v : null
  },
  async delete(service, account) {
    if (!service) throw new Error('keychain.delete: service is required')
    if (!account) throw new Error('keychain.delete: account is required')
    await requireBridge('keychain').delete(service, account)
  },
  async has(service, account) {
    if (!service) throw new Error('keychain.has: service is required')
    if (!account) throw new Error('keychain.has: account is required')
    return await requireBridge('keychain').has(service, account)
  },
}
