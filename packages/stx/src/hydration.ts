/**
 * STX Hydration Runtime
 *
 * Comprehensive client-side hydration system that bridges server-rendered
 * HTML with client-side interactivity. Similar to React's hydrateRoot or
 * Vue's createSSRApp.
 *
 * ## Features
 *
 * - Full page hydration with state restoration
 * - Selective/partial hydration (islands architecture)
 * - Event handler binding from server-rendered HTML
 * - Integration with stx reactivity system
 * - Seamless SPA router integration
 * - Progressive enhancement support
 * - Error boundaries for hydration failures
 *
 * ## Usage
 *
 * Server-side (stx template):
 * ```html
 * <script>
 * const count = 0
 * const user = { name: 'Alice' }
 * </script>
 *
 * <button @click="count++">Count: {{ count }}</button>
 * <p>Hello, {{ user.name }}</p>
 * ```
 *
 * The framework automatically:
 * 1. Renders HTML on server
 * 2. Serializes state and embeds in HTML
 * 3. Client loads, hydrates, binds events
 * 4. Page becomes interactive
 *
 * @module hydration
 */

// =============================================================================
// Types
// =============================================================================

export interface HydrationState {
  /** Reactive ref values */
  refs: Record<string, unknown>
  /** Reactive object state */
  reactive: Record<string, unknown>
  /** Props passed to component */
  props: Record<string, unknown>
  /** Route parameters */
  routeParams: Record<string, string>
  /** Store states */
  stores: Record<string, unknown>
  /** Page metadata */
  meta: {
    title?: string
    description?: string
    url?: string
  }
  /** Timestamp when state was captured */
  timestamp: number
  /** Checksum for validation */
  checksum?: string
}

export interface HydrationOptions {
  /** Root element selector (default: '#app' or 'body') */
  root?: string | HTMLElement
  /** Enable strict mode - errors on hydration mismatch */
  strict?: boolean
  /** Callback when hydration starts */
  onHydrating?: () => void
  /** Callback when hydration completes */
  onHydrated?: () => void
  /** Callback on hydration error */
  onError?: (error: Error) => void
  /** Enable performance tracking */
  performance?: boolean
  /** Max time to wait for hydration (ms) */
  timeout?: number
}

export interface EventBinding {
  /** Event type (click, input, submit, etc.) */
  type: string
  /** Handler expression or function name */
  handler: string
  /** Event modifiers */
  modifiers?: string[]
  /** Whether to prevent default */
  preventDefault?: boolean
  /** Whether to stop propagation */
  stopPropagation?: boolean
}

export interface ComponentHydrationConfig {
  /** Component ID */
  id: string
  /** Component name */
  name: string
  /** Hydration strategy */
  strategy: 'eager' | 'lazy' | 'idle' | 'visible' | 'interaction'
  /** Initial props */
  props: Record<string, unknown>
  /** Event bindings */
  events: EventBinding[]
}

// =============================================================================
// State Serialization (Server-side)
// =============================================================================

/**
 * Serialize state for client hydration
 * Called during server-side rendering
 */
export function serializeState(state: Partial<HydrationState>): string {
  const fullState: HydrationState = {
    refs: state.refs || {},
    reactive: state.reactive || {},
    props: state.props || {},
    routeParams: state.routeParams || {},
    stores: state.stores || {},
    meta: state.meta || {},
    timestamp: Date.now(),
  }

  // Generate checksum for validation
  fullState.checksum = generateChecksum(fullState)

  // Serialize with escaping for safe embedding
  const json = JSON.stringify(fullState)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027')

  return json
}

/**
 * Generate state checksum for validation
 */
