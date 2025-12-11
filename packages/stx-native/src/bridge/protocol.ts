/**
 * STX Native Bridge Protocol
 *
 * Defines the communication protocol between JavaScript runtime
 * and native platform code (iOS/Android).
 *
 * Message Flow:
 * 1. JS → Native: UI updates, event handler calls, API requests
 * 2. Native → JS: Event callbacks, API responses, lifecycle events
 */

// ============================================================================
// Message Types
// ============================================================================

/**
 * All possible message types in the bridge protocol
 */
export type BridgeMessageType =
  // Rendering
  | 'RENDER'              // Render a new component tree
  | 'UPDATE'              // Update existing component(s)
  | 'REMOVE'              // Remove component(s) from tree

  // Events
  | 'EVENT'               // Native event (touch, scroll, etc.)
  | 'EVENT_RESPONSE'      // JS response to event

  // State
  | 'STATE_UPDATE'        // State changed, need re-render
  | 'STATE_SYNC'          // Sync state between JS and native

  // Navigation
  | 'NAVIGATE'            // Navigate to a new screen
  | 'NAVIGATE_BACK'       // Go back
  | 'NAVIGATE_REPLACE'    // Replace current screen

  // Lifecycle
  | 'APP_STATE'           // App foreground/background
  | 'SCREEN_FOCUS'        // Screen gained/lost focus
  | 'MEMORY_WARNING'      // Low memory warning

  // API
  | 'API_REQUEST'         // Call native API
  | 'API_RESPONSE'        // Native API response
  | 'API_ERROR'           // Native API error

  // Dev Tools
  | 'HOT_RELOAD'          // Hot reload triggered
  | 'DEBUG_LOG'           // Debug logging
  | 'INSPECT'             // Inspector request
  | 'PERFORMANCE'         // Performance metrics

/**
 * Base message structure
 */
export interface BridgeMessage<T = unknown> {
  /** Unique message ID for request/response matching */
  id: string

  /** Message type */
  type: BridgeMessageType

  /** Timestamp when message was created */
  timestamp: number

  /** Message payload */
  payload: T

  /** Optional correlation ID for multi-message flows */
  correlationId?: string

  /** Source of the message */
  source: 'js' | 'native'
}

// ============================================================================
// Payload Types
// ============================================================================

/**
 * RENDER message payload
 */
export interface RenderPayload {
  /** The STX IR document or node to render */
  document: import('../compiler/ir').STXDocument | import('../compiler/ir').STXNode

  /** Target container ID (for partial renders) */
  containerId?: string

  /** Whether to replace or append */
  mode: 'replace' | 'append' | 'prepend'
}

/**
 * UPDATE message payload
 */
export interface UpdatePayload {
  /** Updates to apply, keyed by component ID */
  updates: Array<{
    /** Component key/ID */
    key: string

    /** New props (partial) */
    props?: Record<string, unknown>

    /** New style (partial) */
    style?: Partial<import('../compiler/ir').STXStyle>

    /** New children */
    children?: (import('../compiler/ir').STXNode | string)[]
  }>
}

/**
 * REMOVE message payload
 */
export interface RemovePayload {
  /** Component keys to remove */
  keys: string[]
}

/**
 * EVENT message payload (Native → JS)
 */
export interface EventPayload {
  /** Event type (onPress, onScroll, etc.) */
  eventType: string

  /** Target component key */
  targetKey: string

  /** Handler function name */
  handlerName: string

  /** Native event data */
  nativeEvent: {
    /** Event timestamp */
    timestamp: number

    /** Touch/gesture data */
    touches?: Array<{
      x: number
      y: number
      force?: number
      identifier: number
    }>

    /** Scroll data */
    contentOffset?: { x: number; y: number }
    contentSize?: { width: number; height: number }
    layoutMeasurement?: { width: number; height: number }

    /** Text input data */
    text?: string
    selection?: { start: number; end: number }

    /** Layout data */
    layout?: { x: number; y: number; width: number; height: number }

    /** Generic data */
    [key: string]: unknown
  }
}

/**
 * STATE_UPDATE message payload
 */
export interface StateUpdatePayload {
  /** State key that changed */
  key: string

  /** New value */
  value: unknown

  /** Previous value (for diffing) */
  previousValue?: unknown
}

/**
 * NAVIGATE message payload
 */
export interface NavigatePayload {
  /** Screen/route name */
  screen: string

  /** Navigation params */
  params?: Record<string, unknown>

  /** Transition animation */
  animation?: 'push' | 'modal' | 'fade' | 'none'
}

/**
 * APP_STATE message payload
 */
export interface AppStatePayload {
  /** Current app state */
  state: 'active' | 'inactive' | 'background'

  /** Previous state */
  previousState?: 'active' | 'inactive' | 'background'
}

/**
 * API_REQUEST message payload
 */
export interface ApiRequestPayload {
  /** API module (e.g., 'clipboard', 'storage', 'camera') */
  module: string

  /** Method to call */
  method: string

  /** Method arguments */
  args: unknown[]
}

/**
 * API_RESPONSE message payload
 */
