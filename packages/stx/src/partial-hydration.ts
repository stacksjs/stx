/**
 * Partial Hydration Module (Islands Architecture)
 *
 * Enables selective hydration of interactive components, leaving static
 * content as plain HTML. This dramatically reduces JavaScript bundle size
 * and improves page load performance.
 *
 * Hydration Strategies:
 * - @client:load - Hydrate immediately on page load
 * - @client:idle - Hydrate when browser is idle (requestIdleCallback)
 * - @client:visible - Hydrate when component enters viewport (IntersectionObserver)
 * - @client:media - Hydrate when media query matches
 * - @client:only - Only render on client (no SSR)
 * - @client:hover - Hydrate on first hover/focus
 * - @client:event - Hydrate on custom event
 *
 * @example
 * ```html
 * @client:visible(rootMargin: '100px')
 *   <InteractiveCarousel :items="items" />
 * @endclient
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type HydrationStrategy =
  | 'load'
  | 'idle'
  | 'visible'
  | 'media'
  | 'only'
  | 'hover'
  | 'event'

export interface HydrationOptions {
  /** Strategy for when to hydrate */
  strategy: HydrationStrategy
  /** Priority for idle hydration (default: 'low') */
  priority?: 'high' | 'low'
  /** Root margin for intersection observer (visible strategy) */
  rootMargin?: string
  /** Threshold for intersection observer */
  threshold?: number | number[]
  /** Media query string (media strategy) */
  media?: string
  /** Event name to listen for (event strategy) */
  event?: string
  /** Timeout in ms before forcing hydration */
  timeout?: number
  /** Placeholder content while loading */
  placeholder?: string
  /** Whether to preserve server HTML until hydration */
  preserveServerHTML?: boolean
}

export interface IslandComponent {
  /** Unique identifier for the island */
  id: string
  /** Component name or path */
  component: string
  /** Props to pass to the component */
  props: Record<string, unknown>
  /** Hydration options */
  options: HydrationOptions
  /** Server-rendered HTML */
  serverHTML: string
  /** Whether the island has been hydrated */
  hydrated: boolean
}

export interface IslandRegistry {
  /** All registered islands */
  islands: Map<string, IslandComponent>
  /** Register an island */
  register: (island: IslandComponent) => void
  /** Get an island by ID */
  get: (id: string) => IslandComponent | undefined
  /** Hydrate an island */
  hydrate: (id: string) => Promise<void>
  /** Hydrate all islands */
  hydrateAll: () => Promise<void>
}

// ============================================================================
// Island Registry
// ============================================================================

/**
 * Create a registry for managing island components
 */
export function createIslandRegistry(): IslandRegistry {
  const islands = new Map<string, IslandComponent>()

  return {
    islands,

    register(island: IslandComponent): void {
      islands.set(island.id, island)
    },

    get(id: string): IslandComponent | undefined {
      return islands.get(id)
    },

    async hydrate(id: string): Promise<void> {
      const island = islands.get(id)
      if (!island || island.hydrated) return

      // Mark as hydrated
      island.hydrated = true

      // Dispatch hydration event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('stx:hydrate', {
            detail: { id, component: island.component },
          })
        )
      }
    },

    async hydrateAll(): Promise<void> {
      const promises = Array.from(islands.values())
        .filter((island) => !island.hydrated)
        .map((island) => this.hydrate(island.id))

      await Promise.all(promises)
    },
  }
}

// ============================================================================
// Hydration Strategies Implementation
// ============================================================================

/**
 * Generate hydration script for load strategy
 */
function generateLoadHydration(islandId: string): string {
  return `
    <script data-hydrate="${islandId}">
      (function() {
        const island = document.querySelector('[data-island="${islandId}"]');
        if (!island) return;

        // Immediately hydrate
        island.classList.add('hydrated');
        island.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }));
      })();
    </script>
  `
}