function generateChecksum(state: Partial<HydrationState>): string {
  const str = JSON.stringify({
    refs: Object.keys(state.refs || {}),
    reactive: Object.keys(state.reactive || {}),
    props: Object.keys(state.props || {}),
  })
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Generate the state injection script for server-rendered HTML
 */
export function generateStateScript(state: Partial<HydrationState>): string {
  const serialized = serializeState(state)
  return `<script id="__STX_STATE__" type="application/json">${serialized}</script>`
}

/**
 * Generate event bindings data attribute
 */
export function generateEventBindings(events: EventBinding[]): string {
  if (events.length === 0) return ''
  return `data-stx-events='${JSON.stringify(events)}'`
}

// =============================================================================
// State Deserialization (Client-side)
// =============================================================================

/**
 * Extract and parse state from server-rendered HTML
 */
export function extractState(): HydrationState | null {
  if (typeof window === 'undefined') return null

  const stateEl = document.getElementById('__STX_STATE__')
  if (!stateEl) return null

  try {
    const state = JSON.parse(stateEl.textContent || '{}') as HydrationState

    // Validate checksum
    if (state.checksum) {
      const expected = generateChecksum(state)
      if (expected !== state.checksum) {
        console.warn('[Hydration] State checksum mismatch - state may be corrupted')
      }
    }

    return state
  } catch (error) {
    console.error('[Hydration] Failed to parse state:', error)
    return null
  }
}

// =============================================================================
// Hydration Runtime
// =============================================================================

/**
 * Main hydration class
 */
export class HydrationRuntime {
  private state: HydrationState | null = null
  private options: Required<HydrationOptions>
  private root: HTMLElement | null = null
  private isHydrated = false
  private pendingComponents: Map<string, ComponentHydrationConfig> = new Map()
  private hydratedComponents: Set<string> = new Set()

  constructor(options: HydrationOptions = {}) {
    this.options = {
      root: options.root || '#app',
      strict: options.strict ?? false,
      onHydrating: options.onHydrating || (() => {}),
      onHydrated: options.onHydrated || (() => {}),
      onError: options.onError || console.error,
      performance: options.performance ?? false,
      timeout: options.timeout ?? 10000,
    }
  }

  /**
   * Start hydration process
   */
  async hydrate(): Promise<void> {
    if (typeof window === 'undefined') return
    if (this.isHydrated) return

    const startTime = this.options.performance ? performance.now() : 0

    try {
      // Find root element
      this.root = typeof this.options.root === 'string'
        ? document.querySelector(this.options.root) || document.body
        : this.options.root

      // Extract server state
      this.state = extractState()

      // Notify start
      this.options.onHydrating()
      this.root.classList.add('stx-hydrating')

      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Hydration timeout')), this.options.timeout)
      })

      // Run hydration with timeout
      await Promise.race([
        this.runHydration(),
        timeoutPromise,
      ])

      this.isHydrated = true
      this.root.classList.remove('stx-hydrating')
      this.root.classList.add('stx-hydrated')

      // Log performance
      if (this.options.performance) {
        const duration = performance.now() - startTime
        console.log(`[Hydration] Completed in ${duration.toFixed(2)}ms`)
      }

      // Notify completion
      this.options.onHydrated()
      window.dispatchEvent(new CustomEvent('stx:hydrated'))

    } catch (error) {
      this.root?.classList.remove('stx-hydrating')
      this.root?.classList.add('stx-hydration-error')
      this.options.onError(error as Error)
      window.dispatchEvent(new CustomEvent('stx:hydration-error', {
        detail: { error }
      }))
    }
  }

  /**
   * Run the hydration process
   */
  private async runHydration(): Promise<void> {
    if (!this.root) return

    // 1. Restore global state to reactivity system
    this.restoreGlobalState()

    // 2. Find and hydrate components
    await this.hydrateComponents()

    // 3. Bind event handlers
    this.bindEventHandlers()

    // 4. Initialize reactive bindings
    this.initializeReactiveBindings()

    // 5. Set up router integration
    this.setupRouterIntegration()
  }

  /**
   * Restore state to global stx reactivity
   */
  private restoreGlobalState(): void {
    if (!this.state) return

    const stx = (window as any).stx
    if (!stx) return

    // Restore route params
    if (this.state.routeParams && stx.setRouteParams) {
      stx.setRouteParams(this.state.routeParams)
    }

    // Restore stores
    if (this.state.stores && stx.registerStore) {
      Object.entries(this.state.stores).forEach(([name, state]) => {
        stx.registerStore(name, state)
      })
    }

    // Dispatch state restored event
    window.dispatchEvent(new CustomEvent('stx:state-restored', {
      detail: this.state
    }))
  }

  /**
   * Find and hydrate all components
   */
  private async hydrateComponents(): Promise<void> {
    if (!this.root) return

    // Find all component elements
    const componentEls = this.root.querySelectorAll('[data-stx-component]')

    for (const el of componentEls) {
      const id = el.getAttribute('data-stx-component')
      const name = el.getAttribute('data-stx-name') || id
      const strategyAttr = el.getAttribute('data-stx-hydrate') || 'eager'
      const propsAttr = el.getAttribute('data-stx-props')

      if (!id) continue

      const config: ComponentHydrationConfig = {
        id,
        name: name || id,
        strategy: strategyAttr as ComponentHydrationConfig['strategy'],
        props: propsAttr ? JSON.parse(propsAttr) : {},
        events: [],
      }

      // Queue component for hydration
      this.pendingComponents.set(id, config)

      // Hydrate based on strategy
      switch (config.strategy) {
        case 'eager':
          await this.hydrateComponent(el as HTMLElement, config)
          break
        case 'lazy':
        case 'visible':
          this.setupVisibleHydration(el as HTMLElement, config)
          break
        case 'idle':
          this.setupIdleHydration(el as HTMLElement, config)
          break
        case 'interaction':
          this.setupInteractionHydration(el as HTMLElement, config)
          break
      }
    }
  }

  /**
   * Hydrate a single component
   */
  private async hydrateComponent(
    el: HTMLElement,
    config: ComponentHydrationConfig
  ): Promise<void> {
    if (this.hydratedComponents.has(config.id)) return

    try {
      // Get component-specific state
      const componentState = this.state?.refs[config.id] ||
        this.state?.reactive[config.id] || {}

      // Restore state to component element
      this.restoreComponentState(el, componentState)

      // Bind component events
      this.bindComponentEvents(el)

      // Initialize component reactivity
      this.initializeComponentReactivity(el, config)

      // Mark as hydrated
      this.hydratedComponents.add(config.id)
      el.classList.add('stx-hydrated')
      el.setAttribute('data-hydrated', 'true')

      // Dispatch event
      el.dispatchEvent(new CustomEvent('stx:component-hydrated', {
        detail: { id: config.id, name: config.name },
        bubbles: true,
      }))

    } catch (error) {
      console.error(`[Hydration] Failed to hydrate component ${config.id}:`, error)
      el.classList.add('stx-hydration-error')

      if (this.options.strict) {
        throw error
      }
    }
  }

  /**
   * Restore state to a component element
   */
  private restoreComponentState(el: HTMLElement, state: unknown): void {
    if (!state || typeof state !== 'object') return

    // Find elements with data-stx-bind
    const boundEls = el.querySelectorAll('[data-stx-bind]')
    boundEls.forEach(boundEl => {
      const bindKey = boundEl.getAttribute('data-stx-bind')
      if (!bindKey || !(state as Record<string, unknown>)[bindKey]) return

      const value = (state as Record<string, unknown>)[bindKey]

      // Restore value based on element type
      if (boundEl instanceof HTMLInputElement) {
        if (boundEl.type === 'checkbox' || boundEl.type === 'radio') {
          boundEl.checked = Boolean(value)
        } else {
          boundEl.value = String(value)
        }
      } else if (boundEl instanceof HTMLSelectElement) {
        boundEl.value = String(value)
      } else if (boundEl instanceof HTMLTextAreaElement) {
        boundEl.value = String(value)
      } else {
        boundEl.textContent = String(value)
      }
    })
  }

  /**
   * Set up hydration on visibility (IntersectionObserver)
   */
  private setupVisibleHydration(el: HTMLElement, config: ComponentHydrationConfig): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback: hydrate immediately
      this.hydrateComponent(el, config)
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          observer.disconnect()
          this.hydrateComponent(el, config)
        }
      })
    }, {
      rootMargin: '100px',
      threshold: 0,
    })

    observer.observe(el)
  }

  /**
   * Set up hydration on idle (requestIdleCallback)
   */
  private setupIdleHydration(el: HTMLElement, config: ComponentHydrationConfig): void {
    const hydrate = () => this.hydrateComponent(el, config)

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(hydrate, { timeout: 2000 })
    } else {
      setTimeout(hydrate, 200)
    }
  }

  /**
   * Set up hydration on first interaction
   */
  private setupInteractionHydration(el: HTMLElement, config: ComponentHydrationConfig): void {
    const events = ['mouseenter', 'touchstart', 'focusin']

    const hydrate = () => {
      events.forEach(event => el.removeEventListener(event, hydrate))
      this.hydrateComponent(el, config)
    }

    events.forEach(event => {
      el.addEventListener(event, hydrate, { once: true, passive: true })
    })
  }

  /**
   * Bind all event handlers in the root
   */
  private bindEventHandlers(): void {
    if (!this.root) return

    // Find elements with event bindings
    const eventEls = this.root.querySelectorAll('[data-stx-events]')
    eventEls.forEach(el => this.bindElementEvents(el as HTMLElement))

    // Bind @click, @submit, etc. attributes
    this.bindDirectiveEvents()
  }

  /**
   * Bind events from data-stx-events attribute
   */
  private bindElementEvents(el: HTMLElement): void {
    const eventsAttr = el.getAttribute('data-stx-events')
    if (!eventsAttr) return

    try {
      const events: EventBinding[] = JSON.parse(eventsAttr)
      events.forEach(event => {
        this.bindSingleEvent(el, event)
      })
    } catch (error) {
      console.error('[Hydration] Failed to parse events:', error)
    }
  }

  /**
   * Bind events from @click, @submit directives
   */
  private bindDirectiveEvents(): void {
    if (!this.root) return

    // Common events to look for
    const eventTypes = [
      'click', 'submit', 'input', 'change', 'focus', 'blur',
      'keydown', 'keyup', 'keypress', 'mouseenter', 'mouseleave',
      'touchstart', 'touchend', 'scroll', 'resize'
    ]

    eventTypes.forEach(eventType => {
      const attr = `data-stx-on-${eventType}`
      const els = this.root!.querySelectorAll(`[${attr}]`)

      els.forEach(el => {
        const handler = el.getAttribute(attr)
        if (!handler) return

        this.bindSingleEvent(el as HTMLElement, {
          type: eventType,
          handler,
          modifiers: this.parseModifiers(el as HTMLElement, eventType),
        })
      })
    })
  }

  /**
   * Parse event modifiers from element
   */
  private parseModifiers(el: HTMLElement, eventType: string): string[] {
    const modifiers: string[] = []
    const modAttr = el.getAttribute(`data-stx-${eventType}-modifiers`)
    if (modAttr) {
      modifiers.push(...modAttr.split(',').map(m => m.trim()))
    }
    return modifiers
  }

  /**
   * Bind a single event
   */
  private bindSingleEvent(el: HTMLElement, event: EventBinding): void {
    const handler = this.resolveHandler(event.handler)
    if (!handler) {
      console.warn(`[Hydration] Handler not found: ${event.handler}`)
      return
    }

    const wrappedHandler = (e: Event) => {
      // Apply modifiers
      if (event.modifiers?.includes('prevent') || event.preventDefault) {
        e.preventDefault()
      }
      if (event.modifiers?.includes('stop') || event.stopPropagation) {
        e.stopPropagation()
      }

      // Call handler
      try {
        handler.call(el, e)
      } catch (error) {
        console.error(`[Hydration] Event handler error:`, error)
      }
    }

    // Set up listener options based on modifiers
    const options: AddEventListenerOptions = {}
    if (event.modifiers?.includes('once')) options.once = true
    if (event.modifiers?.includes('passive')) options.passive = true
    if (event.modifiers?.includes('capture')) options.capture = true

    el.addEventListener(event.type, wrappedHandler, options)
  }

  /**
   * Resolve handler from string expression
   */
  private resolveHandler(handlerStr: string): ((e: Event) => void) | null {
    const stx = (window as any).stx

    // Check if it's a direct function reference
    if (stx && stx[handlerStr]) {
      return stx[handlerStr]
    }

    // Check window scope
    if ((window as any)[handlerStr]) {
      return (window as any)[handlerStr]
    }

    // Try to evaluate as expression
    try {
      // Simple increment/decrement
      if (handlerStr.match(/^\w+\+\+$/) || handlerStr.match(/^\w+--$/)) {
        const varName = handlerStr.replace(/[+-]+$/, '')
        return () => {
          if (stx && stx[varName]) {
            if (typeof stx[varName].value !== 'undefined') {
              // It's a ref
              if (handlerStr.includes('++')) stx[varName].value++
              else stx[varName].value--
            }
          }
        }
      }

      // Assignment expression
      const assignMatch = handlerStr.match(/^(\w+)\s*=\s*(.+)$/)
      if (assignMatch) {
        const [, varName, expr] = assignMatch
        return () => {
          if (stx && stx[varName]) {
            const value = new Function(`return ${expr}`)()
            if (typeof stx[varName].value !== 'undefined') {
              stx[varName].value = value
            }
          }
        }
      }

      // Function call
      const callMatch = handlerStr.match(/^(\w+)\((.*)\)$/)
      if (callMatch) {
        const [, fnName, args] = callMatch
        return (e: Event) => {
          const fn = stx?.[fnName] || (window as any)[fnName]
          if (fn) {
            const evalArgs = args ? new Function('$event', `return [${args}]`)(e) : []
            fn(...evalArgs)
          }
        }
      }

      // Generic expression
      return (e: Event) => {
        new Function('$event', 'stx', handlerStr)(e, stx)
      }
    } catch {
      return null
    }
  }

  /**
   * Bind component-specific events
   */
  private bindComponentEvents(el: HTMLElement): void {
    // Find all elements with event bindings within this component
    const eventEls = el.querySelectorAll('[data-stx-events]')
    eventEls.forEach(eventEl => {
      this.bindElementEvents(eventEl as HTMLElement)
    })
  }

  /**
   * Initialize component reactivity
   */
  private initializeComponentReactivity(
    el: HTMLElement,
    config: ComponentHydrationConfig
  ): void {
    const stx = (window as any).stx
    if (!stx) return

    // Find reactive bindings
    const reactiveEls = el.querySelectorAll('[data-stx-reactive]')
    reactiveEls.forEach(reactiveEl => {
      const bindExpr = reactiveEl.getAttribute('data-stx-reactive')
      if (!bindExpr) return

      // Set up reactive update
      this.setupReactiveBinding(reactiveEl as HTMLElement, bindExpr)
    })
  }

  /**
   * Initialize global reactive bindings
   */
  private initializeReactiveBindings(): void {
    if (!this.root) return

    // Find {{ expression }} markers
    const textNodes = this.getTextNodesWithExpressions(this.root)
    textNodes.forEach(({ node, expressions }) => {
      expressions.forEach(expr => {
        this.setupTextNodeBinding(node, expr)
      })
    })

    // Find :attr="expr" bindings
    const attrEls = this.root.querySelectorAll('[data-stx-bind-attrs]')
    attrEls.forEach(el => {
      const bindings = el.getAttribute('data-stx-bind-attrs')
      if (!bindings) return

      try {
        const parsed = JSON.parse(bindings)
        Object.entries(parsed).forEach(([attr, expr]) => {
          this.setupAttributeBinding(el as HTMLElement, attr, expr as string)
        })
      } catch {
        // Ignore parse errors
      }
    })
  }

  /**
   * Find text nodes containing expressions
   */
  private getTextNodesWithExpressions(root: HTMLElement): Array<{
    node: Text
    expressions: string[]
  }> {
    const results: Array<{ node: Text; expressions: string[] }> = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)

    let node: Text | null
    while ((node = walker.nextNode() as Text | null)) {
      const text = node.textContent || ''
      const exprMatch = text.match(/\{\{\s*([^}]+)\s*\}\}/g)
      if (exprMatch) {
        results.push({
          node,
          expressions: exprMatch.map(m => m.replace(/\{\{\s*|\s*\}\}/g, ''))
        })
      }
    }

    return results
  }

  /**
   * Set up binding for a text node
   */
  private setupTextNodeBinding(node: Text, expression: string): void {
    const stx = (window as any).stx
    if (!stx) return

    const originalText = node.textContent || ''

    const update = () => {
      try {
        const value = new Function('stx', `with(stx) { return ${expression} }`)(stx)
        node.textContent = originalText.replace(
          new RegExp(`\\{\\{\\s*${expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`),
          String(value)
        )
      } catch {
        // Keep original on error
      }
    }

    // Initial update
    update()

    // Watch for changes if expression references a ref
    const refMatch = expression.match(/^(\w+)(\.value)?$/)
    if (refMatch && stx[refMatch[1]]?.subscribe) {
      stx[refMatch[1]].subscribe(update)
    }
  }

  /**
   * Set up attribute binding
   */
  private setupAttributeBinding(el: HTMLElement, attr: string, expression: string): void {
    const stx = (window as any).stx
    if (!stx) return

    const update = () => {
      try {
        const value = new Function('stx', `with(stx) { return ${expression} }`)(stx)

        // Handle boolean attributes
        if (typeof value === 'boolean') {
          if (value) el.setAttribute(attr, '')
          else el.removeAttribute(attr)
        } else {
          el.setAttribute(attr, String(value))
        }
      } catch {
        // Keep current value on error
      }
    }

    // Initial update
    update()

    // Watch for changes
    const refMatch = expression.match(/^(\w+)(\.value)?$/)
    if (refMatch && stx[refMatch[1]]?.subscribe) {
      stx[refMatch[1]].subscribe(update)
    }
  }

  /**
   * Set up reactive element binding
   */
  private setupReactiveBinding(el: HTMLElement, expression: string): void {
    const stx = (window as any).stx
    if (!stx) return

    const update = () => {
      try {
        const value = new Function('stx', `with(stx) { return ${expression} }`)(stx)
        el.textContent = String(value)
      } catch {
        // Keep current on error
      }
    }

    update()

    // Subscribe to changes
    const refMatch = expression.match(/^(\w+)(\.value)?$/)
    if (refMatch && stx[refMatch[1]]?.subscribe) {
      stx[refMatch[1]].subscribe(update)
    }
  }

  /**
   * Set up SPA router integration
   */
  private setupRouterIntegration(): void {
    // Listen for navigation events from stx-router
    window.addEventListener('stx:navigate', (e: Event) => {
      const { url } = (e as CustomEvent).detail || {}
      if (url) {
        // Update route params
        const stx = (window as any).stx
        if (stx?.setRouteParams) {
          const urlObj = new URL(url, window.location.origin)
          // Extract route params from URL
          // This would integrate with actual router implementation
        }
      }
    })

    // Listen for page loads from router
    window.addEventListener('stx:load', () => {
      // Re-hydrate new content
      this.hydrateComponents()
      this.bindEventHandlers()
    })
  }

  /**
   * Check if hydration is complete
   */
  get hydrated(): boolean {
    return this.isHydrated
  }

  /**
   * Get current state
   */
  getState(): HydrationState | null {
    return this.state
  }

  /**
   * Manually hydrate a specific component
   */
  async hydrateById(componentId: string): Promise<void> {
    const config = this.pendingComponents.get(componentId)
    const el = document.querySelector(`[data-stx-component="${componentId}"]`)

    if (config && el) {
      await this.hydrateComponent(el as HTMLElement, config)
    }
  }
}

