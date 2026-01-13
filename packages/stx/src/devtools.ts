/**
 * STX DevTools Integration
 *
 * Provides debugging and inspection tools for STX applications.
 *
 * @module devtools
 *
 * @example
 * ```html
 * <script>
 * import { enableDevTools } from 'stx'
 *
 * // Enable DevTools in development
 * if (process.env.NODE_ENV === 'development') {
 *   enableDevTools()
 * }
 * </script>
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export interface ComponentInfo {
  /** Unique component ID */
  id: string
  /** Component name */
  name: string
  /** File path (if available) */
  file?: string
  /** Parent component ID */
  parentId?: string
  /** Child component IDs */
  children: string[]
  /** Current props */
  props: Record<string, unknown>
  /** Current state */
  state: Record<string, unknown>
  /** Exposed methods/properties */
  exposed: string[]
  /** DOM element */
  element?: HTMLElement
  /** Render count */
  renderCount: number
  /** Last render time (ms) */
  lastRenderTime: number
  /** Creation timestamp */
  createdAt: number
}

export interface StoreInfo {
  /** Store ID */
  id: string
  /** Current state */
  state: Record<string, unknown>
  /** Getter values */
  getters: Record<string, unknown>
  /** Action names */
  actions: string[]
  /** Mutation history */
  history: MutationRecord[]
}

export interface MutationRecord {
  /** Mutation timestamp */
  timestamp: number
  /** Type of mutation */
  type: 'state' | 'action'
  /** Property or action name */
  name: string
  /** Previous value */
  oldValue?: unknown
  /** New value */
  newValue?: unknown
  /** Stack trace */
  stack?: string
}

export interface EventRecord {
  /** Event timestamp */
  timestamp: number
  /** Event type */
  type: string
  /** Source component ID */
  componentId?: string
  /** Event payload */
  payload: unknown
  /** Event target info */
  target?: string
}

