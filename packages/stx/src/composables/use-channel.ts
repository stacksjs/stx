/**
 * Broadcasting Channel Composables
 *
 * Reactive client-side subscriptions to ts-broadcasting channels.
 * Auto-connects to the stx broadcasting server, handles the WebSocket
 * protocol, and provides a subscriber-based reactive API.
 *
 * @example
 * ```ts
 * const channel = useChannel<{ count: number }>('metrics')
 *
 * channel.subscribe((state) => {
 *   console.log(state.data)        // latest event payload
 *   console.log(state.isSubscribed) // channel subscription status
 *   console.log(state.isConnected)  // WebSocket connection status
 * })
 *
 * // Listen for a specific event
 * channel.on('metrics.updated', (data) => {
 *   document.getElementById('cpu').textContent = data.cpu
 * })
 *
 * // Clean up
 * channel.close()
 * ```
 */

// ── Types ──────────────────────────────────────────────────────

export interface ChannelState<T = unknown> {
  /** Latest event payload received on this channel */
  data: T | null
  /** Last event name received */
  event: string | null
  /** Whether the channel subscription is confirmed */
  isSubscribed: boolean
  /** Whether the WebSocket is connected to the server */
  isConnected: boolean
  /** The socket ID assigned by the server */
  socketId: string | null
}

export interface ChannelOptions {
  /**
   * Broadcasting server host (auto-detected from window.location by default)
   */
  host?: string
  /**
   * Broadcasting server port
   * @default 6001
   */
  port?: number
  /**
   * URL scheme
   * @default 'ws'
   */
  scheme?: 'ws' | 'wss'
  /**
   * Connect immediately
   * @default true
   */
  autoConnect?: boolean
  /**
   * Auto-reconnect on disconnect
   * @default true
   */
  autoReconnect?: boolean
  /**
   * Max reconnection attempts
   * @default Infinity
   */
  maxReconnectAttempts?: number
  /**
   * Base delay between reconnection attempts (ms), doubles each attempt
   * @default 1000
   */
  reconnectDelay?: number
}

export interface ChannelRef<T = unknown> {
  /** Get the current state snapshot */
  get: () => ChannelState<T>
  /** Subscribe to all state changes */
  subscribe: (fn: (state: ChannelState<T>) => void) => () => void
  /** Listen for a specific broadcast event on this channel */
  on: (event: string, callback: (data: any) => void) => () => void
  /** Unsubscribe from the channel and close the connection */
  close: () => void
  /** Manually open / reconnect */
  open: () => void
}

// ── Helpers ────────────────────────────────────────────────────

declare global {
  interface Window {
    __stx_broadcasting?: { port?: number, host?: string, scheme?: string }
  }
}

function getDefaults(): { host: string, port: number, scheme: string } {
  const injected = typeof window !== 'undefined' ? window.__stx_broadcasting : undefined
  return {
    host: injected?.host ?? (typeof window !== 'undefined' ? window.location.hostname : 'localhost'),
    port: injected?.port ?? 6001,
    scheme: injected?.scheme ?? 'ws',
  }
}

// ── Composable ─────────────────────────────────────────────────

/**
 * Subscribe to a broadcasting channel.
 *
 * Connects to the stx broadcasting server via WebSocket, subscribes
 * to the named channel, and pushes every incoming event through the
 * reactive subscriber set.
 *
 * @param channelName - Channel to subscribe to (e.g. `'notifications'`, `'private-orders.123'`)
 * @param options     - Connection options (host, port, reconnect behaviour)
 */
export function useChannel<T = unknown>(
  channelName: string,
  options: ChannelOptions = {},
): ChannelRef<T> {
  const defaults = getDefaults()
  const host = options.host ?? defaults.host
  const port = options.port ?? defaults.port
  const scheme = options.scheme ?? (defaults.scheme as 'ws' | 'wss')
  const autoConnect = options.autoConnect ?? true
  const autoReconnect = options.autoReconnect ?? true
  const maxAttempts = options.maxReconnectAttempts ?? Number.POSITIVE_INFINITY
  const baseDelay = options.reconnectDelay ?? 1000

  // Reactive state
  const subscribers = new Set<(state: ChannelState<T>) => void>()
  const eventListeners = new Map<string, Set<(data: any) => void>>()

  let state: ChannelState<T> = {
    data: null,
    event: null,
    isSubscribed: false,
    isConnected: false,
    socketId: null,
  }

  let ws: WebSocket | null = null
  let retryCount = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let explicitlyClosed = false

  function notify(): void {
    for (const fn of subscribers) fn(state)
  }

  function emitEvent(event: string, data: any): void {
    const listeners = eventListeners.get(event)
    if (listeners) {
      for (const fn of listeners) fn(data)
    }
    // Also fire wildcard listeners
    const wildcards = eventListeners.get('*')
    if (wildcards) {
      for (const fn of wildcards) fn(data)
    }
  }

  function connect(): void {
    if (typeof WebSocket === 'undefined') return
    explicitlyClosed = false

    try {
      ws = new WebSocket(`${scheme}://${host}:${port}/ws`)
    }
    catch {
      scheduleReconnect()
      return
    }

    ws.onmessage = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data)

        // ts-broadcasting handshake
        if (msg.event === 'connection_established') {
          state = { ...state, isConnected: true, socketId: msg.data?.socket_id ?? null }
          notify()
          // Subscribe to the channel
          ws!.send(JSON.stringify({ event: 'subscribe', channel: channelName }))
          return
        }

        // Subscription confirmed
        if (msg.event === 'subscription_succeeded' && msg.channel === channelName) {
          state = { ...state, isSubscribed: true }
          retryCount = 0
          notify()
          return
        }

        // Subscription error
        if (msg.event === 'subscription_error' && msg.channel === channelName) {
          console.warn(`[stx] Channel subscription failed: ${channelName}`, msg.data)
          return
        }

        // Broadcast event on our channel
        if (msg.channel === channelName && msg.event) {
          state = { ...state, data: msg.data as T, event: msg.event }
          notify()
          emitEvent(msg.event, msg.data)
        }
      }
      catch { /* malformed message, ignore */ }
    }

    ws.onclose = () => {
      const wasSubscribed = state.isSubscribed
      state = { ...state, isConnected: false, isSubscribed: false, socketId: null }
      ws = null
      notify()

      if (!explicitlyClosed && autoReconnect) {
        scheduleReconnect()
      }
    }

    ws.onerror = () => {
      // onclose fires after onerror — reconnect is handled there
    }
  }

  function scheduleReconnect(): void {
    if (retryCount >= maxAttempts) return
    const delay = Math.min(baseDelay * 2 ** retryCount, 30_000)
    retryCount++
    retryTimer = setTimeout(connect, delay)
  }

  function close(): void {
    explicitlyClosed = true
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    if (ws) {
      // Gracefully unsubscribe before closing
      if (state.isSubscribed) {
        try { ws.send(JSON.stringify({ event: 'unsubscribe', channel: channelName })) }
        catch { /* already closing */ }
      }
      ws.close()
      ws = null
    }
    state = { data: null, event: null, isSubscribed: false, isConnected: false, socketId: null }
    notify()
  }

  // Kick off
  if (autoConnect) {
    connect()
  }

  return {
    get: () => state,

    subscribe: (fn) => {
      subscribers.add(fn)
      fn(state) // immediate callback with current state
      return () => { subscribers.delete(fn) }
    },

    on: (event, callback) => {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, new Set())
      }
      eventListeners.get(event)!.add(callback)
      return () => { eventListeners.get(event)?.delete(callback) }
    },

    close,
    open: connect,
  }
}