/**
 * Generate hydration script for idle strategy
 */
function generateIdleHydration(islandId: string, options: HydrationOptions): string {
  const timeout = options.timeout || 2000
  const priority = options.priority || 'low'

  return `
    <script data-hydrate="${islandId}">
      (function() {
        const island = document.querySelector('[data-island="${islandId}"]');
        if (!island) return;

        function hydrate() {
          if (island.classList.contains('hydrated')) return;
          island.classList.add('hydrated');
          island.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }));
        }

        if ('requestIdleCallback' in window) {
          const idleOptions = { timeout: ${timeout} };
          ${priority === 'high' ? 'requestIdleCallback(hydrate, idleOptions);' : `
          // Low priority: wait for multiple idle periods
          let idleCount = 0;
          function waitForIdle() {
            requestIdleCallback((deadline) => {
              if (deadline.didTimeout || ++idleCount >= 2) {
                hydrate();
              } else {
                waitForIdle();
              }
            }, idleOptions);
          }
          waitForIdle();
          `}
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(hydrate, ${timeout});
        }
      })();
    </script>
  `
}

/**
 * Generate hydration script for visible strategy (IntersectionObserver)
 */
function generateVisibleHydration(islandId: string, options: HydrationOptions): string {
  const rootMargin = options.rootMargin || '0px'
  const threshold = options.threshold || 0

  return `
    <script data-hydrate="${islandId}">
      (function() {
        const island = document.querySelector('[data-island="${islandId}"]');
        if (!island) return;

        function hydrate() {
          if (island.classList.contains('hydrated')) return;
          island.classList.add('hydrated');
          island.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }));
        }

        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                observer.disconnect();
                hydrate();
              }
            });
          }, {
            rootMargin: '${rootMargin}',
            threshold: ${JSON.stringify(threshold)}
          });

          observer.observe(island);
        } else {
          // Fallback: hydrate on load
          hydrate();
        }
      })();
    </script>
  `
}

/**
 * Generate hydration script for media strategy
 */
function generateMediaHydration(islandId: string, options: HydrationOptions): string {
  const media = options.media || '(min-width: 768px)'

  return `
    <script data-hydrate="${islandId}">
      (function() {
        const island = document.querySelector('[data-island="${islandId}"]');
        if (!island) return;

        function hydrate() {
          if (island.classList.contains('hydrated')) return;
          island.classList.add('hydrated');
          island.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }));
        }

        const mediaQuery = window.matchMedia('${media}');

        function handleMediaChange(e) {
          if (e.matches) {
            mediaQuery.removeEventListener('change', handleMediaChange);
            hydrate();
          }
        }

        if (mediaQuery.matches) {
          hydrate();
        } else {
          mediaQuery.addEventListener('change', handleMediaChange);
        }
      })();
    </script>
  `
}

/**
 * Generate hydration script for hover strategy
 */
function generateHoverHydration(islandId: string): string {
  return `
    <script data-hydrate="${islandId}">
      (function() {
        const island = document.querySelector('[data-island="${islandId}"]');
        if (!island) return;

        function hydrate() {
          if (island.classList.contains('hydrated')) return;
          island.classList.add('hydrated');
          island.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }));
        }

        // Hydrate on first interaction
        const events = ['mouseenter', 'focusin', 'touchstart'];
        const handler = () => {
          events.forEach(e => island.removeEventListener(e, handler));
          hydrate();
        };

        events.forEach(e => island.addEventListener(e, handler, { once: true, passive: true }));
      })();
    </script>
  `
}

/**
 * Generate hydration script for custom event strategy
 */
