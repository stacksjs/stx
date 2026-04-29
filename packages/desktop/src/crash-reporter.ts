/**
 * Crash Reporter
 *
 * Capture unhandled exceptions and queue them for forwarding to a
 * backend of your choice. The native side stores up to 64 most-recent
 * entries in memory (ring buffer); call `flush()` periodically to
 * drain and forward.
 *
 * **Why the design**: we deliberately don't ship a built-in HTTP
 * uploader. Apps care strongly about WHERE crash reports go (data
 * residency, privacy disclosures, retention) — picking a default
 * would surprise users. `flush()` returns the queue, `clear()` empties
 * it; that's enough to compose any backend on top.
 *
 * Browser fallback: keeps a JS-side queue with the same shape so
 * call sites don't branch. No automatic upload either way.
 */

import { hasBridge } from './_bridge'

export type CrashSeverity = 'fatal' | 'error' | 'warning'

export interface CrashReport {
  severity?: CrashSeverity
  message: string
  /** Where the crash originated. Defaults to `'js'`. */
  source?: 'js' | 'native'
  /** Stack trace, if available. */
  stack?: string
}

export interface StoredCrashEntry {
  timestamp: number
  severity: string
  message: string
  source: string
  stack: string
  userId?: string
  appVersion?: string
}

export interface CrashReporterAPI {
  /**
   * Report a crash. Accepts either a `CrashReport` object or a
   * native `Error` — both get normalized to the storage shape.
   */
  report: (entry: CrashReport | Error) => Promise<void>
  /** Drain the queue and return the entries. Doesn't clear the queue. */
  flush: () => Promise<StoredCrashEntry[]>
  /** Empty the queue. */
  clear: () => Promise<void>
  /** Toggle reporting on/off. When off, `report()` is a no-op. */
  setEnabled: (on: boolean) => Promise<void>
  isEnabled: () => Promise<boolean>
  /** Tag every subsequent crash with this user id. */
  setUser: (id: string) => Promise<void>
  /** Tag every subsequent crash with this app version. */
  setAppVersion: (version: string) => Promise<void>
  /**
   * One-shot setup: hook `window.onerror` and `unhandledrejection`
   * so every uncaught failure routes through `report()` automatically.
   * Returns an `off()` to detach the global handlers.
   */
  attachGlobalHandlers: () => () => void
}

// JS-side fallback queue when native isn't available.
const jsQueue: StoredCrashEntry[] = []
let jsEnabled = true
let jsUserId: string | undefined
let jsAppVersion: string | undefined

export const crashReporter: CrashReporterAPI = {
  async report(entry) {
    if (hasBridge('crashReporter')) {
      await window.craft!.crashReporter.report(entry)
      return
    }
    if (!jsEnabled) return
    const normalized: StoredCrashEntry = entry instanceof Error
      ? {
          timestamp: Date.now(),
          severity: 'error',
          message: entry.message,
          source: 'js',
          stack: entry.stack || '',
          userId: jsUserId,
          appVersion: jsAppVersion,
        }
      : {
          timestamp: Date.now(),
          severity: entry.severity || 'error',
          message: entry.message || '',
          source: entry.source || 'js',
          stack: entry.stack || '',
          userId: jsUserId,
          appVersion: jsAppVersion,
        }
    if (jsQueue.length >= 64) jsQueue.shift()
    jsQueue.push(normalized)
  },

  async flush() {
    if (hasBridge('crashReporter')) return await window.craft!.crashReporter.flush()
    return [...jsQueue]
  },

  async clear() {
    if (hasBridge('crashReporter')) {
      await window.craft!.crashReporter.clear()
      return
    }
    jsQueue.length = 0
  },

  async setEnabled(on) {
    if (hasBridge('crashReporter')) {
      await window.craft!.crashReporter.setEnabled(on)
      return
    }
    jsEnabled = on
  },

  async isEnabled() {
    if (hasBridge('crashReporter')) return await window.craft!.crashReporter.isEnabled()
    return jsEnabled
  },

  async setUser(id) {
    if (hasBridge('crashReporter')) {
      await window.craft!.crashReporter.setUser(id)
      return
    }
    jsUserId = id || undefined
  },

  async setAppVersion(version) {
    if (hasBridge('crashReporter')) {
      await window.craft!.crashReporter.setAppVersion(version)
      return
    }
    jsAppVersion = version || undefined
  },

  attachGlobalHandlers() {
    if (hasBridge('crashReporter') && window.craft!.crashReporter.attachGlobalHandlers) {
      return window.craft!.crashReporter.attachGlobalHandlers()
    }
    if (typeof window === 'undefined') return () => {}
    const errorH = (e: ErrorEvent) => {
      crashReporter.report({
        severity: 'error',
        message: e.message,
        source: 'js',
        stack: e.error?.stack || `${e.message}\n  at ${e.filename}:${e.lineno}:${e.colno}`,
      }).catch(() => {})
    }
    const rejectH = (e: PromiseRejectionEvent) => {
      const r: any = e.reason
      crashReporter.report({
        severity: 'error',
        message: r?.message || String(r),
        source: 'js',
        stack: r?.stack || '',
      }).catch(() => {})
    }
    window.addEventListener('error', errorH)
    window.addEventListener('unhandledrejection', rejectH)
    return () => {
      window.removeEventListener('error', errorH)
      window.removeEventListener('unhandledrejection', rejectH)
    }
  },
}
