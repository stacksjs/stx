/**
 * Component HMR (Hot Module Replacement)
 *
 * Provides React Fast Refresh / Vue HMR-style hot reloading for stx components.
 * Updates component code without losing component state or unmounting.
 *
 * ## Features
 *
 * - State preservation during component updates
 * - Selective component re-rendering
 * - Error recovery with state restoration
 * - Integration with stx reactivity system
 * - Support for nested component updates
 *
 * ## Usage
 *
 * Component HMR is automatically enabled in development mode. No configuration needed.
 *
 * @module component-hmr
 */

// =============================================================================
// Types
// =============================================================================

export interface ComponentState {
  /** Serialized reactive state */
  refs: Record<string, unknown>
  /** Reactive object states */
  reactiveObjects: Record<string, unknown>
  /** Custom state from component */
  custom: Record<string, unknown>
  /** Timestamp when state was captured */
  timestamp: number
}

export interface ComponentInstance {
  /** Unique component instance ID */
  id: string
  /** Component file path or name */
  name: string
  /** DOM element the component is mounted to */
  element: HTMLElement | null
  /** Current component state */
  state: ComponentState
  /** Whether the component is currently mounted */
  isMounted: boolean
  /** Component props */
  props: Record<string, unknown>
  /** Child component instances */
  children: Map<string, ComponentInstance>
  /** Setup function to re-run on update */
  setup?: () => void | Promise<void>
  /** Render function */
  render?: () => string
  /** Cleanup function */
  cleanup?: () => void
}

export interface HMRUpdate {
  /** Component file that changed */
  file: string
  /** New component code */
  code: string
  /** Type of update */
  type: 'full' | 'partial' | 'style'
  /** Timestamp */
  timestamp: number
}

export interface ComponentHMRConfig {
  /** Enable state preservation (default: true) */
  preserveState?: boolean
  /** Maximum state age in ms before forcing full reload (default: 30000) */
  maxStateAge?: number
  /** Enable error recovery (default: true) */
  errorRecovery?: boolean
  /** Log verbose messages */
  verbose?: boolean
  /** Custom state serializer */
  serializeState?: (instance: ComponentInstance) => ComponentState
  /** Custom state deserializer */
  deserializeState?: (state: ComponentState, instance: ComponentInstance) => void
}

// =============================================================================
// Component Registry
// =============================================================================

/**
 * Global registry of component instances for HMR
 */
class ComponentRegistry {
  private instances: Map<string, ComponentInstance> = new Map()
  private componentsByFile: Map<string, Set<string>> = new Map()
  private stateSnapshots: Map<string, ComponentState> = new Map()
  private config: Required<ComponentHMRConfig>

  constructor(config: ComponentHMRConfig = {}) {
    this.config = {
      preserveState: config.preserveState ?? true,
      maxStateAge: config.maxStateAge ?? 30000,
      errorRecovery: config.errorRecovery ?? true,
      verbose: config.verbose ?? false,
      serializeState: config.serializeState ?? this.defaultSerializeState.bind(this),
      deserializeState: config.deserializeState ?? this.defaultDeserializeState.bind(this),
    }
  }

  /**
   * Register a component instance
   */
  register(instance: ComponentInstance): void {
    this.instances.set(instance.id, instance)

    // Track by file for efficient updates
    if (!this.componentsByFile.has(instance.name)) {
      this.componentsByFile.set(instance.name, new Set())
    }
    this.componentsByFile.get(instance.name)!.add(instance.id)

    if (this.config.verbose) {
      console.log(`[HMR] Registered component: ${instance.name} (${instance.id})`)
    }
  }

