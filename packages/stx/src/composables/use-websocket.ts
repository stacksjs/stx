// @ts-nocheck - Skip type checking due to nullable WebSocket type issues
/**
 * WebSocket Composables
 *
 * Reactive utilities for WebSocket communication with auto-reconnect support.
 */

export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed'

export interface WebSocketState<T = unknown> {
  status: WebSocketStatus
  data: T | null
  error: Event | null
  ws: WebSocket | null
}

export interface WebSocketOptions {
  /**
   * Protocols for the WebSocket connection
   */
  protocols?: string | string[]
  /**
   * Auto-reconnect on disconnect
   * @default false
   */
  autoReconnect?: boolean | {
    retries?: number
    delay?: number
    maxDelay?: number
    onFailed?: () => void
  }
  /**
   * Heartbeat configuration to keep connection alive
   */
  heartbeat?: boolean | {
    message?: string | ArrayBuffer | Blob
    interval?: number
    pongTimeout?: number
  }
  /**
   * Connect immediately
   * @default true
   */
  immediate?: boolean
  /**
   * Called when connection opens
   */
  onOpen?: (event: Event) => void
  /**
   * Called when message received
   */
  onMessage?: (event: MessageEvent) => void
  /**
   * Called when connection closes
   */
  onClose?: (event: CloseEvent) => void
  /**
   * Called on error
   */
  onError?: (event: Event) => void
}

export interface WebSocketRef<T = unknown> {
  get: () => WebSocketState<T>
  subscribe: (fn: (state: WebSocketState<T>) => void) => () => void
  send: (data: string | ArrayBuffer | Blob) => boolean
  open: () => void
  close: (code?: number, reason?: string) => void
  ws: () => WebSocket | null
}

type WebSocketEventType = 'open' | 'message' | 'close' | 'error'
type WebSocketEventCallback = (event: Event | MessageEvent | CloseEvent) => void

/**
 * Check if WebSocket is supported
 */
export function isWebSocketSupported(): boolean {
  return typeof window !== 'undefined' && 'WebSocket' in window
}

/**
 * Create a reactive WebSocket connection
 *
 * @example
 * ```ts
 * const ws = useWebSocket('wss://echo.websocket.org', {
 *   autoReconnect: true,
 *   onMessage: (event) => console.log('Received:', event.data),
 * })
 *
 * // Subscribe to state changes
 * ws.subscribe((state) => {
 *   console.log('Status:', state.status)
 *   console.log('Last data:', state.data)
 * })
 *
 * // Send a message
 * ws.send('Hello!')
 *
 * // Close connection
 * ws.close()
 * ```
 */
export function useWebSocket<T = unknown>(
  url: string | URL,
  options: WebSocketOptions = {},
): WebSocketRef<T> & { on: (event: WebSocketEventType, callback: WebSocketEventCallback) => () => void } {
  const {
    protocols,
    autoReconnect = false,
    heartbeat = false,
    immediate = true,
    onOpen,
    onMessage,
    onClose,
    onError,
  } = options

  const subscribers = new Set<(state: WebSocketState<T>) => void>()
  const eventListeners: Map<WebSocketEventType, Set<WebSocketEventCallback>> = new Map()

  let state: WebSocketState<T> = {
    status: 'closed',
    data: null,
    error: null,
    ws: null,
  }

  let retryCount = 0
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null
  let pongTimeout: ReturnType<typeof setTimeout> | null = null
  let explicitlyClosed = false

  function notify() {
    subscribers.forEach(fn => fn(state))
  }

  function emitEvent(type: WebSocketEventType, event: Event | MessageEvent | CloseEvent) {
    const listeners = eventListeners.get(type)
    if (listeners) {
      listeners.forEach(fn => fn(event))
    }
  }

  function resetHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    if (pongTimeout) {
      clearTimeout(pongTimeout)
      pongTimeout = null
    }
  }

  function startHeartbeat(ws: WebSocket) {
    if (!heartbeat)
      return

    const config = typeof heartbeat === 'object'
      ? heartbeat
      : { message: 'ping', interval: 30000, pongTimeout: 10000 }

    resetHeartbeat()

    heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(config.message || 'ping')

        pongTimeout = setTimeout(() => {
          ws.close()
        }, config.pongTimeout || 10000)
      }
    }, config.interval || 30000)
  }

  function getReconnectConfig() {
    if (typeof autoReconnect === 'object') {
      return {
        retries: autoReconnect.retries ?? 3,
        delay: autoReconnect.delay ?? 1000,
        maxDelay: autoReconnect.maxDelay ?? 10000,
        onFailed: autoReconnect.onFailed,
      }
    }
    return { retries: 3, delay: 1000, maxDelay: 10000, onFailed: undefined }
  }

  function connect() {
    if (!isWebSocketSupported()) {
      return
    }

    explicitlyClosed = false
    state = { ...state, status: 'connecting' }
    notify()

    try {
      const ws = new WebSocket(url, protocols)
      state = { ...state, ws }

      ws.onopen = (event) => {
        state = { ...state, status: 'open' }
        retryCount = 0
        notify()
        startHeartbeat(ws)
        emitEvent('open', event)
        onOpen?.(event)
      }

      ws.onmessage = (event) => {
        if (heartbeat && pongTimeout) {
          clearTimeout(pongTimeout)
          pongTimeout = null
        }

        let parsedData: T
        try {
          parsedData = JSON.parse(event.data)
        }
        catch {
          parsedData = event.data as T
        }

        state = { ...state, data: parsedData }
        notify()
        emitEvent('message', event)
        onMessage?.(event)
      }

      ws.onclose = (event) => {
        resetHeartbeat()
        state = { ...state, status: 'closed', ws: null }
        notify()
        emitEvent('close', event)
        onClose?.(event)

        // Auto-reconnect logic
        if (autoReconnect && !explicitlyClosed) {
          const config = getReconnectConfig()

          if (retryCount < config.retries) {
            const delay = Math.min(
              config.delay * 2 ** retryCount,
              config.maxDelay,
            )
            retryCount++
            setTimeout(connect, delay)
          }
          else {
            config.onFailed?.()
          }
        }
      }

      ws.onerror = (event) => {
        state = { ...state, error: event }
        notify()
        emitEvent('error', event)
        onError?.(event)
      }
    }
    catch (error) {
      state = { ...state, status: 'closed', error: error as Event }
      notify()
    }
  }

  function send(data: string | ArrayBuffer | Blob): boolean {
    if (state.ws && state.status === 'open') {
      const message = typeof data === 'object' && !(data instanceof ArrayBuffer) && !(data instanceof Blob)
        ? JSON.stringify(data)
        : data
      state.ws.send(message)
      return true
    }
    return false
  }

  function close(code?: number, reason?: string) {
    explicitlyClosed = true
    resetHeartbeat()
    if (state.ws) {
      state = { ...state, status: 'closing' }
      notify()
      state.ws.close(code, reason)
    }
  }

  function on(event: WebSocketEventType, callback: WebSocketEventCallback) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set())
    }
    eventListeners.get(event)!.add(callback)

    return () => {
      eventListeners.get(event)?.delete(callback)
    }
  }

  // Connect immediately if requested
  if (immediate) {
    connect()
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      subscribers.add(fn)
      fn(state)
      return () => {
        subscribers.delete(fn)
      }
    },
    send,
    open: connect,
    close,
    ws: () => state.ws,
    on,
  }
}
