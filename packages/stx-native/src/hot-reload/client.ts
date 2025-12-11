/**
 * STX Native Hot Reload Client
 *
 * Client-side hot reload implementation that runs in the JS runtime
 * and communicates with the dev server via WebSocket.
 */

import type { STXDocument, STXNode } from '../compiler/ir'
import { getBridge } from '../bridge/protocol'

// ============================================================================
// Types
// ============================================================================

interface HotReloadMessage {
  type: 'HOT_RELOAD' | 'FULL_RELOAD' | 'ERROR'
  payload: {
    changedFiles?: string[]
    document?: STXDocument
    preserveState?: boolean
    error?: string
  }
}

interface HotReloadState {
  /** Current state values */
  state: Record<string, unknown>
  /** Scroll positions */
  scrollPositions: Map<string, { x: number; y: number }>
  /** Focus state */
  focusedKey: string | null
  /** Input values */
  inputValues: Map<string, string>
}

type HotReloadCallback = (document: STXDocument) => void

// ============================================================================
// Hot Reload Client
// ============================================================================

class HotReloadClient {
  private ws: WebSocket | null = null
  private serverUrl: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private callbacks: Set<HotReloadCallback> = new Set()
  private savedState: HotReloadState | null = null
  private isConnected = false

  constructor(serverUrl = 'ws://localhost:8081') {
    this.serverUrl = serverUrl
  }

  // ========================================================================
  // Connection Management
  // ========================================================================

  /**
   * Connect to the hot reload server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[HotReload] Already connected')
      return
    }

    try {
      this.ws = new WebSocket(this.serverUrl)

      this.ws.onopen = () => {
        console.log('[HotReload] Connected to dev server')
        this.isConnected = true
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.ws.onerror = (error) => {
        console.error('[HotReload] WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('[HotReload] Disconnected from dev server')
        this.isConnected = false
        this.attemptReconnect()
      }
    } catch (error) {
      console.error('[HotReload] Failed to connect:', error)
      this.attemptReconnect()
    }
  }

  /**
   * Disconnect from the hot reload server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[HotReload] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1)

    console.log(`[HotReload] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  // ========================================================================
  // Message Handling
  // ========================================================================

  private handleMessage(data: string): void {
    try {
      const message: HotReloadMessage = JSON.parse(data)

      switch (message.type) {
        case 'HOT_RELOAD':
          this.handleHotReload(message.payload)
          break
        case 'FULL_RELOAD':
          this.handleFullReload()
          break
        case 'ERROR':
          this.handleError(message.payload.error || 'Unknown error')
          break
        default:
          console.warn('[HotReload] Unknown message type:', message.type)
      }
    } catch (error) {
      console.error('[HotReload] Failed to parse message:', error)
    }
  }

  private handleHotReload(payload: HotReloadMessage['payload']): void {
    console.log('[HotReload] Received update for:', payload.changedFiles)

    // Save current state if preserving
    if (payload.preserveState) {
      this.saveState()
    }

    // Notify callbacks
    if (payload.document) {
      for (const callback of this.callbacks) {
        try {
          callback(payload.document)
        } catch (error) {
          console.error('[HotReload] Callback error:', error)
        }
      }

      // Re-render via bridge
      this.applyUpdate(payload.document)

      // Restore state
      if (payload.preserveState && this.savedState) {
        this.restoreState()
      }
    }
  }

  private handleFullReload(): void {
    console.log('[HotReload] Full reload requested')
    // In a native context, this might restart the JS runtime
    // For now, just log
    if (typeof location !== 'undefined') {
      location.reload()
    }
  }

  private handleError(error: string): void {
    console.error('[HotReload] Server error:', error)
    // Could display an error overlay here
  }

  // ========================================================================
  // State Preservation
  // ========================================================================

  private saveState(): void {
    this.savedState = {
      state: this.captureState(),
      scrollPositions: this.captureScrollPositions(),
      focusedKey: this.captureFocus(),
      inputValues: this.captureInputValues(),
    }
    console.log('[HotReload] State saved')
  }

  private restoreState(): void {
    if (!this.savedState) return

    // Restore state values
    this.applyState(this.savedState.state)

    // Restore scroll positions (after a short delay for render)
    setTimeout(() => {
      this.applyScrollPositions(this.savedState!.scrollPositions)
      this.applyInputValues(this.savedState!.inputValues)
      this.applyFocus(this.savedState!.focusedKey)
    }, 100)

    console.log('[HotReload] State restored')
    this.savedState = null
  }

  private captureState(): Record<string, unknown> {
    // Capture exported state from the global scope
    // @ts-expect-error - Global access
    const handlers = globalThis.__stxHandlers || {}
    const state: Record<string, unknown> = {}

    // Try to get state from the document
    // @ts-expect-error - Global access
    const doc = globalThis.__STX_DOCUMENT__
    if (doc?.script?.exports) {
      Object.assign(state, doc.script.exports)
    }

    return state
  }

  private applyState(state: Record<string, unknown>): void {
    // Apply state back to the JS runtime
    for (const [key, value] of Object.entries(state)) {
      try {
        // Try to set the global variable
        // @ts-expect-error - Global access
        if (typeof globalThis[key] !== 'undefined') {
          // @ts-expect-error - Global access
          globalThis[key] = value
        }
      } catch (error) {
        console.warn(`[HotReload] Could not restore state for ${key}:`, error)
      }
    }
  }

  private captureScrollPositions(): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>()
    // This would be implemented by the native side
    // For now, return empty map
    return positions
  }

  private applyScrollPositions(positions: Map<string, { x: number; y: number }>): void {
    // Send scroll restore commands to native
    for (const [key, pos] of positions) {
      getBridge().send('API_REQUEST', {
        module: 'scrollView',
        method: 'scrollTo',
        args: [key, pos.x, pos.y],
      })
    }
  }

  private captureFocus(): string | null {
    // This would be implemented by the native side
    return null
  }

  private applyFocus(key: string | null): void {
    if (key) {
      getBridge().send('API_REQUEST', {
        module: 'focus',
        method: 'requestFocus',
        args: [key],
      })
    }
  }

  private captureInputValues(): Map<string, string> {
    const values = new Map<string, string>()
    // This would be implemented by the native side
    return values
  }

  private applyInputValues(values: Map<string, string>): void {
    for (const [key, value] of values) {
      getBridge().update([{ key, props: { value } }])
    }
  }

  // ========================================================================
  // Update Application
  // ========================================================================

  private applyUpdate(document: STXDocument): void {
    const bridge = getBridge()

    // Re-register handlers
    const script = document.script
    if (script.code) {
      try {
        // Execute the new script code
        // Note: In a real implementation, this would use the JS runtime's eval
        // For now, just re-render
      } catch (error) {
        console.error('[HotReload] Failed to execute script:', error)
      }
    }

    // Re-render the UI
    bridge.render(document.root, { mode: 'replace' })

    console.log('[HotReload] UI updated')
  }

  // ========================================================================
  // Callbacks
  // ========================================================================

  /**
   * Register a callback for hot reload events
   */
  onReload(callback: HotReloadCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Send a message to the server (for debugging)
   */
  send(type: string, payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    }
  }
}

