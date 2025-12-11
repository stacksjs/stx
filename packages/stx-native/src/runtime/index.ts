/**
 * STX Native Runtime
 *
 * The runtime that executes STX apps on native platforms.
 * This is the entry point loaded by the native app shells.
 */

import type { STXDocument, STXNode } from '../compiler/ir'
import { getBridge, createBridge, registerHandler, callHandler } from '../bridge/protocol'
import { initHotReload, getErrorOverlay } from '../hot-reload/client'

// ============================================================================
// Runtime Configuration
// ============================================================================

interface RuntimeConfig {
  /** Dev server URL for hot reload */
  devServerUrl?: string
  /** Enable hot reload */
  hotReload?: boolean
  /** Enable debug logging */
  debug?: boolean
  /** Initial document to render */
  document?: STXDocument
}

// ============================================================================
// STX Runtime
// ============================================================================

class STXRuntime {
  private config: RuntimeConfig
  private currentDocument: STXDocument | null = null
  private state: Map<string, unknown> = new Map()
  private initialized = false

  constructor(config: RuntimeConfig = {}) {
    this.config = {
      devServerUrl: 'ws://localhost:8081',
      hotReload: __DEV__,
      debug: __DEV__,
      ...config,
    }
  }

  /**
   * Initialize the runtime
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.log('Runtime already initialized')
      return
    }

    this.log('Initializing STX Native Runtime...')

    // Create bridge
    createBridge()
    const bridge = getBridge()

    // Setup event handlers
    this.setupEventHandlers()

    // Initialize hot reload in dev mode
    if (this.config.hotReload) {
      const hotReload = initHotReload(this.config.devServerUrl)
      hotReload.onReload((doc) => {
        this.handleHotReload(doc)
      })
    }

    // Render initial document if provided
    if (this.config.document) {
      await this.render(this.config.document)
    }

    this.initialized = true
    this.log('Runtime initialized')
  }

  /**
   * Render a document
   */
  async render(document: STXDocument): Promise<void> {
    this.currentDocument = document
    const bridge = getBridge()

    // Execute script code
    if (document.script.code) {
      this.executeScript(document.script.code)
    }

    // Register exported functions as handlers
    for (const funcName of document.script.functions) {
      const func = this.getGlobalFunction(funcName)
      if (func) {
        registerHandler(funcName, func)
      }
    }

    // Initialize state from exports
    for (const [key, value] of Object.entries(document.script.exports)) {
      this.state.set(key, value)
    }

    // Render the root node
    bridge.render(document.root, { mode: 'replace' })

    this.log('Document rendered')
  }

  /**
   * Update state and trigger re-render
   */
  setState(key: string, value: unknown): void {
    const previousValue = this.state.get(key)
    this.state.set(key, value)

    // Update global variable
    this.setGlobal(key, value)

    // Notify bridge of state change
    const bridge = getBridge()
    bridge.send('STATE_UPDATE', {
      key,
      value,
      previousValue,
    })

    this.log(`State updated: ${key}`, value)
  }

  /**
   * Get current state
   */
  getState<T>(key: string): T | undefined {
    return this.state.get(key) as T | undefined
  }

  // ========================================================================
  // Event Handling
  // ========================================================================

  private setupEventHandlers(): void {
    const bridge = getBridge()

    // Handle events from native
    bridge.on('EVENT', (message) => {
      const payload = message.payload as {
        eventType: string
        targetKey: string
        handlerName: string
        nativeEvent: Record<string, unknown>
      }

      this.log(`Event: ${payload.eventType} -> ${payload.handlerName}`)

      // Call the handler
      const result = callHandler(payload.handlerName, payload.nativeEvent)

      // If handler returned a value, it might be a state update
      if (result !== undefined) {
        // Handle potential state updates from event handlers
      }
    })

    // Handle app state changes
    bridge.on('APP_STATE', (message) => {
      const payload = message.payload as { state: string }
      this.log(`App state: ${payload.state}`)

      // Call lifecycle hooks if registered
      switch (payload.state) {
        case 'active':
          callHandler('onAppForeground')
          break
        case 'background':
          callHandler('onAppBackground')
          break
        case 'inactive':
          callHandler('onAppInactive')
          break
      }
    })

    // Handle hot reload
    bridge.on('HOT_RELOAD', (message) => {
      const payload = message.payload as {
        changedFiles: string[]
        document?: STXDocument
        preserveState: boolean
      }

      if (payload.document) {
        this.handleHotReload(payload.document)
      }
    })
  }

  private handleHotReload(document: STXDocument): void {
    this.log('Hot reload triggered')

    // Save current state
    const savedState = new Map(this.state)

    // Re-render
    this.render(document)

    // Restore state
    for (const [key, value] of savedState) {
      if (this.state.has(key)) {
        this.setState(key, value)
      }
    }

    this.log('Hot reload complete')
  }

  // ========================================================================
  // Script Execution
  // ========================================================================

  private executeScript(code: string): void {
    try {
      // Wrap the code to capture exports
      const wrappedCode = `
        (function() {
          ${code}
        })();
      `

      // Execute (this uses the global eval in the JS runtime)
      const fn = new Function(wrappedCode)
      fn()

      this.log('Script executed')
    } catch (error) {
      this.logError('Script execution failed:', error)

      if (this.config.hotReload) {
        getErrorOverlay().show({
          error: error as Error,
          source: this.currentDocument?.meta.source,
        })
      }
    }
  }

  private getGlobalFunction(name: string): ((...args: unknown[]) => unknown) | null {
    try {
      // @ts-expect-error - Global access
      const fn = globalThis[name]
      if (typeof fn === 'function') {
        return fn as (...args: unknown[]) => unknown
      }
    } catch {
      // Function not found
    }
    return null
  }

  private setGlobal(key: string, value: unknown): void {
    try {
      // @ts-expect-error - Global access
      globalThis[key] = value
    } catch {
      // Could not set global
    }
  }

  // ========================================================================
  // Logging
  // ========================================================================

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[STXRuntime]', ...args)
    }
  }

  private logError(...args: unknown[]): void {
    console.error('[STXRuntime]', ...args)
  }
}

// ============================================================================
// Global __DEV__ flag
// ============================================================================

declare const __DEV__: boolean

// Set default if not defined
// @ts-expect-error - Global definition
if (typeof globalThis.__DEV__ === 'undefined') {
  // @ts-expect-error - Global definition
  globalThis.__DEV__ = process.env.NODE_ENV !== 'production'
}

// ============================================================================
// Singleton Instance
// ============================================================================

let runtimeInstance: STXRuntime | null = null

/**
 * Get or create the runtime instance
 */
export function getRuntime(config?: RuntimeConfig): STXRuntime {
  if (!runtimeInstance) {
    runtimeInstance = new STXRuntime(config)
  }
  return runtimeInstance
}

/**
 * Initialize and start the runtime
 */
export async function startRuntime(config?: RuntimeConfig): Promise<STXRuntime> {
  const runtime = getRuntime(config)
  await runtime.initialize()
  return runtime
}

// ============================================================================
// Convenience API
// ============================================================================

/**
 * Render an STX document
 */
export async function render(document: STXDocument): Promise<void> {
  const runtime = getRuntime()
  await runtime.initialize()
  await runtime.render(document)
}

/**
 * Update application state
 */
export function setState(key: string, value: unknown): void {
  getRuntime().setState(key, value)
}

/**
 * Get application state
 */
export function getState<T>(key: string): T | undefined {
  return getRuntime().getState<T>(key)
}

// ============================================================================
// Exports
// ============================================================================

export { STXRuntime }
export type { RuntimeConfig }