// =============================================================================
// Client Script Generation
// =============================================================================

/**
 * Generate the hydration runtime script for embedding in HTML
 */
export function generateHydrationScript(state?: Partial<HydrationState>): string {
  const stateScript = state ? generateStateScript(state) : ''

  return `
${stateScript}
<script data-stx-hydration-runtime>
(function() {
  'use strict';

  // Wait for DOM and stx runtime
  function init() {
    if (!window.stx) {
      setTimeout(init, 10);
      return;
    }

    // Extract state
    const stateEl = document.getElementById('__STX_STATE__');
    const state = stateEl ? JSON.parse(stateEl.textContent || '{}') : {};

    // Restore stores
    if (state.stores) {
      Object.entries(state.stores).forEach(([name, storeState]) => {
        window.stx.registerStore(name, storeState);
      });
    }

    // Restore route params
    if (state.routeParams) {
      window.stx.setRouteParams(state.routeParams);
    }

    // Hydrate components
    const components = document.querySelectorAll('[data-stx-component]');
    components.forEach(el => {
      const id = el.getAttribute('data-stx-component');
      const strategy = el.getAttribute('data-stx-hydrate') || 'eager';

      const hydrate = () => {
        // Bind events
        el.querySelectorAll('[data-stx-on-click]').forEach(eventEl => {
          const handler = eventEl.getAttribute('data-stx-on-click');
          if (handler) {
            eventEl.addEventListener('click', (e) => {
              try {
                new Function('$event', 'stx', handler)(e, window.stx);
              } catch (err) {
                console.error('[Hydration] Event error:', err);
              }
            });
          }
        });

        // Mark hydrated
        el.classList.add('stx-hydrated');
        el.setAttribute('data-hydrated', 'true');
        el.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }));
      };

      // Execute based on strategy
      if (strategy === 'eager') {
        hydrate();
      } else if (strategy === 'idle') {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(hydrate, { timeout: 2000 });
        } else {
          setTimeout(hydrate, 100);
        }
      } else if (strategy === 'visible') {
        const observer = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting) {
            observer.disconnect();
            hydrate();
          }
        });
        observer.observe(el);
      } else if (strategy === 'interaction') {
        ['mouseenter', 'focusin', 'touchstart'].forEach(event => {
          el.addEventListener(event, hydrate, { once: true });
        });
      }
    });

    // Dispatch global hydrated event
    window.dispatchEvent(new CustomEvent('stx:hydrated'));
    document.body.classList.add('stx-hydrated');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
`
}