  /**
   * Unregister a component instance
   */
  unregister(instanceId: string): void {
    const instance = this.instances.get(instanceId)
    if (!instance) return

    // Remove from file tracking
    this.componentsByFile.get(instance.name)?.delete(instanceId)
    if (this.componentsByFile.get(instance.name)?.size === 0) {
      this.componentsByFile.delete(instance.name)
    }

    // Clean up state snapshot
    this.stateSnapshots.delete(instanceId)

    // Run cleanup
    instance.cleanup?.()

    this.instances.delete(instanceId)

    if (this.config.verbose) {
      console.log(`[HMR] Unregistered component: ${instance.name} (${instanceId})`)
    }
  }

  /**
   * Get all instances of a component
   */
  getInstancesByFile(file: string): ComponentInstance[] {
    const ids = this.componentsByFile.get(file) || new Set()
    return Array.from(ids).map(id => this.instances.get(id)!).filter(Boolean)
  }

  /**
   * Get a specific instance
   */
  getInstance(id: string): ComponentInstance | undefined {
    return this.instances.get(id)
  }

  /**
   * Capture state before update
   */
  captureState(instanceId: string): void {
    const instance = this.instances.get(instanceId)
    if (!instance || !this.config.preserveState) return

    const state = this.config.serializeState(instance)
    this.stateSnapshots.set(instanceId, state)

    if (this.config.verbose) {
      console.log(`[HMR] Captured state for: ${instance.name}`)
    }
  }

  /**
   * Restore state after update
   */
  restoreState(instanceId: string): boolean {
    const instance = this.instances.get(instanceId)
    const state = this.stateSnapshots.get(instanceId)

    if (!instance || !state || !this.config.preserveState) {
      return false
    }

    // Check if state is too old
    if (Date.now() - state.timestamp > this.config.maxStateAge) {
      this.stateSnapshots.delete(instanceId)
      if (this.config.verbose) {
        console.log(`[HMR] State expired for: ${instance.name}`)
      }
      return false
    }

    try {
      this.config.deserializeState(state, instance)
      if (this.config.verbose) {
        console.log(`[HMR] Restored state for: ${instance.name}`)
      }
      return true
    } catch (error) {
      console.error(`[HMR] Failed to restore state for ${instance.name}:`, error)
      return false
    }
  }

  /**
   * Default state serializer
   */
  private defaultSerializeState(instance: ComponentInstance): ComponentState {
    const refs: Record<string, unknown> = {}
    const reactiveObjects: Record<string, unknown> = {}

    // Serialize refs from element data attributes
    if (instance.element) {
      const refElements = instance.element.querySelectorAll('[data-stx-ref]')
      refElements.forEach(el => {
        const refName = el.getAttribute('data-stx-ref')
        const refValue = el.getAttribute('data-stx-value')
        if (refName && refValue) {
          try {
            refs[refName] = JSON.parse(refValue)
          } catch {
            refs[refName] = refValue
          }
        }
      })
    }

    return {
      refs,
      reactiveObjects,
      custom: instance.state?.custom || {},
      timestamp: Date.now(),
    }
  }

  /**
   * Default state deserializer
   */
  private defaultDeserializeState(state: ComponentState, instance: ComponentInstance): void {
    // Restore refs
    if (instance.element) {
      Object.entries(state.refs).forEach(([name, value]) => {
        const el = instance.element!.querySelector(`[data-stx-ref="${name}"]`)
        if (el) {
          el.setAttribute('data-stx-value', JSON.stringify(value))
          // Dispatch event for reactivity system to pick up
          el.dispatchEvent(new CustomEvent('stx:state-restored', {
            detail: { name, value },
            bubbles: true,
          }))
        }
      })
    }

    // Update instance state
    instance.state = { ...state, timestamp: Date.now() }
  }

  /**
   * Get all registered instances
   */
  getAllInstances(): ComponentInstance[] {
    return Array.from(this.instances.values())
  }

  /**
   * Clear all instances
   */
  clear(): void {
    for (const instance of this.instances.values()) {
      instance.cleanup?.()
    }
    this.instances.clear()
    this.componentsByFile.clear()
    this.stateSnapshots.clear()
  }
}