export interface ApiResponsePayload {
  /** Request ID this is responding to */
  requestId: string

  /** Response data */
  data: unknown

  /** Success flag */
  success: boolean
}

/**
 * API_ERROR message payload
 */
export interface ApiErrorPayload {
  /** Request ID this is responding to */
  requestId: string

  /** Error code */
  code: string

  /** Error message */
  message: string

  /** Stack trace (dev only) */
  stack?: string
}

/**
 * HOT_RELOAD message payload
 */
export interface HotReloadPayload {
  /** Files that changed */
  changedFiles: string[]

  /** New document to render */
  document?: import('../compiler/ir').STXDocument

  /** Whether to preserve state */
  preserveState: boolean
}

/**
 * PERFORMANCE message payload
 */
export interface PerformancePayload {
  /** Metric type */
  metric: 'fps' | 'memory' | 'render_time' | 'bridge_latency'

  /** Metric value */
  value: number

  /** Additional context */
  context?: Record<string, unknown>
}

// ============================================================================
// Bridge Implementation
// ============================================================================

type MessageHandler<T = unknown> = (message: BridgeMessage<T>) => void | Promise<void>
type PendingRequest = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

/**
 * Bridge class for JS side
 */
export class STXBridge {
  private messageId = 0
  private handlers = new Map<BridgeMessageType, Set<MessageHandler>>()
  private pendingRequests = new Map<string, PendingRequest>()
  private nativeBridge: NativeBridgeInterface | null = null

  /** Default timeout for requests (ms) */
  private defaultTimeout = 30000

  /**
   * Initialize the bridge with the native interface
   */
  initialize(nativeBridge: NativeBridgeInterface): void {
    this.nativeBridge = nativeBridge

    // Set up native → JS message handler
    nativeBridge.onMessage((rawMessage: string) => {
      try {
        const message = JSON.parse(rawMessage) as BridgeMessage
        this.handleIncomingMessage(message)
      } catch (error) {
        console.error('[STXBridge] Failed to parse message:', error)
      }
    })
  }

  /**
   * Send a message to native (fire and forget)
   */
  send<T>(type: BridgeMessageType, payload: T): string {
    const message = this.createMessage(type, payload)
    this.postToNative(message)
    return message.id
  }

  /**
   * Send a request to native and wait for response
   */
  async request<T, R>(
    type: BridgeMessageType,
    payload: T,
    timeout = this.defaultTimeout
  ): Promise<R> {
    const message = this.createMessage(type, payload)

    return new Promise<R>((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(message.id)
        reject(new Error(`Request ${message.id} timed out after ${timeout}ms`))
      }, timeout)

      // Store pending request
      this.pendingRequests.set(message.id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: timeoutId,
      })

      // Send message
      this.postToNative(message)
    })
  }

  /**
   * Subscribe to messages of a specific type
   */
  on<T>(type: BridgeMessageType, handler: MessageHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler as MessageHandler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler as MessageHandler)
    }
  }

  /**
   * Subscribe to a message type once
   */
  once<T>(type: BridgeMessageType, handler: MessageHandler<T>): () => void {
    const wrappedHandler: MessageHandler<T> = (message) => {
      unsubscribe()
      handler(message)
    }
    const unsubscribe = this.on(type, wrappedHandler)
    return unsubscribe
  }

  // ========================================================================
  // Convenience Methods
  // ========================================================================

  /**
   * Render a document or node
   */
  render(
    document: import('../compiler/ir').STXDocument | import('../compiler/ir').STXNode,
    options: { containerId?: string; mode?: 'replace' | 'append' | 'prepend' } = {}
  ): string {
    return this.send<RenderPayload>('RENDER', {
      document,
      containerId: options.containerId,
      mode: options.mode || 'replace',
    })
  }

  /**
   * Update components
   */
  update(updates: UpdatePayload['updates']): string {
    return this.send<UpdatePayload>('UPDATE', { updates })
  }

  /**
   * Remove components
   */
  remove(keys: string[]): string {
    return this.send<RemovePayload>('REMOVE', { keys })
  }

  /**
   * Navigate to a screen
   */
  navigate(
    screen: string,
    params?: Record<string, unknown>,
    animation?: NavigatePayload['animation']
  ): string {
    return this.send<NavigatePayload>('NAVIGATE', { screen, params, animation })
  }

  /**
   * Go back
   */
  goBack(): string {
    return this.send('NAVIGATE_BACK', {})
  }

  /**
   * Call a native API
   */
  async callNativeAPI<T>(module: string, method: string, ...args: unknown[]): Promise<T> {
    return this.request<ApiRequestPayload, T>('API_REQUEST', {
      module,
      method,
      args,
    })
  }

  /**
   * Log to native console (for debugging)
   */
  log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    this.send('DEBUG_LOG', { level, message, data })
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  private createMessage<T>(type: BridgeMessageType, payload: T): BridgeMessage<T> {
    return {
      id: `js_${++this.messageId}_${Date.now()}`,
      type,
      timestamp: Date.now(),
      payload,
      source: 'js',
    }
  }

  private postToNative(message: BridgeMessage): void {
    if (!this.nativeBridge) {
      console.error('[STXBridge] Native bridge not initialized')
      return
    }

    try {
      this.nativeBridge.postMessage(JSON.stringify(message))
    } catch (error) {
      console.error('[STXBridge] Failed to post message:', error)
    }
  }

  private handleIncomingMessage(message: BridgeMessage): void {
    // Check if this is a response to a pending request
    if (message.correlationId && this.pendingRequests.has(message.correlationId)) {
      const pending = this.pendingRequests.get(message.correlationId)!
      this.pendingRequests.delete(message.correlationId)
      clearTimeout(pending.timeout)

      if (message.type === 'API_ERROR') {
        const error = message.payload as ApiErrorPayload
        pending.reject(new Error(`${error.code}: ${error.message}`))
      } else {
        pending.resolve((message.payload as ApiResponsePayload).data)
      }
      return
    }

    // Dispatch to handlers
    const handlers = this.handlers.get(message.type)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message)
        } catch (error) {
          console.error(`[STXBridge] Handler error for ${message.type}:`, error)
        }
      }
    }
  }
}

