/**
 * Client-side functionality for bun-plugin-stx
 * This file is meant to be used in the browser
 */

// Version info
export const version = '1.0.0'

/**
 * Configuration for island hydration
 */
export interface HydrationConfig {
  /** Auto start hydration on page load */
  autoStart?: boolean
  /** Preload strategy */
  preload?: 'none' | 'eager' | 'lazy'
}

/**
 * Island handler registry
 */
export type IslandHandlers = Record<string, () => Promise<any>>

/**
 * Island hydration function type
 */
export type HydrationFunction = (element: HTMLElement, props: any) => void | Promise<void>

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

/**
 * Hydrate an island component
 */
async function hydrateIsland(
  element: HTMLElement,
  name: string,
  handler: () => Promise<any>,
): Promise<void> {
  if (!isBrowser) return

  try {
    // Get island props from the associated script tag
    const id = element.getAttribute('data-island-id')
    const propsScript = document.querySelector(`script[data-island-props="${id}"]`) as HTMLScriptElement
    const props = propsScript ? JSON.parse(propsScript.textContent || '{}') : {}

    // Load the handler module
    const module = await handler()
    const hydrateFn: HydrationFunction = module.default || module.hydrate

    if (typeof hydrateFn !== 'function') {
      console.error(`Island handler for "${name}" does not export a valid hydration function`)
      return
    }

    // Hydrate the island
    await hydrateFn(element, props)

    // Mark as hydrated
    element.setAttribute('data-hydrated', 'true')
  }
  catch (error) {
    console.error(`Failed to hydrate island "${name}":`, error)
  }
}

/**
 * Hydrate all islands with the given handlers
 */
export function hydrateIslands(handlers: IslandHandlers): void {
  // Skip hydration if not in browser
  if (!isBrowser) return

  // First pass: prepare islands and hydrate eager ones
  const islands = document.querySelectorAll('[data-island]')
  const lazyIslands: Array<[HTMLElement, string]> = []

  islands.forEach((island: Element) => {
    const name = island.getAttribute('data-island')
    const priority = island.getAttribute('data-priority') || 'lazy'

    // Skip if no handler or already hydrated
    if (!name || !handlers[name] || island.getAttribute('data-hydrated') === 'true') {
      return
    }

    if (priority === 'eager') {
      // Hydrate eager islands immediately
      hydrateIsland(island as HTMLElement, name, handlers[name])
    }
    else {
      // Queue lazy islands
      lazyIslands.push([island as HTMLElement, name])
    }
  })

  // Second pass: set up intersection observer for lazy islands
  if (lazyIslands.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          const name = element.getAttribute('data-island')

          // Hydrate when in viewport
          if (name && handlers[name] && element.getAttribute('data-hydrated') !== 'true') {
            hydrateIsland(element, name, handlers[name])
            observer.unobserve(element)
          }
        }
      })
    }, {
      rootMargin: '200px', // Start loading a bit before visible
      threshold: 0,
    })

    // Observe all lazy islands
    lazyIslands.forEach(([element]) => {
      observer.observe(element)
    })
  }
  else {
    // Fallback for browsers without IntersectionObserver: delay load all lazy islands
    setTimeout(() => {
      lazyIslands.forEach(([element, name]) => {
        if (element.getAttribute('data-hydrated') !== 'true') {
          hydrateIsland(element, name, handlers[name])
        }
      })
    }, 1000)
  }
}

/**
 * Add preload links for island scripts
 */
export function preloadIslandHandlers(handlers: IslandHandlers): void {
  // Skip if not in browser
  if (!isBrowser) return

  // Add preload links to document head
  Object.entries(handlers).forEach(([name, getHandler]) => {
    // This is a bit of a hack to get the module URL
    // In real-world usage, you'd use import.meta.url or similar
    try {
      const handlerString = getHandler.toString()
      const moduleMatch = handlerString.match(/import\(['"](.+)['"]\)/)

      if (moduleMatch && moduleMatch[1]) {
        const link = document.createElement('link')
        link.rel = 'modulepreload'
        link.href = moduleMatch[1]
        link.setAttribute('data-island-module', name)
        document.head.appendChild(link)
      }
    }
    catch (error) {
      console.warn(`Failed to preload island handler for "${name}":`, error)
    }
  })
}

/**
 * Initialize island hydration with the given handlers
 */
export function initIslands(handlers: IslandHandlers, config: HydrationConfig = {}): void {
  // Skip if not in browser
  if (!isBrowser) return

  const defaultConfig = {
    autoStart: true,
    preload: 'lazy',
  }

  const options = { ...defaultConfig, ...config }

  // Preload handlers if configured
  if (options.preload !== 'none') {
    preloadIslandHandlers(handlers)
  }

  // Auto-start hydration if configured
  if (options.autoStart) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        hydrateIslands(handlers)
      })
    } else {
      // DOM already loaded
      hydrateIslands(handlers)
    }
  }
}