// =============================================================================
// HMR Handler
// =============================================================================

/**
 * HMR Handler - processes component updates
 */
export class ComponentHMRHandler {
  private registry: ComponentRegistry
  private config: Required<ComponentHMRConfig>
  private pendingUpdates: Map<string, HMRUpdate> = new Map()
  private updateQueue: Promise<void> = Promise.resolve()

  constructor(config: ComponentHMRConfig = {}) {
    this.config = {
      preserveState: config.preserveState ?? true,
      maxStateAge: config.maxStateAge ?? 30000,
      errorRecovery: config.errorRecovery ?? true,
      verbose: config.verbose ?? false,
      serializeState: config.serializeState ?? (() => ({
        refs: {},
        reactiveObjects: {},
        custom: {},
        timestamp: Date.now(),
      })),
      deserializeState: config.deserializeState ?? (() => {}),
    }
    this.registry = new ComponentRegistry(this.config)
  }

  /**
   * Register a component for HMR
   */
  register(instance: ComponentInstance): void {
    this.registry.register(instance)
  }

  /**
   * Unregister a component
   */
  unregister(instanceId: string): void {
    this.registry.unregister(instanceId)
  }

  /**
   * Handle a component update
   */
  async handleUpdate(update: HMRUpdate): Promise<void> {
    // Queue update to prevent race conditions
    this.updateQueue = this.updateQueue.then(() => this.processUpdate(update))
    return this.updateQueue
  }

