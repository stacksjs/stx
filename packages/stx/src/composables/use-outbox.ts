/**
 * useOutbox - writes that survive having no network
 *
 * A request that cannot reach the server right now (no signal in a gym, a
 * tunnel, a server restarting) is kept on the device and sent when it can be:
 * when the browser says it is online again, when the page comes back to the
 * foreground, and on a backoff timer while anything is waiting. The caller
 * learns at once whether its write went through or is waiting, so a screen
 * can say "Saved on this phone, it syncs when you are back online" instead of
 * "Load failed" with the work gone.
 *
 * Entries are plain data (url, method, headers, body) in localStorage, so they
 * outlive a reload or the app being closed. The function that actually sends
 * them is given each time the outbox is created, so it can add credentials
 * that are current at send time (a bearer token) rather than ones stored with
 * the entry.
 *
 * What counts as delivered: any answer from the server except a 5xx, 408,
 * 429 or 401. A 401 is credentials that are not there yet (the page still
 * loading its session) or have run out, not a verdict on the write, so it
 * waits for a sign-in; name the outbox per account so it is never sent with
 * someone else's. Any other 4xx is the server saying no; sending it again
 * would get the same answer, so it is dropped and reported through
 * `onRejected`.
 *
 * A request that takes longer than `timeoutMs` (15 s) is given up on and kept
 * for later, rather than leaving the screen waiting on a gym's one bar of
 * signal. It may still have reached the server, so every entry carries an
 * `Idempotency-Key` header, the same on every attempt: a server that honours
 * it applies the write once however many times it arrives.
 *
 * An entry can say which reads it changes (`affects`: query keys or URLs) and
 * how (`apply`, or a named function in `overlays`). Until it is delivered,
 * cached queries (`cachedQuery`, `useQuery`) show their data with it applied,
 * so the person's own change does not vanish when the screen refetches from a
 * server that has not heard of it yet; once it is, they refetch. `entries()`
 * and `pendingFor()` tell a screen what is still only on this phone.
 */

import { queryTargetMatches } from '../offline/query-cache'

export interface OutboxEntry {
  id: string
  url: string
  method: string
  headers: Record<string, string>
  body: string | null
  /** Anything the app wants back when the entry is sent or rejected. */
  meta?: Record<string, unknown>
  createdAt: number
  attempts: number
  /** Not before this time (ms), after a failed attempt. */
  nextAt: number
  /** Sent as `Idempotency-Key` on every attempt, so the server can apply the write once. */
  idempotencyKey?: string
  /** The reads this write changes: query keys, or the URLs they GET. */
  affects?: string[]
  /** The name of the function in the outbox's `overlays` that applies it to those reads. */
  overlay?: string
}

/** Applies a waiting write to the data of a read it affects. */
export type OutboxOverlay = (data: any, entry: OutboxEntry, target: { key: string, url?: string | null }) => any

export interface OutboxSendInit extends RequestInit {
  /** Persist before sending and return immediately. Delivery runs in the background. */
  background?: boolean
  meta?: Record<string, unknown>
  /** The reads this write changes: query keys, or the URLs they GET. */
  affects?: string[]
  /**
   * Applies it to those reads while it waits. Kept in memory: after a
   * reload, an entry is applied by its `overlay` name (or the outbox's
   * `apply`) instead.
   */
  apply?: OutboxOverlay
  /** The name of a function in `overlays` that applies it; survives a reload. */
  overlay?: string
}

export type OutboxSendResult =
  | { status: 'sent', response: Response }
  | { status: 'queued', entry: OutboxEntry }
  | { status: 'rejected', response: Response }

export interface OutboxOptions {
  /** How to send: defaults to `fetch`. Called at send time, so it can add current credentials. */
  fetch?: (url: string, init: RequestInit) => Promise<Response>
  /** Storage for the queue (defaults to localStorage, or memory where there is none). */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  /** First retry delay in ms (doubles each attempt, capped at maxDelayMs). Default 5000. */
  retryDelayMs?: number
  /** Default 5 minutes. */
  maxDelayMs?: number
  /** Called after a queued entry finally reached the server. */
  onSent?: (entry: OutboxEntry, response: Response) => void
  /** Called when the server refused a queued entry (4xx): it is dropped. */
  onRejected?: (entry: OutboxEntry, response: Response) => void
  /** Give up on one attempt after this long, ms, and keep the entry. Default 15000. */
  timeoutMs?: number
  /** Send `Idempotency-Key` with every entry. Default true. */
  idempotency?: boolean
  /** Named overlays, for entries sent with `overlay: 'name'`. */
  overlays?: Record<string, OutboxOverlay>
  /** The overlay for an entry that names none. */
  apply?: OutboxOverlay
}

