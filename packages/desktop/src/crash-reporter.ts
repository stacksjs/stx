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

export interface CrashForwarderOptions {
  /** Where to POST the JSON payload. */
  endpoint: string
  /**
   * How often to drain the queue, in ms. Default: 60_000 (one minute).
   * Set to 0 to disable the timer (you'll call `flushNow()` yourself).
   */
  intervalMs?: number
  /**
   * Optional shared secret. If supplied, every POST gets an
   * `X-Craft-Signature: hex(HMAC-SHA256(secret, body))` header so the
   * receiver can authenticate the report.
   */
  signingSecret?: string
  /**
   * PII redaction. Defaults to `true` — strips emails, IPv4 addresses,
   * and absolute home paths from `message` and `stack`. Pass `false`
   * to send raw, or a custom function to do your own scrubbing.
   */
  redact?: boolean | ((entry: StoredCrashEntry) => StoredCrashEntry)
  /**
   * Extra headers to merge onto every request (auth tokens, etc.).
   */
  headers?: Record<string, string>
  /**
   * How many retries to attempt before dropping a batch. Default: 5.
   * Backoff doubles each attempt starting from 1 second.
   */
  maxRetries?: number
  /**
   * Persist the pending queue under this `localStorage` key so reports
   * survive a webview reload. Default: `'craft:crashReporter:pending'`.
   * Pass `null` to disable persistence.
   */
  persistKey?: string | null
}

export interface CrashForwarderHandle {
  /** Force a flush right now, bypassing the timer. */
  flushNow: () => Promise<void>
  /** Stop the timer and detach. The pending queue stays persisted. */
  stop: () => void
  /** Inspect what's currently waiting to be sent. */
  pending: () => StoredCrashEntry[]
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
  /**
   * Wire a periodic HTTP forwarder. Drains `flush()` on a timer and
   * POSTs `{ entries: [...] }` to `endpoint`. Failed requests retry
   * with exponential backoff; the unsent batch is persisted to
   * localStorage so a reload doesn't lose it. Returns a handle with
   * `stop()` and `flushNow()`.
   */
  forwardTo: (options: CrashForwarderOptions) => CrashForwarderHandle
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

  forwardTo(options) {
    return startForwarder(options)
  },
}

// =============================================================================
// HTTP Forwarder
// =============================================================================

const DEFAULT_PERSIST_KEY = 'craft:crashReporter:pending'

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
const HOME_PATH_RE = /\/(?:Users|home)\/[^\s/'"`]+/g

/** Default redactor — replaces emails, IPv4s, and home paths with placeholders. */
export function redactPII(entry: StoredCrashEntry): StoredCrashEntry {
  const scrub = (s: string): string => s
    .replace(EMAIL_RE, '<email>')
    .replace(IPV4_RE, '<ip>')
    .replace(HOME_PATH_RE, '/<home>')
  return {
    ...entry,
    message: scrub(entry.message),
    stack: scrub(entry.stack),
  }
}

/** Sign `body` with HMAC-SHA256 + `secret`. Returns lowercase hex. */
export async function signPayload(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function loadPersisted(key: string | null | undefined): StoredCrashEntry[] {
  if (!key || typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as StoredCrashEntry[] : []
  }
  catch {
    return []
  }
}

function savePersisted(key: string | null | undefined, entries: StoredCrashEntry[]): void {
  if (!key || typeof localStorage === 'undefined') return
  try {
    if (entries.length === 0) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(entries))
  }
  catch { /* quota / disabled — best effort */ }
}

function startForwarder(options: CrashForwarderOptions): CrashForwarderHandle {
  const {
    endpoint,
    intervalMs = 60_000,
    signingSecret,
    redact = true,
    headers = {},
    maxRetries = 5,
    persistKey,
  } = options

  // Default the persist key only when the caller didn't explicitly opt out.
  // `persistKey === null` disables persistence; `undefined` falls back to
  // the standard key.
  const storageKey: string | null = persistKey === null
    ? null
    : (persistKey ?? DEFAULT_PERSIST_KEY)

  let pending: StoredCrashEntry[] = loadPersisted(storageKey)
  let stopped = false
  let timer: ReturnType<typeof setInterval> | null = null
  let inFlight: Promise<void> | null = null

  const redactor = typeof redact === 'function'
    ? redact
    : redact === false
      ? (e: StoredCrashEntry) => e
      : redactPII

  async function postBatch(batch: StoredCrashEntry[]): Promise<void> {
    const body = JSON.stringify({ entries: batch })
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    }
    if (signingSecret) {
      requestHeaders['X-Craft-Signature'] = await signPayload(signingSecret, body)
    }

    let attempt = 0
    let delay = 1000
    while (!stopped) {
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: requestHeaders, body })
        if (res.ok) return
        // 4xx — drop, since retrying would just fail again.
        if (res.status >= 400 && res.status < 500) return
        throw new Error(`HTTP ${res.status}`)
      }
      catch (err) {
        attempt += 1
        if (attempt > maxRetries) {
          // Re-queue at the front so the next tick retries from a fresh batch.
          pending = [...batch, ...pending]
          savePersisted(storageKey, pending)
          throw err
        }
        await new Promise<void>((r) => { setTimeout(r, delay) })
        delay = Math.min(delay * 2, 60_000)
      }
    }
  }

  async function drain(): Promise<void> {
    if (stopped || inFlight) return inFlight ?? undefined
    const fresh = await crashReporter.flush()
    if (fresh.length > 0) await crashReporter.clear()
    pending = [...pending, ...fresh.map(e => redactor(e))]
    if (pending.length === 0) return

    const batch = pending
    pending = []
    savePersisted(storageKey, pending)

    inFlight = postBatch(batch)
      .catch(() => { /* batch was already requeued in postBatch */ })
      .finally(() => { inFlight = null })
    return inFlight
  }

  if (intervalMs > 0) {
    timer = setInterval(() => { drain().catch(() => {}) }, intervalMs)
  }

  return {
    async flushNow() { await drain() },
    stop() {
      stopped = true
      if (timer) clearInterval(timer)
      timer = null
    },
    pending() { return [...pending] },
  }
}
