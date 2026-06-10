/**
 * Auto-Updater
 *
 * Configure and trigger app updates. On macOS this routes to Sparkle
 * (`SUUpdater`); on Windows to WinSparkle; on Linux to a custom feed
 * checker. The shape of the API is provider-neutral — a feed URL plus
 * "check now" / "check in background."
 *
 * Apps still need to bundle the updater framework and ship signed
 * appcasts; Craft only exposes the runtime knobs and event surface.
 *
 * Browser fallback: this module is an inert no-op (calls resolve, but
 * nothing happens). Outside a native shell there's no update flow.
 */
import { hasBridge, onCraftEvent } from './_bridge'

export interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
  /** Direct download URL for the new build. */
  downloadUrl?: string
}

export interface VerifyOptions {
  /** Raw bytes of the update bundle (zip / dmg / msi / appimage). */
  payload: Uint8Array | ArrayBuffer
  /** Base64-encoded Ed25519 signature over `payload`. */
  signatureB64: string
  /** Base64-encoded raw Ed25519 public key (32 bytes). */
  publicKeyB64: string
}

export interface VerifyDownloadOptions {
  /** Where to fetch the bundle from. */
  url: string
  /** Base64-encoded Ed25519 signature over the bundle bytes. */
  signatureB64: string
  /** Base64-encoded raw Ed25519 public key (32 bytes). */
  publicKeyB64: string
  /** Optional fetch init (timeout / auth headers / etc.). */
  fetchInit?: RequestInit
}

export interface VerifyDownloadResult {
  ok: boolean
  /** The downloaded bytes — only populated when `ok === true`. */
  payload?: Uint8Array
  /** When `ok === false`, why. */
  reason?: 'fetch-failed' | 'http-error' | 'bad-signature' | 'bad-key'
  /** HTTP status when applicable. */
  status?: number
}

export interface Updater {
  /** Show the updater UI and check for updates. */
  checkForUpdates: () => Promise<void>
  /** Silent check — no UI unless an update is found. */
  checkInBackground: () => Promise<void>
  /** Toggle scheduled background checks. */
  setAutomaticChecks: (on: boolean) => Promise<void>
  /** Background check interval in seconds. Default is provider-defined. */
  setCheckInterval: (seconds: number) => Promise<void>
  /** Set the appcast URL. Persists across launches. */
  setFeedURL: (url: string) => Promise<void>
  /** ISO date of the most recent check, or null. */
  getLastUpdateCheckDate: () => Promise<string | null>
  /** Latest known update info if an update has been found, else null. */
  getUpdateInfo: () => Promise<UpdateInfo | null>
  /** Subscribe to "update available" events. */
  onAvailable: (cb: (info: UpdateInfo) => void) => () => void
  /** Subscribe to "update downloaded and ready to install" events. */
  onDownloaded: (cb: (info: UpdateInfo) => void) => () => void
  /**
   * Verify an in-memory bundle against an Ed25519 signature. Sparkle-style:
   * publisher signs the file with their Ed25519 private key, the app pins
   * the matching public key, and rejects bundles whose signature doesn't
   * verify before staging the install.
   */
  verifySignature: (options: VerifyOptions) => Promise<boolean>
  /**
   * Fetch a bundle and verify its signature in one shot. On success the
   * downloaded bytes come back so the caller can hand them to the native
   * installer; on failure the `reason` says why so the UI can surface it.
   */
  verifyDownload: (options: VerifyDownloadOptions) => Promise<VerifyDownloadResult>
}

