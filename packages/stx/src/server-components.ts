/**
 * Server Components Module
 *
 * Provides React Server Components-like functionality for stx templates.
 * Server components render only on the server and stream to the client,
 * reducing JavaScript bundle size while enabling rich server-side data fetching.
 *
 * ## Features
 *
 * 1. **Server-Only Components** - Components that render only on the server
 * 2. **Client Components** - Interactive components that hydrate on the client
 * 3. **Async Data Fetching** - Suspend rendering while loading data
 * 4. **Streaming** - Progressive rendering with suspense boundaries
 * 5. **Selective Hydration** - Only hydrate interactive parts
 *
 * ## Usage
 *
 * ```html
 * @serverComponent('user-profile')
 *   <div>{{ await fetchUser(userId) }}</div>
 * @endserverComponent
 *
 * @clientComponent('counter')
 *   <button @click="increment">{{ count }}</button>
 * @endclientComponent
 * ```
 *
 * @module server-components
 */

import type { CustomDirective } from './types'

// =============================================================================
// Types
// =============================================================================

/** Server component definition */
export interface ServerComponent {
  /** Unique component name */
  name: string
  /** Template content */
  template: string
  /** Data loader function */
  loader?: (props: Record<string, unknown>) => Promise<Record<string, unknown>>
  /** Component dependencies (other components) */
  dependencies?: string[]
  /** Cache configuration */
  cache?: CacheConfig
  /** Error boundary fallback */
  errorBoundary?: string
  /** Loading state placeholder */
  suspenseFallback?: string
}

/** Client component definition */
export interface ClientComponent {
  /** Unique component name */
  name: string
  /** Server-rendered template */
  template: string
  /** Client-side script path or inline code */
  clientScript?: string
  /** Props to pass to client */
  clientProps?: string[]
  /** Hydration priority */
  priority?: 'eager' | 'lazy' | 'idle'
}

/** Cache configuration */
export interface CacheConfig {
  /** Enable caching */
  enabled: boolean
  /** Cache TTL in milliseconds */
  ttl?: number
  /** Cache key generator */
  keyGenerator?: (props: Record<string, unknown>) => string
  /** Stale-while-revalidate support */
  staleWhileRevalidate?: boolean
}

/** Server component rendering options */
export interface RenderOptions {
  /** Props to pass to the component */
  props?: Record<string, unknown>
  /** Enable streaming */
  streaming?: boolean
  /** Request context (for SSR) */
  request?: { url: string, headers: Record<string, string> }
  /** Signal for abort */
  signal?: AbortSignal
}

/** Server component render result */
export interface RenderResult {
  /** Rendered HTML content */
  html: string
  /** Time taken to render (ms) */
  renderTime: number
  /** Data loaded during render */
  data?: Record<string, unknown>
  /** Component dependencies that were resolved */
  dependencies: string[]
  /** Whether result was from cache */
  cached: boolean
  /** Hydration script (if client component) */
  hydrationScript?: string
}

/** Component registry entry */
interface ComponentEntry {
  component: ServerComponent | ClientComponent
  type: 'server' | 'client'
}

/** Suspense boundary state */
interface SuspenseState {
  id: string
  status: 'pending' | 'resolved' | 'error'
  promise?: Promise<unknown>
  result?: string
  error?: Error
}

// =============================================================================
// Component Registry
// =============================================================================

const componentRegistry = new Map<string, ComponentEntry>()
const componentCache = new Map<string, { html: string, timestamp: number, data?: Record<string, unknown> }>()

/**
 * Register a server component.
 */
export function registerServerComponent(component: ServerComponent): void {
  componentRegistry.set(component.name, {
    component,
    type: 'server',
  })
}

/**
 * Register a client component.
 */
export function registerClientComponent(component: ClientComponent): void {
  componentRegistry.set(component.name, {
    component,
    type: 'client',
  })
}

/**
 * Get a registered component.
 */
export function getComponent(name: string): ComponentEntry | undefined {
  return componentRegistry.get(name)
}