  /**
   * Process a single update
   */
  private async processUpdate(update: HMRUpdate): Promise<void> {
    const instances = this.registry.getInstancesByFile(update.file)

    if (instances.length === 0) {
      if (this.config.verbose) {
        console.log(`[HMR] No instances found for: ${update.file}`)
      }
      return
    }

    if (this.config.verbose) {
      console.log(`[HMR] Updating ${instances.length} instance(s) of: ${update.file}`)
    }

    // Process each instance
    for (const instance of instances) {
      await this.updateInstance(instance, update)
    }

    // Dispatch global event
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('stx:hmr-update', {
        detail: { file: update.file, count: instances.length },
      }))
    }
  }

  /**
   * Update a single component instance
   */
  private async updateInstance(instance: ComponentInstance, update: HMRUpdate): Promise<void> {
    // Capture current state
    this.registry.captureState(instance.id)

    let errorOccurred = false
    const previousHTML = instance.element?.innerHTML || ''

    try {
      // Dispatch before update event
      instance.element?.dispatchEvent(new CustomEvent('stx:before-hmr-update', {
        bubbles: true,
      }))

      // Run cleanup before update
      instance.cleanup?.()

      // Apply update based on type
      if (update.type === 'style') {
        await this.updateStyles(instance, update)
      } else {
        await this.updateComponent(instance, update)
      }

      // Restore state
      const stateRestored = this.registry.restoreState(instance.id)

      // Re-run setup if state couldn't be restored
      if (!stateRestored && instance.setup) {
        await instance.setup()
      }

      // Dispatch after update event
      instance.element?.dispatchEvent(new CustomEvent('stx:after-hmr-update', {
        detail: { stateRestored },
        bubbles: true,
      }))

    } catch (error) {
      errorOccurred = true
      console.error(`[HMR] Error updating component ${instance.name}:`, error)

      if (this.config.errorRecovery) {
        // Restore previous HTML on error
        if (instance.element && previousHTML) {
          instance.element.innerHTML = previousHTML
          console.log(`[HMR] Recovered previous state for: ${instance.name}`)
        }

        // Dispatch error event
        instance.element?.dispatchEvent(new CustomEvent('stx:hmr-error', {
          detail: { error },
          bubbles: true,
        }))
      }
    }

    if (!errorOccurred && this.config.verbose) {
      console.log(`[HMR] Successfully updated: ${instance.name}`)
    }
  }

  /**
   * Update component HTML/JS
   */
  private async updateComponent(instance: ComponentInstance, update: HMRUpdate): Promise<void> {
    if (!instance.element) return

    // Parse new component code
    const { html, script } = this.parseComponentCode(update.code)

    // Update DOM
    if (html) {
      instance.element.innerHTML = html
    }

    // Execute new script
    if (script) {
      await this.executeScript(script, instance)
    }

    // Re-run render if available
    if (instance.render) {
      instance.element.innerHTML = instance.render()
    }

    // Re-initialize interactive elements
    this.reinitializeInteractivity(instance)
  }

  /**
   * Update component styles only
   */
  private async updateStyles(instance: ComponentInstance, update: HMRUpdate): Promise<void> {
    if (!instance.element) return

    // Extract style from update
    const styleMatch = update.code.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i)
    if (!styleMatch) return

    const newStyles = styleMatch[1]
    const componentId = instance.id

    // Find or create component style element
    let styleEl = document.querySelector(`style[data-stx-component="${componentId}"]`)
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.setAttribute('data-stx-component', componentId)
      document.head.appendChild(styleEl)
    }

    styleEl.textContent = newStyles

    if (this.config.verbose) {
      console.log(`[HMR] Updated styles for: ${instance.name}`)
    }
  }

  /**
   * Parse component code into parts
   */
  private parseComponentCode(code: string): { html: string; script: string; style: string } {
    let html = code
    let script = ''
    let style = ''

    // Extract script
    const scriptMatch = code.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
    if (scriptMatch) {
      script = scriptMatch[1]
      html = html.replace(scriptMatch[0], '')
    }

    // Extract style
    const styleMatch = code.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i)
    if (styleMatch) {
      style = styleMatch[1]
      html = html.replace(styleMatch[0], '')
    }

    return { html: html.trim(), script: script.trim(), style: style.trim() }
  }

  /**
   * Execute component script
   */
  private async executeScript(script: string, instance: ComponentInstance): Promise<void> {
    try {
      // Create a module-like context
      const context: Record<string, unknown> = {
        element: instance.element,
        props: instance.props,
        // Provide stx reactivity functions
        ...(typeof window !== 'undefined' ? (window as any).stx : {}),
      }

      // Wrap script in async function for top-level await support
      const wrappedScript = `
        return (async function() {
          ${script}
        })()
      `

      // Execute with context
      const fn = new Function(...Object.keys(context), wrappedScript)
      await fn(...Object.values(context))
    } catch (error) {
      console.error(`[HMR] Script execution error:`, error)
      throw error
    }
  }

  /**
   * Re-initialize interactive elements after update
   */
  private reinitializeInteractivity(instance: ComponentInstance): void {
    if (!instance.element) return

    // Find all elements with stx event bindings
    const eventElements = instance.element.querySelectorAll('[data-stx-events]')
    eventElements.forEach(el => {
      const eventsStr = el.getAttribute('data-stx-events')
      if (!eventsStr) return

      try {
        const events = JSON.parse(eventsStr)
        for (const [eventName, handlerName] of Object.entries(events)) {
          // Re-bind events if handler exists in window.stx scope
          if (typeof window !== 'undefined' && (window as any).stx?.[handlerName as string]) {
            el.addEventListener(eventName, (window as any).stx[handlerName as string])
          }
        }
      } catch {
        // Ignore parse errors
      }
    })

    // Dispatch event for custom re-initialization
    instance.element.dispatchEvent(new CustomEvent('stx:reinitialize', {
      bubbles: true,
    }))
  }

  /**
   * Get the component registry
   */
  getRegistry(): ComponentRegistry {
    return this.registry
  }

  /**
   * Manually trigger update for a component
   */
  async refresh(componentName: string): Promise<void> {
    const instances = this.registry.getInstancesByFile(componentName)
    for (const instance of instances) {
      if (instance.render && instance.element) {
        this.registry.captureState(instance.id)
        instance.element.innerHTML = instance.render()
        this.registry.restoreState(instance.id)
        this.reinitializeInteractivity(instance)
      }
    }
  }
}