export interface Outbox {
  /** Send now; keep it for later if the network or the server is not there. */
  send: (url: string, init?: OutboxSendInit) => Promise<OutboxSendResult>
  /** Try everything that is waiting and due (or everything, with `force`). */
  flush: (force?: boolean) => Promise<void>
  /** What is waiting, oldest first: what a screen can mark "Saved on this phone". */
  entries: () => OutboxEntry[]
  /** What is waiting that affects this read (a query key or URL). */
  pendingFor: (keyOrUrl: string) => OutboxEntry[]
  /** How many are waiting. */
  readonly pending: number
  /** Called with the waiting count (and the entries) whenever it changes; returns an unsubscribe. */
  subscribe: (callback: (pending: number, entries: OutboxEntry[]) => void) => () => void
  /** `data` with the waiting writes that affect this read applied, oldest first (only entry `onlyId`, when given). */
  overlay: <T>(target: { key: string, url?: string | null }, data: T, onlyId?: string) => T
  /** Stop listening for the network and the timer. */
  stop: () => void
}

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const data = new Map<string, string>()
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value) },
    removeItem: (key) => { data.delete(key) },
  }
}

function defaultStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage
    }
  }
  catch {}
  return memoryStorage()
}

/** Whether an answer means "try again later" rather than "done" or "no". */
function retryable(response: Response): boolean {
  return response.status >= 500 || response.status === 408 || response.status === 429 || response.status === 401
}

function headersOf(init: RequestInit | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  const given = init?.headers
  if (!given) return out
  if (typeof Headers !== 'undefined' && given instanceof Headers) {
    given.forEach((value, key) => { out[key] = value })
    return out
  }
  if (Array.isArray(given)) {
    for (const [key, value] of given) out[key] = value
    return out
  }
  return { ...(given as Record<string, string>) }
}

/** Every outbox on the page, which cached queries read their overlays from. */
function registry(): Map<string, Outbox> {
  const g = globalThis as any
  if (!(g.__stx_outboxes instanceof Map))
    g.__stx_outboxes = new Map()
  return g.__stx_outboxes
}

/** Tell the page's cached queries the outbox changed (`sent`: an entry that just reached the server). */
function announce(name: string, entries: OutboxEntry[], sent?: OutboxEntry): void {
  const target: any = typeof window !== 'undefined' ? window : globalThis
  const Event: typeof CustomEvent | undefined = target.CustomEvent || (typeof CustomEvent !== 'undefined' ? CustomEvent : undefined)
  if (!Event || typeof target.dispatchEvent !== 'function')
    return
  try {
    target.dispatchEvent(new Event('stx:outbox', { detail: { name, pending: entries.length, entries, sent: sent || null } }))
  }
  catch {}
}

/**
 * Give up on a request after `ms`, keeping any signal the caller passed.
 * AbortSignal.timeout where there is one; a timer where there is not.
 */
function timeoutSignal(ms: number, given?: AbortSignal | null): { signal?: AbortSignal, done: () => void } {
  if (typeof AbortController === 'undefined')
    return { signal: given || undefined, done: () => {} }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new DOMException('The request took too long.', 'TimeoutError')), ms)
  const onAbort = (): void => controller.abort(given?.reason)
  if (given) {
    if (given.aborted)
      controller.abort(given.reason)
    else given.addEventListener('abort', onAbort, { once: true })
  }
  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer)
      given?.removeEventListener('abort', onAbort)
    },
  }
}