function generateEventHydration(islandId: string, options: HydrationOptions): string {
  const eventName = options.event || 'stx:activate'

  return `
    <script data-hydrate="${islandId}">
      (function() {
        const island = document.querySelector('[data-island="${islandId}"]');
        if (!island) return;

        function hydrate() {
          if (island.classList.contains('hydrated')) return;
          island.classList.add('hydrated');
          island.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }));
        }

        // Listen for custom event
        window.addEventListener('${eventName}', function handler(e) {
          if (!e.detail || e.detail.id === '${islandId}' || e.detail.id === '*') {
            window.removeEventListener('${eventName}', handler);
            hydrate();
          }
        });
      })();
    </script>
  `
}

// ============================================================================
// Directive Processing
// ============================================================================

/**
 * Process all partial hydration directives
 */
export function processPartialHydrationDirectives(
  template: string,
  context: Record<string, unknown> = {},
  _filePath?: string
): string {
  let result = template

  // Process @client:load
  result = processClientDirective(result, 'load', context)

  // Process @client:idle
  result = processClientDirective(result, 'idle', context)

  // Process @client:visible
  result = processClientDirective(result, 'visible', context)

  // Process @client:media
  result = processClientDirective(result, 'media', context)

  // Process @client:only (client-only rendering)
  result = processClientOnly(result)

  // Process @client:hover
  result = processClientDirective(result, 'hover', context)

  // Process @client:event
  result = processClientDirective(result, 'event', context)

  return result
}

/**
 * Process a specific client directive
 */
function processClientDirective(
  template: string,
  strategy: HydrationStrategy,
  _context: Record<string, unknown>
): string {
  // Match @client:strategy(options) ... @endclient
  const regex = new RegExp(
    `@client:${strategy}(?:\\s*\\(([^)]*)\\))?\\s*([\\s\\S]*?)@endclient`,
    'gi'
  )

  return template.replace(regex, (_, optionsStr, content) => {
    // Parse options
    let options: HydrationOptions = { strategy }

    if (optionsStr) {
      try {
        // Parse key: value pairs
        const optionPairs = optionsStr.split(',').map((s: string) => s.trim())
        for (const pair of optionPairs) {
          const [key, value] = pair.split(':').map((s: string) => s.trim())
          if (key && value) {
            // Remove quotes from string values
            const cleanValue = value.replace(/^['"]|['"]$/g, '')
            ;(options as Record<string, unknown>)[key] = cleanValue
          }
        }
      }
      catch {
        // Use defaults
      }
    }

    // Generate unique island ID
    const islandId = `island-${Math.random().toString(36).substring(2, 9)}`

    // Generate hydration script based on strategy
    let hydrationScript = ''
    switch (strategy) {
      case 'load':
        hydrationScript = generateLoadHydration(islandId)
        break
      case 'idle':
        hydrationScript = generateIdleHydration(islandId, options)
        break
      case 'visible':
        hydrationScript = generateVisibleHydration(islandId, options)
        break
      case 'media':
        hydrationScript = generateMediaHydration(islandId, options)
        break
      case 'hover':
        hydrationScript = generateHoverHydration(islandId)
        break
      case 'event':
        hydrationScript = generateEventHydration(islandId, options)
        break
    }

    // Wrap content in island container
    return `
      <div data-island="${islandId}"
           data-strategy="${strategy}"
           class="stx-island"
           style="contents;">
        ${content.trim()}
      </div>
      ${hydrationScript}
    `
  })
}

/**
 * Process @client:only directive (client-side only rendering)
 */
function processClientOnly(template: string): string {
  const regex = /@client:only\s*([\s\S]*?)@endclient/gi

  return template.replace(regex, (_, content) => {
    const islandId = `island-only-${Math.random().toString(36).substring(2, 9)}`

    return `
      <div data-island="${islandId}"
           data-strategy="only"
           class="stx-island stx-client-only">
        <!-- Client-only content will be rendered here -->
        <template data-client-content>${content.trim()}</template>
      </div>
      <script data-hydrate="${islandId}">
        (function() {
          const island = document.querySelector('[data-island="${islandId}"]');
          if (!island) return;

          const template = island.querySelector('template[data-client-content]');
          if (template) {
            island.innerHTML = template.innerHTML;
            island.classList.add('hydrated');
          }
        })();
      </script>
    `
  })
}

// ============================================================================
// CSS Generation
// ============================================================================

/**
 * Generate CSS for partial hydration
 */
export function generatePartialHydrationCSS(): string {
  return `
    /* Island base styles */
    .stx-island {
      display: contents;
    }

    /* Pre-hydration state */
    .stx-island:not(.hydrated) {
      /* Optional: add loading indicator */
    }

    /* Hydrated state */
    .stx-island.hydrated {
      /* Island is now interactive */
    }

    /* Client-only placeholder */
    .stx-client-only:not(.hydrated) {
      min-height: 50px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: island-shimmer 1.5s infinite;
    }

    @keyframes island-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Hydration transition */
    .stx-island {
      transition: opacity 0.2s ease-out;
    }

    .stx-island:not(.hydrated) {
      opacity: 0.7;
    }

    .stx-island.hydrated {
      opacity: 1;
    }
  `
}

// ============================================================================
// Runtime Helpers
// ============================================================================

/**
 * Manually hydrate an island by ID
 */
export function hydrateIsland(islandId: string): void {
  if (typeof window === 'undefined') return

  const island = document.querySelector(`[data-island="${islandId}"]`)
  if (!island || island.classList.contains('hydrated')) return

  island.classList.add('hydrated')
  island.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }))
}