export interface PerformanceMetric {
  /** Metric name */
  name: string
  /** Duration in ms */
  duration: number
  /** Timestamp */
  timestamp: number
  /** Component ID (if applicable) */
  componentId?: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

export interface DevToolsState {
  /** Whether DevTools is enabled */
  enabled: boolean
  /** Component tree */
  components: Map<string, ComponentInfo>
  /** Store states */
  stores: Map<string, StoreInfo>
  /** Event timeline */
  events: EventRecord[]
  /** Performance metrics */
  performance: PerformanceMetric[]
  /** Selected component ID */
  selectedComponent: string | null
  /** Selected store ID */
  selectedStore: string | null
  /** Max events to keep */
  maxEvents: number
  /** Max performance records */
  maxPerformance: number
}

// =============================================================================
// DevTools State
// =============================================================================

const devToolsState: DevToolsState = {
  enabled: false,
  components: new Map(),
  stores: new Map(),
  events: [],
  performance: [],
  selectedComponent: null,
  selectedStore: null,
  maxEvents: 1000,
  maxPerformance: 500,
}

// =============================================================================
// Enable/Disable DevTools
// =============================================================================

/**
 * Enable STX DevTools.
 */
export function enableDevTools(options: {
  maxEvents?: number
  maxPerformance?: number
} = {}): void {
  if (typeof window === 'undefined') return

  devToolsState.enabled = true
  devToolsState.maxEvents = options.maxEvents || 1000
  devToolsState.maxPerformance = options.maxPerformance || 500

  // Expose DevTools API globally
  ;(window as unknown as Record<string, unknown>).__STX_DEVTOOLS__ = {
    getState: () => devToolsState,
    getComponents: () => Array.from(devToolsState.components.values()),
    getComponent: (id: string) => devToolsState.components.get(id),
    getStores: () => Array.from(devToolsState.stores.values()),
    getStore: (id: string) => devToolsState.stores.get(id),
    getEvents: () => devToolsState.events,
    getPerformance: () => devToolsState.performance,
    selectComponent: (id: string) => selectComponent(id),
    selectStore: (id: string) => selectStore(id),
    inspectElement: (element: HTMLElement) => inspectElement(element),
    highlightComponent: (id: string) => highlightComponent(id),
    clearHighlight: () => clearHighlight(),
    logComponentTree: () => logComponentTree(),
    logStoreState: (id?: string) => logStoreState(id),
    timeTravel: (index: number, storeId: string) => timeTravel(index, storeId),
  }

  // Inject DevTools panel
  injectDevToolsPanel()

  // Set up mutation observer for component tracking
  setupComponentObserver()

  console.log('%c[STX DevTools] Enabled', 'color: #10b981; font-weight: bold;')
}

/**
 * Disable STX DevTools.
 */
export function disableDevTools(): void {
  devToolsState.enabled = false
  delete (window as unknown as Record<string, unknown>).__STX_DEVTOOLS__

  // Remove DevTools panel
  const panel = document.getElementById('stx-devtools-panel')
  if (panel) panel.remove()

  console.log('%c[STX DevTools] Disabled', 'color: #ef4444;')
}

// =============================================================================
// Component Tracking
// =============================================================================

let componentIdCounter = 0

/**
 * Register a component with DevTools.
 */
export function registerComponent(
  name: string,
  element: HTMLElement,
  props: Record<string, unknown> = {},
  state: Record<string, unknown> = {},
  file?: string,
): string {
  if (!devToolsState.enabled) return ''

  const id = `stx-${++componentIdCounter}`
  element.setAttribute('data-stx-component-id', id)

  // Find parent component
  let parentId: string | undefined
  let parent = element.parentElement
  while (parent) {
    const parentComponentId = parent.getAttribute('data-stx-component-id')
    if (parentComponentId) {
      parentId = parentComponentId
      const parentInfo = devToolsState.components.get(parentId)
      if (parentInfo) {
        parentInfo.children.push(id)
      }
      break
    }
    parent = parent.parentElement
  }

  const info: ComponentInfo = {
    id,
    name,
    file,
    parentId,
    children: [],
    props,
    state,
    exposed: [],
    element,
    renderCount: 1,
    lastRenderTime: 0,
    createdAt: Date.now(),
  }

  devToolsState.components.set(id, info)

  recordEvent({
    timestamp: Date.now(),
    type: 'component:mounted',
    componentId: id,
    payload: { name, props },
  })

  return id
}

/**
 * Update component state in DevTools.
 */
export function updateComponentState(
  id: string,
  state: Record<string, unknown>,
): void {
  if (!devToolsState.enabled) return

  const info = devToolsState.components.get(id)
  if (info) {
    info.state = { ...info.state, ...state }
    info.renderCount++

    recordEvent({
      timestamp: Date.now(),
      type: 'component:updated',
      componentId: id,
      payload: { state },
    })
  }
}

/**
 * Update component props in DevTools.
 */
export function updateComponentProps(
  id: string,
  props: Record<string, unknown>,
): void {
  if (!devToolsState.enabled) return

  const info = devToolsState.components.get(id)
  if (info) {
    const oldProps = { ...info.props }
    info.props = { ...info.props, ...props }

    recordEvent({
      timestamp: Date.now(),
      type: 'component:props-changed',
      componentId: id,
      payload: { oldProps, newProps: props },
    })
  }
}

/**
 * Unregister a component from DevTools.
 */
export function unregisterComponent(id: string): void {
  if (!devToolsState.enabled) return

  const info = devToolsState.components.get(id)
  if (info) {
    // Remove from parent's children
    if (info.parentId) {
      const parent = devToolsState.components.get(info.parentId)
      if (parent) {
        parent.children = parent.children.filter((c) => c !== id)
      }
    }

    devToolsState.components.delete(id)

    recordEvent({
      timestamp: Date.now(),
      type: 'component:unmounted',
      componentId: id,
      payload: { name: info.name },
    })
  }
}

// =============================================================================
// Store Tracking
// =============================================================================

/**
 * Register a store with DevTools.
 */
export function registerStore(
  id: string,
  initialState: Record<string, unknown>,
  getters: Record<string, unknown> = {},
  actions: string[] = [],
): void {
  if (!devToolsState.enabled) return

  const info: StoreInfo = {
    id,
    state: initialState,
    getters,
    actions,
    history: [{
      timestamp: Date.now(),
      type: 'state',
      name: '__init__',
      newValue: initialState,
    }],
  }

  devToolsState.stores.set(id, info)

  recordEvent({
    timestamp: Date.now(),
    type: 'store:registered',
    payload: { id, state: initialState },
  })
}

/**
 * Record a store mutation.
 */
export function recordStoreMutation(
  storeId: string,
  name: string,
  oldValue: unknown,
  newValue: unknown,
  type: 'state' | 'action' = 'state',
): void {
  if (!devToolsState.enabled) return

  const store = devToolsState.stores.get(storeId)
  if (store) {
    const record: MutationRecord = {
      timestamp: Date.now(),
      type,
      name,
      oldValue,
      newValue,
      stack: new Error().stack,
    }

    store.history.push(record)

    // Keep history bounded
    if (store.history.length > 100) {
      store.history = store.history.slice(-100)
    }

    // Update current state
    if (type === 'state') {
      store.state = { ...store.state, [name]: newValue }
    }

    recordEvent({
      timestamp: Date.now(),
      type: `store:${type}`,
      payload: { storeId, name, oldValue, newValue },
    })
  }
}

/**
 * Update store getters.
 */
export function updateStoreGetters(
  storeId: string,
  getters: Record<string, unknown>,
): void {
  if (!devToolsState.enabled) return

  const store = devToolsState.stores.get(storeId)
  if (store) {
    store.getters = getters
  }
}

// =============================================================================
// Event Recording
// =============================================================================

/**
 * Record an event in the timeline.
 */
export function recordEvent(event: EventRecord): void {
  if (!devToolsState.enabled) return

  devToolsState.events.push(event)

  // Keep events bounded
  if (devToolsState.events.length > devToolsState.maxEvents) {
    devToolsState.events = devToolsState.events.slice(-devToolsState.maxEvents)
  }

  // Emit to DevTools panel
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('stx:devtools:event', { detail: event }))
  }
}

