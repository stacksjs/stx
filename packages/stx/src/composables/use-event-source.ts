/**
 * Event Source (SSE) Composables
 *
 * Reactive utilities for Server-Sent Events.
 */

export type EventSourceStatus = 'connecting' | 'open' | 'closed' | 'error'

export interface EventSourceState<T = unknown> {
  status: EventSourceStatus
  data: T | null
  event: string | null
  lastEventId: string | null
  error: Event | null
}

export interface EventSourceOptions {
  /**
   * Enable CORS credentials
   * @default false
   */
  withCredentials?: boolean
  /**
   * Auto-reconnect on disconnect
   * @default true
   */
  autoReconnect?: boolean | {
    retries?: number
    delay?: number
    onFailed?: () => void
  }
  /**
   * Connect immediately
   * @default true
   */
  immediate?: boolean
  /**
   * Event names to listen for (in addition to 'message')
   */
  events?: string[]
  /**
   * Called when connection opens
   */
  onOpen?: (event: Event) => void
  /**
   * Called when message received
   */
  onMessage?: (event: MessageEvent) => void
  /**
   * Called on error
   */
  onError?: (event: Event) => void
}

export interface EventSourceRef<T = unknown> {
  get: () => EventSourceState<T>
  subscribe: (fn: (state: EventSourceState<T>) => void) => () => void
  open: () => void
  close: () => void
  eventSource: () => EventSource | null
  on: (eventName: string, callback: (event: MessageEvent) => void) => () => void
}

/**
 * Check if EventSource is supported
 */
export function isEventSourceSupported(): boolean {
  return typeof window !== 'undefined' && 'EventSource' in window
}

/**
 * Create a reactive Server-Sent Events connection
 *
 * @example
 * ```ts
 * const sse = useEventSource('/api/events', {
 *   events: ['notification', 'update'],
 *   onMessage: (event) => console.log('Message:', event.data),
 * })
 *
 * // Subscribe to state changes
 * sse.subscribe((state) => {
 *   console.log('Status:', state.status)
 *   console.log('Last data:', state.data)
 * })
 *
 * // Listen to specific events
 * sse.on('notification', (event) => {
 *   console.log('Notification:', event.data)
 * })
 *
 * // Close connection
 * sse.close()
 * ```
 */
export function useEventSource<T = unknown>(
  url: string | URL,
  options: EventSourceOptions = {},
): EventSourceRef<T> {
  const {
    withCredentials = false,
    autoReconnect = true,
    immediate = true,
    events = [],
    onOpen,
    onMessage,
    onError,
  } = options

  const subscribers = new Set<(state: EventSourceState<T>) => void>()
  const eventListeners: Map<string, Set<(event: MessageEvent) => void>> = new Map()

  let state: EventSourceState<T> = {
    status: 'closed',
    data: null,
    event: null,
    lastEventId: null,
    error: null,
  }

  let eventSource: EventSource | null = null
  let retryCount = 0
  let explicitlyClosed = false

  function notify() {
    subscribers.forEach(fn => fn(state))
  }

  function emitEvent(eventName: string, event: MessageEvent) {
    const listeners = eventListeners.get(eventName)
    if (listeners) {
      listeners.forEach(fn => fn(event))
    }
  }

  function getReconnectConfig() {
    if (typeof autoReconnect === 'object') {
      return {
        retries: autoReconnect.retries ?? 3,
        delay: autoReconnect.delay ?? 1000,
        onFailed: autoReconnect.onFailed,
      }
    }
    return { retries: 3, delay: 1000, onFailed: undefined }
  }

  function connect() {
    if (!isEventSourceSupported()) {
      return
    }

    explicitlyClosed = false
    state = { ...state, status: 'connecting' }
    notify()

    try {
      eventSource = new EventSource(url.toString(), { withCredentials })

      eventSource.onopen = (event) => {
        state = { ...state, status: 'open' }
        retryCount = 0
        notify()
        onOpen?.(event)
      }

      eventSource.onmessage = (event) => {
        let parsedData: T
        try {
          parsedData = JSON.parse(event.data)
        }
        catch {
          parsedData = event.data as T
        }

        state = {
          ...state,
          data: parsedData,
          event: 'message',
          lastEventId: event.lastEventId || null,
        }
        notify()
        emitEvent('message', event)
        onMessage?.(event)
      }

      eventSource.onerror = (event) => {
        state = { ...state, status: 'error', error: event }
        notify()
        onError?.(event)

        // Close and attempt reconnect
        if (eventSource?.readyState === EventSource.CLOSED) {
          state = { ...state, status: 'closed' }
          notify()

          if (autoReconnect && !explicitlyClosed) {
            const config = getReconnectConfig()

            if (retryCount < config.retries) {
              retryCount++
              setTimeout(connect, config.delay * retryCount)
            }
            else {
              config.onFailed?.()
            }
          }
        }
      }

      // Add custom event listeners
      for (const eventName of events) {
        eventSource.addEventListener(eventName, (event: Event) => {
          const messageEvent = event as MessageEvent
          let parsedData: T
          try {
            parsedData = JSON.parse(messageEvent.data)
          }
          catch {
            parsedData = messageEvent.data as T
          }

          state = {
            ...state,
            data: parsedData,
            event: eventName,
            lastEventId: messageEvent.lastEventId || null,
          }
          notify()
          emitEvent(eventName, messageEvent)
        })
      }
    }
    catch (error) {
      state = { ...state, status: 'error', error: error as Event }
      notify()
    }
  }

  function close() {
    explicitlyClosed = true
    if (eventSource) {
      eventSource.close()
      eventSource = null
      state = { ...state, status: 'closed' }
      notify()
    }
  }

  function on(eventName: string, callback: (event: MessageEvent) => void) {
    if (!eventListeners.has(eventName)) {
      eventListeners.set(eventName, new Set())

      // Add listener to EventSource if it exists and event wasn't in initial list
      if (eventSource && !events.includes(eventName)) {
        eventSource.addEventListener(eventName, (event: Event) => {
          emitEvent(eventName, event as MessageEvent)
        })
      }
    }
    eventListeners.get(eventName)!.add(callback)

    return () => {
      eventListeners.get(eventName)?.delete(callback)
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
    open: connect,
    close,
    eventSource: () => eventSource,
    on,
  }
}

/**
 * Simple SSE connection for receiving JSON data
 *
 * @example
 * ```ts
 * const { data, status, close } = useSSE<{ count: number }>('/api/counter')
 *
 * data.subscribe((value) => {
 *   console.log('Count:', value?.count)
 * })
 * ```
 */
export function useSSE<T = unknown>(url: string) {
  const sse = useEventSource<T>(url)

  return {
    data: {
      get: () => sse.get().data,
      subscribe: (fn: (data: T | null) => void) => {
        return sse.subscribe((state) => fn(state.data))
      },
    },
    status: {
      get: () => sse.get().status,
      subscribe: (fn: (status: EventSourceStatus) => void) => {
        return sse.subscribe((state) => fn(state.status))
      },
    },
    close: sse.close,
    open: sse.open,
  }
}