/**
 * Check if a component is registered.
 */
export function hasComponent(name: string): boolean {
  return componentRegistry.has(name)
}

/**
 * Get all registered component names.
 */
export function getComponentNames(): string[] {
  return Array.from(componentRegistry.keys())
}

/**
 * Clear all registered components.
 */
export function clearComponents(): void {
  componentRegistry.clear()
  componentCache.clear()
}

// =============================================================================
// Cache Management
// =============================================================================

/**
 * Generate a cache key for a component with props.
 */
function generateCacheKey(name: string, props: Record<string, unknown>): string {
  const propsHash = JSON.stringify(props)
  return `${name}:${hashString(propsHash)}`
}

/**
 * Simple string hash function.
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Get cached component result.
 */
function getCached(
  name: string,
  props: Record<string, unknown>,
  config?: CacheConfig,
): { html: string, data?: Record<string, unknown> } | null {
  if (!config?.enabled)
    return null

  const keyGen = config.keyGenerator || (p => generateCacheKey(name, p))
  const key = keyGen(props)
  const cached = componentCache.get(key)

  if (!cached)
    return null

  const now = Date.now()
  const ttl = config.ttl || 60000 // Default 1 minute

  if (now - cached.timestamp > ttl) {
    // Cache expired
    if (config.staleWhileRevalidate) {
      // Return stale, but also trigger revalidation (handled by caller)
      return { html: cached.html, data: cached.data }
    }
    componentCache.delete(key)
    return null
  }

  return { html: cached.html, data: cached.data }
}

/**
 * Set cached component result.
 */
function setCached(
  name: string,
  props: Record<string, unknown>,
  html: string,
  data?: Record<string, unknown>,
  config?: CacheConfig,
): void {
  if (!config?.enabled)
    return

  const keyGen = config.keyGenerator || (p => generateCacheKey(name, p))
  const key = keyGen(props)

  componentCache.set(key, {
    html,
    timestamp: Date.now(),
    data,
  })
}

/**
 * Clear component cache.
 */
export function clearComponentCache(name?: string): void {
  if (name) {
    // Clear cache for specific component
    for (const key of componentCache.keys()) {
      if (key.startsWith(`${name}:`)) {
        componentCache.delete(key)
      }
    }
  }
  else {
    componentCache.clear()
  }
}

// =============================================================================
// Server Component Rendering
// =============================================================================

/**
 * Render a server component.
 */
export async function renderServerComponent(
  name: string,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const startTime = performance.now()
  const { props = {}, signal } = options

  const entry = componentRegistry.get(name)
  if (!entry) {
    throw new Error(`Server component "${name}" not found`)
  }

  if (entry.type !== 'server') {
    throw new Error(`Component "${name}" is not a server component`)
  }

  const component = entry.component as ServerComponent

  // Check cache
  const cached = getCached(name, props, component.cache)
  if (cached) {
    return {
      html: cached.html,
      renderTime: performance.now() - startTime,
      data: cached.data,
      dependencies: component.dependencies || [],
      cached: true,
    }
  }

  // Check for abort
  if (signal?.aborted) {
    throw new Error('Render aborted')
  }

  try {
    // Load data if loader is defined
    let data: Record<string, unknown> = { ...props }
    if (component.loader) {
      data = {
        ...data,
        ...await component.loader(props),
      }
    }

    // Process template with data
    const html = await processServerTemplate(component.template, data)

    // Cache result
    setCached(name, props, html, data, component.cache)

    return {
      html,
      renderTime: performance.now() - startTime,
      data,
      dependencies: component.dependencies || [],
      cached: false,
    }
  }
  catch (error) {
    // Use error boundary if defined
    if (component.errorBoundary) {
      const errorHtml = await processServerTemplate(component.errorBoundary, {
        error: error instanceof Error ? error.message : String(error),
        ...props,
      })
      return {
        html: errorHtml,
        renderTime: performance.now() - startTime,
        dependencies: component.dependencies || [],
        cached: false,
      }
    }
    throw error
  }
}