// =============================================================================
// Performance Tracking
// =============================================================================

/**
 * Record a performance metric.
 */
export function recordPerformance(metric: PerformanceMetric): void {
  if (!devToolsState.enabled) return

  devToolsState.performance.push(metric)

  // Keep metrics bounded
  if (devToolsState.performance.length > devToolsState.maxPerformance) {
    devToolsState.performance = devToolsState.performance.slice(-devToolsState.maxPerformance)
  }
}

/**
 * Measure execution time of a function.
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  componentId?: string,
): T {
  if (!devToolsState.enabled) {
    return fn()
  }

  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start

  recordPerformance({
    name,
    duration,
    timestamp: Date.now(),
    componentId,
  })

  return result
}

/**
 * Measure async execution time.
 */
export async function measurePerformanceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  componentId?: string,
): Promise<T> {
  if (!devToolsState.enabled) {
    return fn()
  }

  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start

  recordPerformance({
    name,
    duration,
    timestamp: Date.now(),
    componentId,
  })

  return result
}

// =============================================================================
// Inspection & Debugging
// =============================================================================

/**
 * Select a component for inspection.
 */
function selectComponent(id: string): ComponentInfo | undefined {
  devToolsState.selectedComponent = id
  const info = devToolsState.components.get(id)

  if (info) {
    highlightComponent(id)
    console.log('%c[STX DevTools] Selected component:', 'color: #3b82f6;', info)
  }

  return info
}

/**
 * Select a store for inspection.
 */
function selectStore(id: string): StoreInfo | undefined {
  devToolsState.selectedStore = id
  const info = devToolsState.stores.get(id)

  if (info) {
    console.log('%c[STX DevTools] Selected store:', 'color: #8b5cf6;', info)
  }

  return info
}

/**
 * Inspect a DOM element to find its component.
 */