export const updater: Updater = {
  async checkForUpdates() {
    if (!hasBridge('updater')) return
    await window.craft!.updater.checkForUpdates()
  },
  async checkInBackground() {
    if (!hasBridge('updater')) return
    await window.craft!.updater.checkInBackground()
  },
  async setAutomaticChecks(on: boolean) {
    if (!hasBridge('updater')) return
    await window.craft!.updater.setAutomaticChecks(on)
  },
  async setCheckInterval(seconds: number) {
    if (!hasBridge('updater')) return
    // Sparkle / WinSparkle interpret a 0 or negative interval as
    // "disable scheduled checks" via the API of their respective
    // platforms — but several callers report unstable behaviour when
    // setting a tiny positive interval (e.g. 1s = check storm). Clamp
    // to a sensible range: ≤0 disables, ≥60s otherwise.
    if (!Number.isFinite(seconds)) {
      throw new Error('setCheckInterval: must be a finite number')
    }
    const safe = seconds <= 0 ? 0 : Math.max(60, Math.round(seconds))
    await window.craft!.updater.setCheckInterval(safe)
  },
  async setFeedURL(url: string) {
    if (!hasBridge('updater')) return
    await window.craft!.updater.setFeedURL(url)
  },
  async getLastUpdateCheckDate() {
    if (!hasBridge('updater')) return null
    const v = await window.craft!.updater.getLastUpdateCheckDate()
    return v || null
  },
  async getUpdateInfo() {
    if (!hasBridge('updater')) return null
    const v = await window.craft!.updater.getUpdateInfo()
    // Earlier `!v.version` rejected `'0.0.0'` (a valid downgrade
    // marker some apps use during testing). Distinguish "no info" from
    // "info with version" by checking presence of the field.
    if (!v || typeof v.version !== 'string' || v.version.length === 0) return null
    return v as UpdateInfo
  },
  onAvailable(cb) {
    return onCraftEvent<UpdateInfo>('craft:updateAvailable', cb)
  },
  onDownloaded(cb) {
    return onCraftEvent<UpdateInfo>('craft:updateDownloaded', cb)
  },

  async verifySignature({ payload, signatureB64, publicKeyB64 }) {
    const data = toArrayBufferBytes(payload)
    let publicKey: CryptoKey
    try {
      publicKey = await crypto.subtle.importKey(
        'raw',
        base64ToBytes(publicKeyB64),
        { name: 'Ed25519' },
        false,
        ['verify'],
      )
    }
    catch {
      return false
    }
    try {
      return await crypto.subtle.verify('Ed25519', publicKey, base64ToBytes(signatureB64), data)
    }
    catch {
      return false
    }
  },

  async verifyDownload({ url, signatureB64, publicKeyB64, fetchInit }) {
    let response: Response
    try {
      response = await fetch(url, fetchInit)
    }
    catch {
      return { ok: false, reason: 'fetch-failed' }
    }
    if (!response.ok) {
      return { ok: false, reason: 'http-error', status: response.status }
    }
    const buffer = new Uint8Array(await response.arrayBuffer())

    let publicKey: CryptoKey
    try {
      publicKey = await crypto.subtle.importKey(
        'raw',
        base64ToBytes(publicKeyB64),
        { name: 'Ed25519' },
        false,
        ['verify'],
      )
    }
    catch {
      return { ok: false, reason: 'bad-key' }
    }

    let valid = false
    try {
      valid = await crypto.subtle.verify('Ed25519', publicKey, base64ToBytes(signatureB64), toArrayBufferBytes(buffer))
    }
    catch {
      valid = false
    }
    if (!valid) return { ok: false, reason: 'bad-signature' }
    return { ok: true, payload: buffer }
  },
}

/**
 * Coerce arbitrary `BufferSource`-ish input into a `Uint8Array` whose
 * underlying storage is a plain `ArrayBuffer`. The Web Crypto types
 * insist on `ArrayBufferView<ArrayBuffer>`, which excludes the looser
 * `ArrayBufferLike` (covers `SharedArrayBuffer`) you get back from
 * `Response.arrayBuffer()` under TS strict mode.
 */
function toArrayBufferBytes(input: Uint8Array | ArrayBuffer): Uint8Array<ArrayBuffer> {
  if (input instanceof ArrayBuffer) return new Uint8Array(input)
  // Copy into a fresh ArrayBuffer to satisfy the strict crypto types
  // even when the source view points at a SharedArrayBuffer.
  const out = new ArrayBuffer(input.byteLength)
  const view = new Uint8Array(out)
  view.set(input)
  return view
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  // atob exists in webview + Bun; if neither (older Node test runner), fall
  // back to a hand-rolled decoder so this module loads everywhere.
  if (typeof atob === 'function') {
    const bin = atob(b64)
    const buffer = new ArrayBuffer(bin.length)
    const out = new Uint8Array(buffer)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  }
  // eslint-disable-next-line node/prefer-global/buffer
  const node = Buffer.from(b64, 'base64')
  const buf = new ArrayBuffer(node.length)
  new Uint8Array(buf).set(node)
  return new Uint8Array(buf)
}
