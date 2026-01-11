/**
 * Broadcast Channel Composables
 *
 * Reactive utilities for cross-tab/window communication using the BroadcastChannel API.
 */

export interface BroadcastChannelState<T = unknown> {
  isSupported: boolean
  isClosed: boolean
  channel: BroadcastChannel | null
  lastMessage: T | null
  error: Error | null
}

export interface BroadcastChannelOptions {
  /**
   * Called when a message is received
   */
  onMessage?: (event: MessageEvent) => void
  /**
   * Called when an error occurs
   */
  onError?: (event: MessageEvent) => void
}

export interface BroadcastChannelRef<T = unknown> {
  get: () => BroadcastChannelState<T>
  subscribe: (fn: (state: BroadcastChannelState<T>) => void) => () => void
  post: (message: T) => void
  close: () => void
  isSupported: () => boolean
}

type BroadcastEventType = 'message' | 'error'
type BroadcastEventCallback = (data: MessageEvent) => void

/**
 * Check if BroadcastChannel is supported
 */
export function isBroadcastChannelSupported(): boolean {
  return typeof window !== 'undefined' && 'BroadcastChannel' in window
}

/**
 * Create a reactive BroadcastChannel for cross-tab communication
 *
 * @example
 * ```ts
 * const channel = useBroadcastChannel('my-channel')
 *
 * // Subscribe to state changes
 * channel.subscribe((state) => {
 *   console.log('Last message:', state.lastMessage)
 * })
 *
 * // Post a message to all tabs
 * channel.post({ type: 'sync', data: { user: 'John' } })
 *
 * // Close when done
 * channel.close()
 * ```
 */
export function useBroadcastChannel<T = unknown>(
  channelName: string,
  options: BroadcastChannelOptions = {},
): BroadcastChannelRef<T> {
  const supported = isBroadcastChannelSupported()
  const subscribers = new Set<(state: BroadcastChannelState<T>) => void>()
  const eventListeners: Map<BroadcastEventType, Set<BroadcastEventCallback>> = new Map()

  let state: BroadcastChannelState<T> = {
    isSupported: supported,
    isClosed: false,
    channel: null,
    lastMessage: null,
    error: null,
  }

  function notify() {
    subscribers.forEach(fn => fn(state))
  }

  function emitEvent(type: BroadcastEventType, event: MessageEvent) {
    const listeners = eventListeners.get(type)
    if (listeners) {
      listeners.forEach(fn => fn(event))
    }
  }

  // Initialize channel
  if (supported) {
    try {
      const channel = new BroadcastChannel(channelName)

      channel.onmessage = (event: MessageEvent) => {
        state = { ...state, lastMessage: event.data as T }
        notify()
        emitEvent('message', event)
        options.onMessage?.(event)
      }

      channel.onmessageerror = (event: MessageEvent) => {
        state = { ...state, error: new Error('Message error') }
        notify()
        emitEvent('error', event)
        options.onError?.(event)
      }

      state = { ...state, channel }
    }
    catch (error) {
      state = { ...state, error: error as Error }
    }
  }

  function post(message: T) {
    if (state.channel && !state.isClosed) {
      state.channel.postMessage(message)
    }
  }

  function close() {
    if (state.channel && !state.isClosed) {
      state.channel.close()
      state = { ...state, isClosed: true, channel: null }
      notify()
    }
  }

  function on(event: BroadcastEventType, callback: BroadcastEventCallback) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set())
    }
    eventListeners.get(event)!.add(callback)

    return () => {
      eventListeners.get(event)?.delete(callback)
    }
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
    post,
    close,
    isSupported: () => supported,
    on,
  } as BroadcastChannelRef<T> & { on: typeof on }
}

/**
 * Simple one-shot broadcast to all tabs
 *
 * @example
 * ```ts
 * broadcast('app-events', { type: 'logout' })
 * ```
 */
export function broadcast<T = unknown>(channelName: string, message: T): void {
  if (!isBroadcastChannelSupported()) {
    return
  }

  const channel = new BroadcastChannel(channelName)
  channel.postMessage(message)
  channel.close()
}