function inspectElement(element: HTMLElement): ComponentInfo | undefined {
  let current: HTMLElement | null = element

  while (current) {
    const id = current.getAttribute('data-stx-component-id')
    if (id) {
      return selectComponent(id)
    }
    current = current.parentElement
  }

  console.log('%c[STX DevTools] No component found for element', 'color: #f59e0b;')
  return undefined
}

/**
 * Highlight a component in the page.
 */
function highlightComponent(id: string): void {
  clearHighlight()

  const info = devToolsState.components.get(id)
  if (info?.element) {
    const overlay = document.createElement('div')
    overlay.id = 'stx-devtools-highlight'
    overlay.style.cssText = `
      position: absolute;
      background: rgba(59, 130, 246, 0.2);
      border: 2px solid #3b82f6;
      pointer-events: none;
      z-index: 999999;
      transition: all 0.15s ease;
    `

    const rect = info.element.getBoundingClientRect()
    overlay.style.top = `${rect.top + window.scrollY}px`
    overlay.style.left = `${rect.left + window.scrollX}px`
    overlay.style.width = `${rect.width}px`
    overlay.style.height = `${rect.height}px`

    // Add label
    const label = document.createElement('div')
    label.style.cssText = `
      position: absolute;
      top: -24px;
      left: 0;
      background: #3b82f6;
      color: white;
      padding: 2px 8px;
      font-size: 12px;
      font-family: monospace;
      border-radius: 4px;
      white-space: nowrap;
    `
    label.textContent = `<${info.name}>`
    overlay.appendChild(label)

    document.body.appendChild(overlay)
  }
}

/**
 * Clear component highlight.
 */
function clearHighlight(): void {
  const existing = document.getElementById('stx-devtools-highlight')
  if (existing) existing.remove()
}

/**
 * Log the component tree to console.
 */
function logComponentTree(): void {
  console.group('%c[STX DevTools] Component Tree', 'color: #10b981; font-weight: bold;')

  // Find root components (no parent)
  const roots = Array.from(devToolsState.components.values())
    .filter((c) => !c.parentId)

  function logComponent(info: ComponentInfo, indent: number): void {
    const prefix = '  '.repeat(indent)
    console.log(
      `${prefix}%c<${info.name}>%c id=${info.id} renders=${info.renderCount}`,
      'color: #3b82f6;',
      'color: #6b7280;',
    )

    if (Object.keys(info.props).length > 0) {
      console.log(`${prefix}  props:`, info.props)
    }

    if (Object.keys(info.state).length > 0) {
      console.log(`${prefix}  state:`, info.state)
    }

    for (const childId of info.children) {
      const child = devToolsState.components.get(childId)
      if (child) {
        logComponent(child, indent + 1)
      }
    }
  }

  for (const root of roots) {
    logComponent(root, 0)
  }

  console.groupEnd()
}

/**
 * Log store state to console.
 */
function logStoreState(storeId?: string): void {
  console.group('%c[STX DevTools] Store State', 'color: #8b5cf6; font-weight: bold;')

  const stores = storeId
    ? [devToolsState.stores.get(storeId)].filter(Boolean)
    : Array.from(devToolsState.stores.values())

  for (const store of stores) {
    if (store) {
      console.group(`Store: ${store.id}`)
      console.log('State:', store.state)
      console.log('Getters:', store.getters)
      console.log('Actions:', store.actions)
      console.log('History:', store.history)
      console.groupEnd()
    }
  }

  console.groupEnd()
}

/**
 * Time travel to a previous store state.
 */
