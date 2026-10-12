/**
 * Responses read as they arrive, on a native screen.
 *
 * A native screen's `fetch` is one request to the host and one answer, which
 * is no use for a server-sent event stream: the answer never ends. A request
 * that accepts `text/event-stream` goes to the host's `Network.stream`
 * instead (when it advertises `eventStream`). The host answers with the head,
 * then sends every piece of the body as it comes (`NETWORK_STREAM`). Here the
 * pieces become a `response.body` reader, which is all the web's stream
 * readers use (`@stacksjs/stx`'s `useBroadcastStream`), and an `EventSource`
 * on top of that, which can send headers (a bearer token) as the browser's
 * cannot.
 */

type AnyRecord = Record<string, any> // eslint-disable-line ts/no-explicit-any

interface ReadResult { done: boolean, value?: Uint8Array }

/** Where the host's pieces go: in order, then the end or a failure. */
export interface StreamSink {
  push: (text: string) => void
  end: () => void
  fail: (message: string) => void
}

/**
 * A `response.body` fed by `sink`. `cancel` tells the host to stop sending;
 * it runs once, whichever way the reader stops.
 */
export function createStreamingBody(encode: (text: string) => Uint8Array, cancel: () => void): { body: AnyRecord, sink: StreamSink, text: () => Promise<string>, used: () => boolean } {
  const queue: Uint8Array[] = []
  const waiting: Array<{ resolve: (result: ReadResult) => void, reject: (error: unknown) => void }> = []
  const decoded: string[] = []
  let finished = false
  let failure: Error | null = null
  let cancelled = false
  let locked = false

  const stop = (): void => {
    if (cancelled) return
    cancelled = true
    if (!finished) cancel()
    finished = true
    queue.length = 0
    while (waiting.length) waiting.shift()!.resolve({ done: true, value: undefined })
  }

  const sink: StreamSink = {
    push(text) {
      if (finished) return
      decoded.push(text)
      const value = encode(text)
      const reader = waiting.shift()
      if (reader) reader.resolve({ done: false, value })
      else queue.push(value)
    },
    end() {
      if (finished) return
      finished = true
      while (waiting.length) waiting.shift()!.resolve({ done: true, value: undefined })
    },
    fail(message) {
      if (finished) return
      finished = true
      failure = new TypeError(message || 'Network connection lost')
      while (waiting.length) waiting.shift()!.reject(failure)
    },
  }

  const read = (): Promise<ReadResult> => {
    if (queue.length) return Promise.resolve({ done: false, value: queue.shift() })
    if (failure) return Promise.reject(failure)
    if (finished) return Promise.resolve({ done: true, value: undefined })
    return new Promise((resolve, reject) => waiting.push({ resolve, reject }))
  }

  const body = {
    get locked() { return locked },
    getReader() {
      if (locked) throw new TypeError('The response body is already being read')
      locked = true
      return {
        read,
        cancel: (): Promise<void> => { stop(); return Promise.resolve() },
        releaseLock: (): void => { locked = false },
        closed: Promise.resolve(),
      }
    },
    cancel: (): Promise<void> => { stop(); return Promise.resolve() },
  }

  const text = async (): Promise<string> => {
    const reader = body.getReader()
    while (!(await reader.read()).done) { /* drained into `decoded` as it came */ }
    return decoded.join('')
  }

  return { body, sink, text, used: () => locked }
}

/**
 * `EventSource`, on the streaming `fetch`. Standard but for one addition the
 * browser's lacks: `new EventSource(url, { headers })`, since a native screen
 * signs its requests with a token rather than a cookie.
 */