// =============================================================================
// Singleton Instance
// =============================================================================

let hydrationRuntime: HydrationRuntime | null = null

/**
 * Get or create the hydration runtime
 */
export function getHydrationRuntime(options?: HydrationOptions): HydrationRuntime {
  if (!hydrationRuntime) {
    hydrationRuntime = new HydrationRuntime(options)
  }
  return hydrationRuntime
}

/**
 * Start hydration (convenience function)
 */
export async function hydrate(options?: HydrationOptions): Promise<void> {
  const runtime = getHydrationRuntime(options)
  await runtime.hydrate()
}

// =============================================================================
// CSS
// =============================================================================

/**
 * Generate hydration CSS
 */
export function generateHydrationCSS(): string {
  return `
<style data-stx-hydration-styles>
  /* Pre-hydration state */
  [data-stx-component]:not(.stx-hydrated) {
    /* Prevent layout shift with min dimensions */
    min-height: 1px;
  }

  /* Loading state */
  .stx-hydrating {
    cursor: wait;
  }

  /* Hydrated state */
  .stx-hydrated {
    /* Ready for interaction */
  }

  /* Error state */
  .stx-hydration-error {
    outline: 2px dashed red;
    outline-offset: -2px;
  }

  /* Progressive enhancement */
  @supports not (IntersectionObserver) {
    /* Fallback for old browsers */
    [data-stx-hydrate="visible"],
    [data-stx-hydrate="lazy"] {
      /* Hydrate immediately */
    }
  }
</style>
`
}

// =============================================================================
// Exports
// =============================================================================

export default {
  HydrationRuntime,
  serializeState,
  generateStateScript,
  generateHydrationScript,
  generateHydrationCSS,
  extractState,
  getHydrationRuntime,
  hydrate,
}