function timeTravel(historyIndex: number, storeId: string): void {
  const store = devToolsState.stores.get(storeId)
  if (!store) return

  if (historyIndex < 0 || historyIndex >= store.history.length) {
    console.warn('[STX DevTools] Invalid history index')
    return
  }

  // Reconstruct state up to the given index
  const reconstructed: Record<string, unknown> = {}
  for (let i = 0; i <= historyIndex; i++) {
    const record = store.history[i]
    if (record.type === 'state' && record.name !== '__init__') {
      reconstructed[record.name] = record.newValue
    } else if (record.name === '__init__') {
      Object.assign(reconstructed, record.newValue)
    }
  }

  console.log(
    `%c[STX DevTools] Time traveled to index ${historyIndex}`,
    'color: #f59e0b;',
    reconstructed,
  )

  // Update the actual store if possible
  if (typeof window !== 'undefined' && (window as Record<string, unknown>).__STX_STORES__) {
    const stores = (window as Record<string, unknown>).__STX_STORES__ as Record<string, unknown>
    const actualStore = stores[storeId] as Record<string, unknown> | undefined
    if (actualStore && typeof actualStore.$patch === 'function') {
      (actualStore.$patch as (state: Record<string, unknown>) => void)(reconstructed)
    }
  }
}

// =============================================================================
// Component Observer
// =============================================================================

function setupComponentObserver(): void {
  if (typeof MutationObserver === 'undefined') return

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Track removed components
      mutation.removedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          const id = node.getAttribute('data-stx-component-id')
          if (id) {
            unregisterComponent(id)
          }
          // Also check children
          node.querySelectorAll('[data-stx-component-id]').forEach((child) => {
            const childId = child.getAttribute('data-stx-component-id')
            if (childId) {
              unregisterComponent(childId)
            }
          })
        }
      })
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

// =============================================================================
// DevTools Panel UI
// =============================================================================

function injectDevToolsPanel(): void {
  if (typeof document === 'undefined') return

  // Check if panel already exists
  if (document.getElementById('stx-devtools-panel')) return

  const panel = document.createElement('div')
  panel.id = 'stx-devtools-panel'
  panel.innerHTML = `
    <style>
      #stx-devtools-panel {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 400px;
        height: 300px;
        background: #1f2937;
        color: #e5e7eb;
        font-family: ui-monospace, monospace;
        font-size: 12px;
        border-top-left-radius: 8px;
        box-shadow: -4px -4px 20px rgba(0,0,0,0.3);
        z-index: 999998;
        display: flex;
        flex-direction: column;
        transform: translateY(calc(100% - 32px));
        transition: transform 0.2s ease;
      }
      #stx-devtools-panel.open {
        transform: translateY(0);
      }
      #stx-devtools-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: #374151;
        border-top-left-radius: 8px;
        cursor: pointer;
        user-select: none;
      }
      #stx-devtools-header:hover {
        background: #4b5563;
      }
      #stx-devtools-title {
        font-weight: bold;
        color: #10b981;
      }
      #stx-devtools-tabs {
        display: flex;
        border-bottom: 1px solid #374151;
      }
      .stx-devtools-tab {
        padding: 6px 12px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      }
      .stx-devtools-tab:hover {
        background: #374151;
      }
      .stx-devtools-tab.active {
        border-bottom-color: #3b82f6;
        color: #3b82f6;
      }
      #stx-devtools-content {
        flex: 1;
        overflow: auto;
        padding: 8px;
      }
      .stx-devtools-component {
        padding: 4px 8px;
        cursor: pointer;
        border-radius: 4px;
      }
      .stx-devtools-component:hover {
        background: #374151;
      }
      .stx-devtools-component.selected {
        background: #3b82f6;
      }
      .stx-devtools-component-name {
        color: #60a5fa;
      }
      .stx-devtools-component-id {
        color: #6b7280;
        font-size: 10px;
        margin-left: 8px;
      }
      .stx-devtools-section {
        margin-bottom: 8px;
      }
      .stx-devtools-section-title {
        color: #9ca3af;
        font-size: 10px;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .stx-devtools-json {
        background: #111827;
        padding: 4px 8px;
        border-radius: 4px;
        white-space: pre-wrap;
        word-break: break-all;
      }
    </style>
    <div id="stx-devtools-header">
      <span id="stx-devtools-title">STX DevTools</span>
      <span id="stx-devtools-toggle">▲</span>
    </div>
    <div id="stx-devtools-tabs">
      <div class="stx-devtools-tab active" data-tab="components">Components</div>
      <div class="stx-devtools-tab" data-tab="stores">Stores</div>
      <div class="stx-devtools-tab" data-tab="events">Events</div>
    </div>
    <div id="stx-devtools-content">
      <div id="stx-devtools-components-tab"></div>
    </div>
  `

  document.body.appendChild(panel)

  // Toggle panel
  const header = panel.querySelector('#stx-devtools-header')
  const toggle = panel.querySelector('#stx-devtools-toggle')
  header?.addEventListener('click', () => {
    panel.classList.toggle('open')
    if (toggle) {
      toggle.textContent = panel.classList.contains('open') ? '▼' : '▲'
    }
  })

  // Tab switching
  const tabs = panel.querySelectorAll('.stx-devtools-tab')
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')
      updateDevToolsContent(tab.getAttribute('data-tab') || 'components')
    })
  })

  // Update content periodically
  setInterval(() => {
    const activeTab = panel.querySelector('.stx-devtools-tab.active')
    if (activeTab && panel.classList.contains('open')) {
      updateDevToolsContent(activeTab.getAttribute('data-tab') || 'components')
    }
  }, 1000)
}