/**
 * Hydrate all islands with a specific strategy
 */
export function hydrateByStrategy(strategy: HydrationStrategy): void {
  if (typeof window === 'undefined') return

  const islands = document.querySelectorAll(`[data-strategy="${strategy}"]:not(.hydrated)`)
  islands.forEach((island) => {
    island.classList.add('hydrated')
    island.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }))
  })
}

/**
 * Hydrate all pending islands
 */
export function hydrateAll(): void {
  if (typeof window === 'undefined') return

  const islands = document.querySelectorAll('.stx-island:not(.hydrated)')
  islands.forEach((island) => {
    island.classList.add('hydrated')
    island.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }))
  })
}

/**
 * Check if an island is hydrated
 */
export function isHydrated(islandId: string): boolean {
  if (typeof window === 'undefined') return false

  const island = document.querySelector(`[data-island="${islandId}"]`)
  return island?.classList.contains('hydrated') ?? false
}

/**
 * Wait for an island to be hydrated
 */
export function onHydrated(islandId: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    const island = document.querySelector(`[data-island="${islandId}"]`)
    if (!island) {
      resolve()
      return
    }

    if (island.classList.contains('hydrated')) {
      resolve()
      return
    }

    island.addEventListener('stx:hydrated', () => resolve(), { once: true })
  })
}

// ============================================================================
// Server-Side Helpers
// ============================================================================

/**
 * Mark content as static (never hydrate)
 */
export function processStaticDirectives(template: string): string {
  // @static content is rendered as-is without any hydration wrapper
  return template.replace(/@static\s*([\s\S]*?)@endstatic/gi, (_, content) => {
    return `<div class="stx-static">${content.trim()}</div>`
  })
}

/**
 * Generate island manifest for client
 */
export function generateIslandManifest(islands: IslandComponent[]): string {
  const manifest = islands.map((island) => ({
    id: island.id,
    component: island.component,
    strategy: island.options.strategy,
    props: island.props,
  }))

  return `
    <script type="application/json" id="stx-island-manifest">
      ${JSON.stringify(manifest)}
    </script>
  `
}

// ============================================================================
// Exports
// ============================================================================

export default {
  processPartialHydrationDirectives,
  processStaticDirectives,
  generatePartialHydrationCSS,
  generateIslandManifest,
  createIslandRegistry,
  hydrateIsland,
  hydrateByStrategy,
  hydrateAll,
  isHydrated,
  onHydrated,
}