/**
 * Render a client component (server-side with hydration markers).
 */
export async function renderClientComponent(
  name: string,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const startTime = performance.now()
  const { props = {} } = options

  const entry = componentRegistry.get(name)
  if (!entry) {
    throw new Error(`Client component "${name}" not found`)
  }

  if (entry.type !== 'client') {
    throw new Error(`Component "${name}" is not a client component`)
  }

  const component = entry.component as ClientComponent
  const id = `cc-${name}-${Math.random().toString(36).slice(2, 9)}`

  // Render server-side HTML
  const innerHtml = await processServerTemplate(component.template, props)

  // Extract client props to pass to hydration
  const clientPropsData: Record<string, unknown> = {}
  if (component.clientProps) {
    for (const prop of component.clientProps) {
      if (prop in props) {
        clientPropsData[prop] = props[prop]
      }
    }
  }

  // Wrap with hydration markers
  const html = `<div data-client-component="${name}" data-component-id="${id}" data-priority="${component.priority || 'lazy'}">
${innerHtml}
<script type="application/json" data-component-props="${id}">${JSON.stringify(clientPropsData)}</script>
</div>`

  // Generate hydration script
  const hydrationScript = component.clientScript
    ? `<script type="module" data-component-script="${id}">${component.clientScript}</script>`
    : undefined

  return {
    html,
    renderTime: performance.now() - startTime,
    data: props,
    dependencies: [],
    cached: false,
    hydrationScript,
  }
}

/**
 * Render any registered component.
 */
export async function renderComponent(
  name: string,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const entry = componentRegistry.get(name)
  if (!entry) {
    throw new Error(`Component "${name}" not found`)
  }

  if (entry.type === 'server') {
    return renderServerComponent(name, options)
  }
  else {
    return renderClientComponent(name, options)
  }
}

// =============================================================================
// Suspense Support
// =============================================================================

const suspenseStates = new Map<string, SuspenseState>()

/**
 * Create a suspense boundary.
 */
export function createSuspenseBoundary(
  id: string,
  fallback: string,
): { wrap: (promise: Promise<string>) => Promise<string>, getFallback: () => string } {
  const state: SuspenseState = {
    id,
    status: 'pending',
  }
  suspenseStates.set(id, state)

  return {
    wrap: async (promise: Promise<string>): Promise<string> => {
      state.promise = promise

      try {
        state.result = await promise
        state.status = 'resolved'
        return state.result
      }
      catch (error) {
        state.error = error instanceof Error ? error : new Error(String(error))
        state.status = 'error'
        throw error
      }
    },
    getFallback: () => fallback,
  }
}

/**
 * Get suspense state by ID.
 */
export function getSuspenseState(id: string): SuspenseState | undefined {
  return suspenseStates.get(id)
}

/**
 * Clear suspense state.
 */
export function clearSuspenseState(id?: string): void {
  if (id) {
    suspenseStates.delete(id)
  }
  else {
    suspenseStates.clear()
  }
}

// =============================================================================
// Streaming Render
// =============================================================================

/**
 * Create a streaming renderer for server components.
 */
export function createStreamingRenderer(
  components: string[],
  options: RenderOptions = {},
): {
    renderToStream: () => ReadableStream<string>
    renderToString: () => Promise<string>
  } {
  return {
    renderToStream: () => {
      return new ReadableStream<string>({
        async start(controller) {
          for (const name of components) {
            try {
              const result = await renderComponent(name, options)
              controller.enqueue(result.html)
              if (result.hydrationScript) {
                controller.enqueue(result.hydrationScript)
              }
            }
            catch (error) {
              const message = error instanceof Error ? error.message : String(error)
              controller.enqueue(`<!-- Error rendering ${name}: ${message} -->`)
            }
          }
          controller.close()
        },
      })
    },

    renderToString: async () => {
      const parts: string[] = []
      for (const name of components) {
        try {
          const result = await renderComponent(name, options)
          parts.push(result.html)
          if (result.hydrationScript) {
            parts.push(result.hydrationScript)
          }
        }
        catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          parts.push(`<!-- Error rendering ${name}: ${message} -->`)
        }
      }
      return parts.join('\n')
    },
  }
}