// ============================================================================
// Native Bridge Interface
// ============================================================================

/**
 * Interface that native code must implement
 */
export interface NativeBridgeInterface {
  /**
   * Post a message to native
   */
  postMessage(message: string): void

  /**
   * Register callback for messages from native
   */
  onMessage(callback: (message: string) => void): void
}

/**
 * Platform-specific native bridge implementations
 */
export const NativeBridges = {
  /**
   * iOS (JavaScriptCore)
   */
  ios: (): NativeBridgeInterface | null => {
    // @ts-expect-error - JSC global
    if (typeof webkit !== 'undefined' && webkit.messageHandlers?.stx) {
      return {
        postMessage: (message: string) => {
          // @ts-expect-error - JSC global
          webkit.messageHandlers.stx.postMessage(message)
        },
        onMessage: (callback: (message: string) => void) => {
          // @ts-expect-error - Global registration
          globalThis.__stxNativeCallback = callback
        },
      }
    }
    return null
  },

  /**
   * Android (JavaScriptInterface)
   */
  android: (): NativeBridgeInterface | null => {
    // @ts-expect-error - Android global
    if (typeof STXNative !== 'undefined') {
      return {
        postMessage: (message: string) => {
          // @ts-expect-error - Android global
          STXNative.postMessage(message)
        },
        onMessage: (callback: (message: string) => void) => {
          // @ts-expect-error - Global registration
          globalThis.__stxNativeCallback = callback
        },
      }
    }
    return null
  },

  /**
   * Web (PostMessage)
   */
  web: (): NativeBridgeInterface | null => {
    if (typeof window !== 'undefined') {
      return {
        postMessage: (message: string) => {
          window.postMessage({ type: 'stx', message }, '*')
        },
        onMessage: (callback: (message: string) => void) => {
          window.addEventListener('message', (event) => {
            if (event.data?.type === 'stx-native') {
              callback(event.data.message)
            }
          })
        },
      }
    }
    return null
  },
}

/**
 * Auto-detect and initialize the bridge
 */
export function createBridge(): STXBridge {
  const bridge = new STXBridge()

  // Try each platform
  const nativeBridge =
    NativeBridges.ios() ||
    NativeBridges.android() ||
    NativeBridges.web()

  if (nativeBridge) {
    bridge.initialize(nativeBridge)
  } else {
    console.warn('[STXBridge] No native bridge available, running in mock mode')
  }

  return bridge
}

// ============================================================================
// Singleton Instance
// ============================================================================

let bridgeInstance: STXBridge | null = null

/**
 * Get the global bridge instance
 */
export function getBridge(): STXBridge {
  if (!bridgeInstance) {
    bridgeInstance = createBridge()
  }
  return bridgeInstance
}

// ============================================================================
// Event Helpers
// ============================================================================

/**
 * Create an event handler that calls the bridge
 */
export function createEventHandler(
  handlerName: string,
  targetKey: string
): (nativeEvent: EventPayload['nativeEvent']) => void {
  return (nativeEvent) => {
    getBridge().send<EventPayload>('EVENT_RESPONSE', {
      eventType: 'callback',
      targetKey,
      handlerName,
      nativeEvent,
    })
  }
}

/**
 * Register a JS function to be callable from native
 */
export function registerHandler(
  name: string,
  handler: (...args: unknown[]) => unknown
): void {
  // @ts-expect-error - Global registration
  globalThis.__stxHandlers = globalThis.__stxHandlers || {}
  // @ts-expect-error - Global registration
  globalThis.__stxHandlers[name] = handler
}

/**
 * Call a registered handler (used by native)
 */
export function callHandler(name: string, ...args: unknown[]): unknown {
  // @ts-expect-error - Global registration
  const handler = globalThis.__stxHandlers?.[name]
  if (handler) {
    return handler(...args)
  }
  console.warn(`[STXBridge] Handler not found: ${name}`)
  return undefined
}