// ============================================================================
// Error Overlay
// ============================================================================

interface ErrorOverlayOptions {
  error: Error | string
  source?: string
  line?: number
  column?: number
}

class ErrorOverlay {
  private visible = false

  show(options: ErrorOverlayOptions): void {
    const bridge = getBridge()

    const errorMessage = typeof options.error === 'string'
      ? options.error
      : options.error.message

    const errorStack = typeof options.error === 'object'
      ? options.error.stack
      : undefined

    // Create error overlay node
    const overlayNode: STXNode = {
      type: 'View',
      props: {},
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 20,
      },
      events: {},
      children: [
        {
          type: 'SafeAreaView',
          props: {},
          style: { flex: 1 },
          events: {},
          children: [
            {
              type: 'ScrollView',
              props: {},
              style: { flex: 1 },
              events: {},
              children: [
                {
                  type: 'Text',
                  props: {},
                  style: {
                    color: '#ff6b6b',
                    fontSize: 20,
                    fontWeight: 'bold',
                    marginBottom: 16,
                  },
                  events: {},
                  children: ['❌ Build Error'],
                },
                {
                  type: 'Text',
                  props: {},
                  style: {
                    color: '#ffffff',
                    fontSize: 16,
                    marginBottom: 8,
                  },
                  events: {},
                  children: [errorMessage],
                },
                ...(options.source ? [{
                  type: 'Text' as const,
                  props: {},
                  style: {
                    color: '#888888',
                    fontSize: 14,
                    marginBottom: 16,
                  },
                  events: {},
                  children: [`at ${options.source}${options.line ? `:${options.line}` : ''}${options.column ? `:${options.column}` : ''}`],
                }] : []),
                ...(errorStack ? [{
                  type: 'Text' as const,
                  props: {},
                  style: {
                    color: '#666666',
                    fontSize: 12,
                    fontFamily: 'monospace',
                  },
                  events: {},
                  children: [errorStack],
                }] : []),
                {
                  type: 'TouchableOpacity',
                  props: {},
                  style: {
                    backgroundColor: '#444444',
                    padding: 12,
                    borderRadius: 8,
                    marginTop: 20,
                    alignItems: 'center',
                  },
                  events: { onPress: '__stx_dismiss_error__' },
                  children: [
                    {
                      type: 'Text',
                      props: {},
                      style: { color: '#ffffff', fontSize: 14 },
                      events: {},
                      children: ['Dismiss'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    // Register dismiss handler
    // @ts-expect-error - Global registration
    globalThis.__stxHandlers.__stx_dismiss_error__ = () => {
      this.hide()
    }

    // Render overlay
    bridge.render(overlayNode, { containerId: '__error_overlay__', mode: 'replace' })
    this.visible = true
  }

  hide(): void {
    if (!this.visible) return

    const bridge = getBridge()
    bridge.remove(['__error_overlay__'])
    this.visible = false
  }
}

// ============================================================================
// Singleton Instances
// ============================================================================

let hotReloadClient: HotReloadClient | null = null
let errorOverlay: ErrorOverlay | null = null

/**
 * Get or create the hot reload client
 */
export function getHotReloadClient(serverUrl?: string): HotReloadClient {
  if (!hotReloadClient) {
    hotReloadClient = new HotReloadClient(serverUrl)
  }
  return hotReloadClient
}

/**
 * Get or create the error overlay
 */
export function getErrorOverlay(): ErrorOverlay {
  if (!errorOverlay) {
    errorOverlay = new ErrorOverlay()
  }
  return errorOverlay
}

/**
 * Initialize hot reload (call this in dev mode)
 */
export function initHotReload(serverUrl?: string): HotReloadClient {
  const client = getHotReloadClient(serverUrl)
  client.connect()
  return client
}

// ============================================================================
// Exports
// ============================================================================

export { HotReloadClient, ErrorOverlay }
export type { HotReloadMessage, HotReloadState, HotReloadCallback, ErrorOverlayOptions }