let counter = 0
function newId(): string {
  counter = (counter + 1) % 1e6
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const outboxes = new Map<string, Outbox>()

/**
 * One outbox per name per page: calling it again with the same name returns
 * the same outbox (with the latest options' sender).
 *
 * @example
 * ```ts
 * const outbox = useOutbox('saves', { fetch: (url, init) => auth.authFetch(url, init) })
 * const result = await outbox.send('/api/workouts/5/complete', { method: 'POST', body: JSON.stringify(data) })
 * if (result.status === 'queued') message.set('Saved on this phone. It syncs when you are back online.')
 * ```
 */
export function useOutbox(name: string, options: OutboxOptions = {}): Outbox {
  const existing = outboxes.get(name) as (Outbox & { __setOptions?: (o: OutboxOptions) => void }) | undefined
  if (existing) {
    existing.__setOptions?.(options)
    return existing
  }

  let opts = options
  const storage = options.storage ?? defaultStorage()
  let persistent = options.storage !== undefined
  try {
    persistent ||= typeof localStorage !== 'undefined' && storage === localStorage
  }
  catch {}
  const key = `stx-outbox:${name}`
  const listeners = new Set<(pending: number, entries: OutboxEntry[]) => void>()
  // Inline overlays, by entry id. Functions cannot be stored with the entry,
  // so after a reload an entry is applied by its overlay name instead.
  const applies = new Map<string, OutboxOverlay>()
  let timer: ReturnType<typeof setTimeout> | null = null
  let flushing: Promise<void> | null = null

  const read = (): OutboxEntry[] => {
    try {
      const parsed = JSON.parse(storage.getItem(key) || '[]')
      return Array.isArray(parsed) ? parsed : []
    }
    catch {
      return []
    }
  }
  const write = (list: OutboxEntry[], durable = false): void => {
    try {
      if (list.length) storage.setItem(key, JSON.stringify(list))
      else storage.removeItem(key)
    }
    catch (error) {
      // A background save must never acknowledge data it could not keep.
      if (durable) throw error
    }
    for (const known of Array.from(applies.keys())) {
      if (!list.some(entry => entry.id === known))
        applies.delete(known)
    }
    for (const listener of listeners) listener(list.length, list)
    announce(name, list)
    schedule(list)
  }

  const withKey = (entry: OutboxEntry, headers: Record<string, string>): Record<string, string> => {
    if (opts.idempotency === false || !entry.idempotencyKey)
      return headers
    for (const header of Object.keys(headers)) {
      if (header.toLowerCase() === 'idempotency-key')
        return headers
    }
    return { ...headers, 'Idempotency-Key': entry.idempotencyKey }
  }

  /** One attempt, given up on after timeoutMs. Throws when there is no answer. */
  async function attempt(url: string, init: RequestInit): Promise<Response> {
    const limit = timeoutSignal(opts.timeoutMs ?? 15_000, init.signal)
    try {
      return await sender()(url, { ...init, signal: limit.signal })
    }
    finally {
      limit.done()
    }
  }

  const sender = (): ((url: string, init: RequestInit) => Promise<Response>) =>
    opts.fetch ?? ((url, init) => fetch(url, init))

  const delayFor = (attempts: number): number =>
    Math.min(opts.maxDelayMs ?? 300_000, (opts.retryDelayMs ?? 5000) * 2 ** Math.max(0, attempts - 1))

  function schedule(list: OutboxEntry[]): void {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (!list.length || typeof setTimeout === 'undefined') return
    const soonest = Math.min(...list.map(entry => entry.nextAt))
    timer = setTimeout(() => { void flush() }, Math.max(1000, soonest - Date.now()))
  }

  async function deliver(entry: OutboxEntry): Promise<'sent' | 'rejected' | 'kept'> {
    let response: Response
    try {
      response = await attempt(entry.url, { method: entry.method, headers: withKey(entry, entry.headers), body: entry.body ?? undefined })
    }
    catch {
      return 'kept'
    }
    if (retryable(response)) return 'kept'
    if (response.ok) opts.onSent?.(entry, response)
    else opts.onRejected?.(entry, response)
    return response.ok ? 'sent' : 'rejected'
  }

  async function flush(force = false): Promise<void> {
    if (flushing) return flushing
    flushing = (async () => {
      // One at a time and in order: a later write may depend on an earlier one.
      for (const entry of read()) {
        if (!force && entry.nextAt > Date.now()) break
        const outcome = await deliver(entry)
        const list = read()
        const at = list.findIndex(item => item.id === entry.id)
        if (outcome === 'kept') {
          if (at >= 0) {
            list[at] = { ...list[at]!, attempts: list[at]!.attempts + 1, nextAt: Date.now() + delayFor(list[at]!.attempts + 1) }
            write(list)
          }
          break
        }
        if (at >= 0) {
          // Heard while the entry is still listed, so a cached query can keep
          // showing it until its refetch includes it.
          if (outcome === 'sent')
            announce(name, list, list[at])
          list.splice(at, 1)
          write(list)
        }
      }
    })()
    try {
      await flushing
    }
    finally {
      flushing = null
    }
  }

  async function send(url: string, init: OutboxSendInit = {}): Promise<OutboxSendResult> {
    const { background, meta, affects, apply, overlay, ...requestInit } = init
    const id = newId()
    const entry: OutboxEntry = {
      id,
      url,
      method: (requestInit.method || 'GET').toUpperCase(),
      headers: headersOf(requestInit),
      body: typeof requestInit.body === 'string' ? requestInit.body : requestInit.body == null ? null : String(requestInit.body),
      meta,
      createdAt: Date.now(),
      attempts: 0,
      nextAt: 0,
      idempotencyKey: id,
    }
    if (Array.isArray(affects) && affects.length)
      entry.affects = affects.filter(item => typeof item === 'string' && item)
    if (typeof overlay === 'string' && overlay)
      entry.overlay = overlay
    const keep = (nextAt: number): OutboxSendResult => {
      if (typeof apply === 'function')
        applies.set(id, apply)
      write([...read(), { ...entry, attempts: background ? 0 : 1, nextAt }], background)
      return { status: 'queued', entry }
    }
    if (background) {
      if (!persistent) throw new Error('Persistent storage is unavailable. Keep this screen open and try again.')
      const result = keep(0)
      // Let the caller apply its optimistic result before delivery callbacks.
      setTimeout(() => { void flush() }, 0)
      return result
    }
    // Behind something already waiting, a write must wait its turn too.
    if (read().length) {
      const result = keep(Date.now())
      void flush()
      return result
    }
    let response: Response
    try {
      response = await attempt(url, { ...requestInit, method: entry.method, headers: withKey(entry, entry.headers) })
    }
    catch {
      return keep(Date.now() + delayFor(1))
    }
    if (retryable(response))
      return keep(Date.now() + delayFor(1))
    // Reached the server at once: the reads it changed fetch again.
    if (response.ok && entry.affects)
      announce(name, read(), entry)
    return response.ok ? { status: 'sent', response } : { status: 'rejected', response }
  }

  const matching = (entry: OutboxEntry, target: { key: string, url?: string | null }): boolean =>
    !!entry.affects && entry.affects.some(item => queryTargetMatches(item, target))

  function overlayOf<T>(target: { key: string, url?: string | null }, data: T, onlyId?: string): T {
    let out: any = data
    for (const entry of read()) {
      if ((onlyId && entry.id !== onlyId) || !matching(entry, target))
        continue
      const fn = applies.get(entry.id) || (entry.overlay ? opts.overlays?.[entry.overlay] : undefined) || opts.apply
      if (!fn)
        continue
      try {
        out = fn(out, entry, target)
      }
      catch {}
    }
    return out as T
  }

  const onOnline = (): void => { void flush(true) }
  const onVisible = (): void => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') void flush(true)
  }
  if (typeof addEventListener === 'function') addEventListener('online', onOnline)
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible)

  const outbox: Outbox & { __setOptions: (o: OutboxOptions) => void } = {
    send,
    flush,
    entries: read,
    pendingFor: (keyOrUrl: string) => read().filter(entry => matching(entry, { key: keyOrUrl, url: keyOrUrl })),
    overlay: overlayOf,
    get pending() { return read().length },
    subscribe(callback) {
      listeners.add(callback)
      return () => { listeners.delete(callback) }
    },
    stop() {
      if (timer) clearTimeout(timer)
      timer = null
      if (typeof removeEventListener === 'function') removeEventListener('online', onOnline)
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible)
      outboxes.delete(name)
      if (registry().get(name) === outbox)
        registry().delete(name)
    },
    __setOptions(next) {
      opts = { ...opts, ...next }
    },
  }
  outboxes.set(name, outbox)
  registry().set(name, outbox)
  // Anything left from before (a reload, the app closed offline) goes now.
  schedule(read())
  if (read().length) void flush(true)
  return outbox
}