// =============================================================================
// Template Processing (simplified)
// =============================================================================

/**
 * Process server template with data context.
 * This is a simplified processor for server components.
 */
async function processServerTemplate(
  template: string,
  context: Record<string, unknown>,
): Promise<string> {
  let result = template

  // Process @foreach directives FIRST (before expressions)
  result = result.replace(/@foreach\s*\((\w+(?:\.\w+)*)\s+as\s+(\w+)\)([\s\S]*?)@endforeach/g, (_match, arrayExpr, itemVar, content) => {
    const array = getNestedValue(context, arrayExpr.trim())
    if (!Array.isArray(array))
      return ''

    return array.map((item, index) => {
      const itemContext = { ...context, [itemVar]: item, loop: { index, first: index === 0, last: index === array.length - 1 } }
      return processServerTemplateSync(content, itemContext)
    }).join('')
  })

  // Process @if directives (simplified)
  result = result.replace(/@if\s*\(([^)]+)\)([\s\S]*?)@endif/g, (_match, condition, content) => {
    const conditionValue = evaluateCondition(condition.trim(), context)
    return conditionValue ? content : ''
  })

  // Process simple expressions {{ expr }} LAST
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
    const trimmed = expr.trim()

    // Handle await expressions
    if (trimmed.startsWith('await ')) {
      // Await expressions are handled by the loader, just output the result
      const varName = trimmed.slice(6).split('(')[0].trim()
      return String(context[varName] ?? match)
    }

    // Handle simple variable access
    const parts = trimmed.split('.')
    let value: unknown = context

    for (const part of parts) {
      if (value === null || value === undefined)
        break
      value = (value as Record<string, unknown>)[part]
    }

    if (value === undefined || value === null) {
      return ''
    }

    // Escape HTML by default
    return escapeHtml(String(value))
  })

  return result
}

/**
 * Synchronous template processing for nested contexts.
 */
function processServerTemplateSync(
  template: string,
  context: Record<string, unknown>,
): string {
  let result = template

  // Process simple expressions
  result = result.replace(/\{\{([^}]+)\}\}/g, (_match, expr) => {
    const value = getNestedValue(context, expr.trim())
    if (value === undefined || value === null)
      return ''
    return escapeHtml(String(value))
  })

  return result
}

/**
 * Get nested value from object.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let value: unknown = obj

  for (const part of parts) {
    if (value === null || value === undefined)
      return undefined
    value = (value as Record<string, unknown>)[part]
  }

  return value
}

/**
 * Evaluate a condition expression.
 */
function evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
  // Simple truthy check
  const value = getNestedValue(context, condition)
  return Boolean(value)
}

/**
 * Escape HTML entities.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// =============================================================================
// Custom Directives
// =============================================================================

/**
 * @serverComponent directive for defining server components inline.
 */