function updateDevToolsContent(tab: string): void {
  const content = document.getElementById('stx-devtools-content')
  if (!content) return

  switch (tab) {
    case 'components':
      content.innerHTML = renderComponentsTab()
      break
    case 'stores':
      content.innerHTML = renderStoresTab()
      break
    case 'events':
      content.innerHTML = renderEventsTab()
      break
  }

  // Add click handlers for components
  content.querySelectorAll('.stx-devtools-component').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-id')
      if (id) selectComponent(id)
    })
  })
}

function renderComponentsTab(): string {
  const components = Array.from(devToolsState.components.values())
  const roots = components.filter((c) => !c.parentId)

  function renderTree(info: ComponentInfo, indent: number): string {
    const children = info.children
      .map((id) => devToolsState.components.get(id))
      .filter(Boolean)
      .map((c) => renderTree(c!, indent + 1))
      .join('')

    return `
      <div class="stx-devtools-component ${devToolsState.selectedComponent === info.id ? 'selected' : ''}"
           data-id="${info.id}"
           style="padding-left: ${indent * 16 + 8}px">
        <span class="stx-devtools-component-name">&lt;${info.name}&gt;</span>
        <span class="stx-devtools-component-id">${info.id}</span>
      </div>
      ${children}
    `
  }

  if (roots.length === 0) {
    return '<div style="color: #6b7280; padding: 8px;">No components registered</div>'
  }

  return roots.map((r) => renderTree(r, 0)).join('')
}

function renderStoresTab(): string {
  const stores = Array.from(devToolsState.stores.values())

  if (stores.length === 0) {
    return '<div style="color: #6b7280; padding: 8px;">No stores registered</div>'
  }

  return stores.map((store) => `
    <div class="stx-devtools-section">
      <div class="stx-devtools-section-title">${store.id}</div>
      <div class="stx-devtools-json">${JSON.stringify(store.state, null, 2)}</div>
    </div>
  `).join('')
}

function renderEventsTab(): string {
  const events = devToolsState.events.slice(-20).reverse()

  if (events.length === 0) {
    return '<div style="color: #6b7280; padding: 8px;">No events recorded</div>'
  }

  return events.map((event) => `
    <div style="padding: 4px 0; border-bottom: 1px solid #374151;">
      <span style="color: #60a5fa;">${event.type}</span>
      <span style="color: #6b7280; font-size: 10px; margin-left: 8px;">
        ${new Date(event.timestamp).toLocaleTimeString()}
      </span>
    </div>
  `).join('')
}

// =============================================================================
// Exports
// =============================================================================

export {
  devToolsState,
  selectComponent,
  selectStore,
  inspectElement,
  highlightComponent,
  clearHighlight,
  logComponentTree,
  logStoreState,
  timeTravel,
}
