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
 * What counts as delivered: any answer from the server except a 5xx, 408 or
 * 429. A 4xx is the server saying no; sending it again would get the same
 * answer, so it is dropped and reported through `onRejected`.
 */

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
}

export interface Outbox {
  /** Send now; keep it for later if the network or the server is not there. */
  send: (url: string, init?: RequestInit & { meta?: Record<string, unknown> }) => Promise<OutboxSendResult>
  /** Try everything that is waiting and due (or everything, with `force`). */
  flush: (force?: boolean) => Promise<void>
  /** What is waiting, oldest first. */
  entries: () => OutboxEntry[]
  /** How many are waiting. */
  readonly pending: number
  /** Called with the waiting count whenever it changes; returns an unsubscribe. */
  subscribe: (callback: (pending: number) => void) => () => void
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
      const probe = '__stx_outbox_probe__'
      localStorage.setItem(probe, '1')
      localStorage.removeItem(probe)
      return localStorage
    }
  }
  catch {}
  return memoryStorage()
}

/** Whether an answer means "try again later" rather than "done" or "no". */
function retryable(response: Response): boolean {
  return response.status >= 500 || response.status === 408 || response.status === 429
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
  const key = `stx-outbox:${name}`
  const listeners = new Set<(pending: number) => void>()
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
  const write = (list: OutboxEntry[]): void => {
    try {
      if (list.length) storage.setItem(key, JSON.stringify(list))
      else storage.removeItem(key)
    }
    catch {}
    for (const listener of listeners) listener(list.length)
    schedule(list)
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
      response = await sender()(entry.url, { method: entry.method, headers: entry.headers, body: entry.body ?? undefined })
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

  async function send(url: string, init: RequestInit & { meta?: Record<string, unknown> } = {}): Promise<OutboxSendResult> {
    const { meta, ...requestInit } = init
    const entry: OutboxEntry = {
      id: newId(),
      url,
      method: (requestInit.method || 'GET').toUpperCase(),
      headers: headersOf(requestInit),
      body: typeof requestInit.body === 'string' ? requestInit.body : requestInit.body == null ? null : String(requestInit.body),
      meta,
      createdAt: Date.now(),
      attempts: 0,
      nextAt: 0,
    }
    // Behind something already waiting, a write must wait its turn too.
    if (read().length) {
      write([...read(), { ...entry, attempts: 1, nextAt: Date.now() }])
      void flush()
      return { status: 'queued', entry }
    }
    let response: Response
    try {
      response = await sender()(url, { ...requestInit, method: entry.method })
    }
    catch {
      write([...read(), { ...entry, attempts: 1, nextAt: Date.now() + delayFor(1) }])
      return { status: 'queued', entry }
    }
    if (retryable(response)) {
      write([...read(), { ...entry, attempts: 1, nextAt: Date.now() + delayFor(1) }])
      return { status: 'queued', entry }
    }
    return response.ok ? { status: 'sent', response } : { status: 'rejected', response }
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
    },
    __setOptions(next) {
      opts = { ...opts, ...next }
    },
  }
  outboxes.set(name, outbox)
  // Anything left from before (a reload, the app closed offline) goes now.
  schedule(read())
  if (read().length) void flush(true)
  return outbox
}