// =============================================================================
// Client Script
// =============================================================================

/**
 * Generate the HMR client script for browser
 */
export function generateHMRClientScript(wsPort: number): string {
  return `
<script data-stx-hmr-client>
(function() {
  'use strict';

  // Component registry
  const __instances = new Map();
  const __stateSnapshots = new Map();

  // Register a component
  function registerComponent(id, name, element, props, setup, render, cleanup) {
    __instances.set(id, {
      id,
      name,
      element,
      props: props || {},
      setup,
      render,
      cleanup,
      state: { refs: {}, reactiveObjects: {}, custom: {}, timestamp: Date.now() },
      isMounted: true,
      children: new Map()
    });

    console.log('[HMR] Registered:', name, '(' + id + ')');
  }

  // Unregister a component
  function unregisterComponent(id) {
    const instance = __instances.get(id);
    if (instance) {
      instance.cleanup?.();
      __instances.delete(id);
      __stateSnapshots.delete(id);
    }
  }

  // Capture component state
  function captureState(id) {
    const instance = __instances.get(id);
    if (!instance || !instance.element) return;

    const state = { refs: {}, reactiveObjects: {}, custom: {}, timestamp: Date.now() };

    // Capture form values
    instance.element.querySelectorAll('input, textarea, select').forEach(el => {
      if (el.name || el.id) {
        state.refs[el.name || el.id] = el.type === 'checkbox' ? el.checked : el.value;
      }
    });

    // Capture data-stx-state attributes
    instance.element.querySelectorAll('[data-stx-state]').forEach(el => {
      const key = el.getAttribute('data-stx-state');
      const value = el.getAttribute('data-stx-value');
      if (key && value) {
        try { state.custom[key] = JSON.parse(value); }
        catch { state.custom[key] = value; }
      }
    });

    __stateSnapshots.set(id, state);
  }

  // Restore component state
  function restoreState(id) {
    const instance = __instances.get(id);
    const state = __stateSnapshots.get(id);
    if (!instance || !state || !instance.element) return false;

    // Restore form values
    Object.entries(state.refs).forEach(([name, value]) => {
      const el = instance.element.querySelector('[name="' + name + '"], #' + name);
      if (el) {
        if (el.type === 'checkbox') el.checked = value;
        else el.value = value;
      }
    });

    // Restore data-stx-state
    Object.entries(state.custom).forEach(([key, value]) => {
      const el = instance.element.querySelector('[data-stx-state="' + key + '"]');
      if (el) {
        el.setAttribute('data-stx-value', JSON.stringify(value));
        el.dispatchEvent(new CustomEvent('stx:state-restored', { detail: { key, value } }));
      }
    });

    return true;
  }

  // Handle HMR update
  async function handleUpdate(data) {
    const { file, code, type } = data;

    // Find matching instances
    const instances = [];
    __instances.forEach(inst => {
      if (inst.name === file || file.endsWith(inst.name + '.stx')) {
        instances.push(inst);
      }
    });

    if (instances.length === 0) {
      console.log('[HMR] No instances for:', file, '- doing full reload');
      window.location.reload();
      return;
    }

    console.log('[HMR] Updating', instances.length, 'instance(s) of:', file);

    for (const instance of instances) {
      try {
        // Capture state
        captureState(instance.id);

        // Run cleanup
        instance.cleanup?.();

        // Style-only update
        if (type === 'style') {
          const styleMatch = code.match(/<style[^>]*>([\\s\\S]*?)<\\/style>/i);
          if (styleMatch) {
            let styleEl = document.querySelector('style[data-stx-component="' + instance.id + '"]');
            if (!styleEl) {
              styleEl = document.createElement('style');
              styleEl.setAttribute('data-stx-component', instance.id);
              document.head.appendChild(styleEl);
            }
            styleEl.textContent = styleMatch[1];
          }
          continue;
        }

        // Full update - extract and apply HTML
        let html = code;
        html = html.replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi, '');
        html = html.replace(/<style[^>]*>[\\s\\S]*?<\\/style>/gi, '');
        html = html.trim();

        if (instance.element && html) {
          instance.element.innerHTML = html;
        }

        // Re-run setup
        if (instance.setup) {
          await instance.setup();
        }

        // Restore state
        restoreState(instance.id);

        // Dispatch events
        instance.element?.dispatchEvent(new CustomEvent('stx:hmr-updated', { bubbles: true }));

        console.log('[HMR] Updated:', instance.name);
      } catch (error) {
        console.error('[HMR] Update failed for', instance.name, error);
        // Restore previous state on error
        restoreState(instance.id);
      }
    }

    window.dispatchEvent(new CustomEvent('stx:hmr-complete', {
      detail: { file, count: instances.length }
    }));
  }

  // Connect to HMR WebSocket
  let ws = null;
  let reconnectTimer = null;

  function connect() {
    try {
      ws = new WebSocket('ws://' + window.location.hostname + ':${wsPort}');

      ws.onopen = () => {
        console.log('[HMR] Connected');
        clearTimeout(reconnectTimer);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'component-update') {
            await handleUpdate(data);
          } else if (data.type === 'reload') {
            // Fall back to full reload
            window.location.reload();
          }
        } catch (e) {
          console.error('[HMR] Message error:', e);
        }
      };

      ws.onclose = () => {
        ws = null;
        reconnectTimer = setTimeout(connect, 1000);
      };
    } catch (e) {
      reconnectTimer = setTimeout(connect, 1000);
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }

  // Expose API
  window.__stxHMR = {
    register: registerComponent,
    unregister: unregisterComponent,
    captureState,
    restoreState,
    refresh: (name) => handleUpdate({ file: name, code: '', type: 'refresh' }),
    instances: () => Array.from(__instances.values())
  };
})();
</script>
`
}