export const serverComponentDirective: CustomDirective = {
  name: 'serverComponent',
  hasEndTag: true,
  handler: (content: string, params: string[], _context: Record<string, any>, _filePath: string): string => {
    if (!params || params.length === 0) {
      throw new Error('@serverComponent requires a name parameter')
    }

    const name = params[0].replace(/['"`]/g, '')
    const id = `sc-${name}-${Math.random().toString(36).slice(2, 9)}`

    // Register the component for later rendering
    registerServerComponent({
      name,
      template: content,
    })

    // Return a placeholder that will be replaced during streaming
    return `<div data-server-component="${name}" data-component-id="${id}">${content}</div>`
  },
}

/**
 * @clientComponent directive for defining client components inline.
 */
export const clientComponentDirective: CustomDirective = {
  name: 'clientComponent',
  hasEndTag: true,
  handler: (content: string, params: string[], _context: Record<string, any>, _filePath: string): string => {
    if (!params || params.length === 0) {
      throw new Error('@clientComponent requires a name parameter')
    }

    const name = params[0].replace(/['"`]/g, '')
    const priority = params[1]?.replace(/['"`]/g, '') as 'eager' | 'lazy' | 'idle' | undefined
    const id = `cc-${name}-${Math.random().toString(36).slice(2, 9)}`

    // Extract client script if present
    const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
    const clientScript = scriptMatch ? scriptMatch[1] : undefined
    const templateContent = scriptMatch
      ? content.replace(scriptMatch[0], '')
      : content

    // Register the component
    registerClientComponent({
      name,
      template: templateContent,
      clientScript,
      priority: priority || 'lazy',
    })

    // Return hydration wrapper
    return `<div data-client-component="${name}" data-component-id="${id}" data-priority="${priority || 'lazy'}">
${templateContent}
</div>`
  },
}

/**
 * @suspense directive for async boundaries.
 */
export const suspenseDirective: CustomDirective = {
  name: 'suspense',
  hasEndTag: true,
  handler: (content: string, params: string[], _context: Record<string, any>, _filePath: string): string => {
    const fallback = params[0]?.replace(/['"`]/g, '') || 'Loading...'
    const id = `suspense-${Math.random().toString(36).slice(2, 9)}`

    // Create suspense boundary (stores state for later resolution)
    createSuspenseBoundary(id, fallback)

    // Return placeholder with fallback
    return `<div data-suspense="${id}" data-fallback="${escapeHtml(fallback)}">
${content}
</div>`
  },
}

/**
 * Register all server component directives.
 */
export function registerServerComponentDirectives(): CustomDirective[] {
  return [
    serverComponentDirective,
    clientComponentDirective,
    suspenseDirective,
  ]
}

// =============================================================================
// Client Hydration Runtime Generator
// =============================================================================

/**
 * Generate client-side runtime for server components hydration.
 */
export function generateServerComponentsRuntime(): string {
  return `
(function() {
  'use strict';

  const stxServerComponents = {
    components: new Map(),

    registerComponent(name, hydrator) {
      this.components.set(name, hydrator);
    },

    hydrateComponent(element) {
      const name = element.dataset.clientComponent;
      const id = element.dataset.componentId;
      const hydrator = this.components.get(name);

      if (!hydrator) {
        console.warn('[stx] No hydrator for component:', name);
        return;
      }

      const propsEl = element.querySelector('[data-component-props="' + id + '"]');
      const props = propsEl ? JSON.parse(propsEl.textContent || '{}') : {};

      try {
        hydrator(element, props);
        element.dataset.hydrated = 'true';
      } catch (error) {
        console.error('[stx] Hydration error:', name, error);
      }
    },

    hydrateAll() {
      const components = document.querySelectorAll('[data-client-component]');
      const eager = [];
      const lazy = [];
      const idle = [];

      components.forEach(el => {
        const priority = el.dataset.priority || 'lazy';
        if (priority === 'eager') eager.push(el);
        else if (priority === 'idle') idle.push(el);
        else lazy.push(el);
      });

      // Hydrate eager immediately
      eager.forEach(el => this.hydrateComponent(el));

      // Hydrate lazy on intersection
      if (lazy.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              observer.unobserve(entry.target);
              this.hydrateComponent(entry.target);
            }
          });
        }, { rootMargin: '50px' });
        lazy.forEach(el => observer.observe(el));
      } else {
        lazy.forEach(el => this.hydrateComponent(el));
      }

      // Hydrate idle during browser idle
      if (idle.length && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          idle.forEach(el => this.hydrateComponent(el));
        });
      } else {
        setTimeout(() => {
          idle.forEach(el => this.hydrateComponent(el));
        }, 100);
      }
    }
  };

  window.__stxServerComponents = stxServerComponents;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => stxServerComponents.hydrateAll());
  } else {
    stxServerComponents.hydrateAll();
  }
})();`
}