export function createEventSourceClass(target: AnyRecord): AnyRecord {
  class NativeEventSource {
    static readonly CONNECTING = 0
    static readonly OPEN = 1
    static readonly CLOSED = 2
    readonly CONNECTING = 0
    readonly OPEN = 1
    readonly CLOSED = 2

    readonly url: string
    readonly withCredentials: boolean
    readyState = 0
    onopen: ((event: AnyRecord) => void) | null = null
    onmessage: ((event: AnyRecord) => void) | null = null
    onerror: ((event: AnyRecord) => void) | null = null

    private listeners = new Map<string, Set<(event: AnyRecord) => void>>()
    private headers: Record<string, string>
    private controller: AnyRecord | null = null
    private timer: unknown = null
    private retry = 3000
    private lastEventId = ''

    constructor(url: string, init: { headers?: Record<string, string>, withCredentials?: boolean } = {}) {
      this.url = String(url)
      this.withCredentials = Boolean(init.withCredentials)
      this.headers = { ...(init.headers || {}) }
      Promise.resolve().then(() => this.connect())
    }

    addEventListener(type: string, listener: (event: AnyRecord) => void): void {
      if (typeof listener !== 'function') return
      const group = this.listeners.get(type) ?? new Set()
      group.add(listener)
      this.listeners.set(type, group)
    }

    removeEventListener(type: string, listener: (event: AnyRecord) => void): void {
      this.listeners.get(type)?.delete(listener)
    }

    dispatchEvent(event: AnyRecord): boolean {
      const handler = (this as AnyRecord)[`on${event.type}`]
      if (typeof handler === 'function') handler.call(this, event)
      for (const listener of [...(this.listeners.get(event.type) ?? [])]) listener.call(this, event)
      return true
    }

    close(): void {
      this.readyState = 2
      if (this.timer !== null) target.clearTimeout(this.timer)
      this.timer = null
      this.controller?.abort()
      this.controller = null
    }

    private emit(type: string, extra: AnyRecord = {}): void {
      this.dispatchEvent({ type, target: this, currentTarget: this, ...extra })
    }

    private reconnect(): void {
      if (this.readyState === 2) return
      this.readyState = 0
      this.emit('error')
      if (this.readyState === 2) return
      this.timer = target.setTimeout(() => {
        this.timer = null
        this.connect()
      }, this.retry)
    }

    private async connect(): Promise<void> {
      if (this.readyState === 2) return
      const controller = new target.AbortController()
      this.controller = controller
      const headers: Record<string, string> = { 'Accept': 'text/event-stream', 'Cache-Control': 'no-cache', ...this.headers }
      if (this.lastEventId) headers['Last-Event-ID'] = this.lastEventId
      let response: AnyRecord
      try {
        response = await target.fetch(this.url, { headers, signal: controller.signal })
      }
      catch {
        if (this.controller === controller) this.reconnect()
        return
      }
      if (this.controller !== controller || this.readyState === 2) {
        response.body?.cancel?.()
        return
      }
      // As the browser does: a response that is not a stream fails for good.
      const type = String(response.headers?.get?.('content-type') || '')
      if (response.status !== 200 || !type.toLowerCase().includes('text/event-stream') || !response.body) {
        this.readyState = 2
        response.body?.cancel?.()
        this.emit('error')
        return
      }
      this.readyState = 1
      this.emit('open')
      const reader = response.body.getReader()
      const decoder = new target.TextDecoder()
      let buffer = ''
      let data = ''
      let event = ''
      const line = (text: string): void => {
        if (text === '') {
          if (data) {
            this.emit(event || 'message', { data: data.endsWith('\n') ? data.slice(0, -1) : data, lastEventId: this.lastEventId, origin: originOf(this.url) })
          }
          data = ''
          event = ''
          return
        }
        if (text.startsWith(':')) return
        const colon = text.indexOf(':')
        const field = colon === -1 ? text : text.slice(0, colon)
        let value = colon === -1 ? '' : text.slice(colon + 1)
        if (value.startsWith(' ')) value = value.slice(1)
        if (field === 'data') data += `${value}\n`
        else if (field === 'event') event = value
        else if (field === 'id' && !value.includes('\0')) this.lastEventId = value
        else if (field === 'retry' && /^\d+$/.test(value)) this.retry = Number(value)
      }
      try {
        while (this.readyState !== 2) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let end: number
          // eslint-disable-next-line no-cond-assign
          while ((end = buffer.search(/\r\n|\r|\n/)) !== -1) {
            const width = buffer[end] === '\r' && buffer[end + 1] === '\n' ? 2 : 1
            // A lone \r at the end may be the first half of \r\n.
            if (buffer[end] === '\r' && end + 1 === buffer.length) break
            line(buffer.slice(0, end))
            buffer = buffer.slice(end + width)
          }
        }
      }
      catch { /* the connection dropped; reconnect below */ }
      finally {
        reader.cancel?.().catch?.(() => {})
      }
      if (this.controller === controller) this.reconnect()
    }
  }
  return NativeEventSource
}

function originOf(url: string): string {
  const match = /^([a-z][a-z0-9+.-]*:\/\/[^/?#]+)/i.exec(url)
  return match ? match[1] : ''
}
