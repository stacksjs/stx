export interface BroadcastStreamFrame { channel: string, event: string, data: unknown }
export interface BroadcastStreamClientOptions {
  request: (path: string, init?: RequestInit) => Promise<Response>
  endpoint: string
  onMessage: (frame: BroadcastStreamFrame) => void
  /** Reconcile durable state after every connection, including reconnects. */
  onConnected?: () => void
  onStatus?: (connected: boolean) => void
  reconnectDelay?: number
}

/** Native authenticated Stacks broadcast stream; bearer credentials stay in request headers. */
export function useBroadcastStream(options: BroadcastStreamClientOptions): { close: () => void } {
  let closed = false
  let abort: AbortController | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let attempts = 0
  async function connect() {
    if (closed) return
    abort = new AbortController()
    try {
      const response = await options.request(options.endpoint, { signal: abort.signal, headers: { Accept: 'text/event-stream' } })
      if (!response.ok || !response.body || !response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('Broadcast stream unavailable')
      if (closed) { await response.body.cancel(); return }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      attempts = 0; options.onStatus?.(true); options.onConnected?.()
      try {
        while (!closed) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
          if (buffer.length > 1024 * 1024) throw new Error('Broadcast frame too large')
          let end: number
          while ((end = buffer.indexOf('\n\n')) !== -1) {
            const block = buffer.slice(0, end); buffer = buffer.slice(end + 2)
            const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n')
            if (!data) continue
            const frame = JSON.parse(data)
            if (typeof frame.channel === 'string' && typeof frame.event === 'string') options.onMessage(frame)
          }
        }
      }
      finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
    }
    catch { /* A fresh authenticated request is made after reconnecting. */ }
    finally {
      options.onStatus?.(false)
      if (!closed) timer = setTimeout(connect, Math.min((options.reconnectDelay ?? 1000) * 2 ** attempts++, 30000))
    }
  }
  void connect()
  return { close() { closed = true; abort?.abort(); if (timer) clearTimeout(timer); options.onStatus?.(false) } }
}