/**
 * Generate component wrapper code for HMR support
 */
export function wrapComponentForHMR(
  componentId: string,
  componentName: string,
  html: string,
  script: string
): string {
  return `
<div data-stx-component="${componentId}" data-stx-name="${componentName}">
  ${html}
</div>
<script>
(function() {
  const __id = '${componentId}';
  const __name = '${componentName}';
  const __element = document.querySelector('[data-stx-component="${componentId}"]');

  let __cleanup = null;

  async function __setup() {
    ${script}
  }

  function __render() {
    return __element?.innerHTML || '';
  }

  // Register with HMR
  if (window.__stxHMR) {
    window.__stxHMR.register(__id, __name, __element, {}, __setup, __render, () => __cleanup?.());
  }

  // Run setup
  __setup();

  // Cleanup on removal
  const observer = new MutationObserver((mutations) => {
    if (!document.body.contains(__element)) {
      observer.disconnect();
      if (window.__stxHMR) {
        window.__stxHMR.unregister(__id);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
</script>
`
}

// =============================================================================
// Singleton Instance
// =============================================================================

let globalHMRHandler: ComponentHMRHandler | null = null

/**
 * Get or create global HMR handler
 */
export function getHMRHandler(config?: ComponentHMRConfig): ComponentHMRHandler {
  if (!globalHMRHandler) {
    globalHMRHandler = new ComponentHMRHandler(config)
  }
  return globalHMRHandler
}

/**
 * Reset global HMR handler
 */
export function resetHMRHandler(): void {
  if (globalHMRHandler) {
    globalHMRHandler.getRegistry().clear()
    globalHMRHandler = null
  }
}

// =============================================================================
// Exports
// =============================================================================

export default {
  ComponentHMRHandler,
  getHMRHandler,
  resetHMRHandler,
  generateHMRClientScript,
  wrapComponentForHMR,
}
