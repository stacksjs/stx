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
}
