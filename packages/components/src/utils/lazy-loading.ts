/**
 * Lazy loading utilities for @stacksjs/components
 *
 * Provides component-level code splitting and lazy loading with
 * intersection observer support for on-demand loading
 *
 * @example
 * ```ts
 * import { lazyLoad, lazyLoadComponent } from '@stacksjs/components'
 *
 * // Lazy load a component
 * const LazyButton = lazyLoadComponent(() => import('./Button'))
 *
 * // Lazy load on intersection
 * lazyLoad(element, () => import('./heavy-component'))
 * ```
 */

/**
 * Lazy loading options
 */
export interface LazyLoadOptions {
  /** IntersectionObserver root element */
  root?: Element | null
  /** Root margin for intersection observer */
  rootMargin?: string
  /** Threshold for intersection observer */
  threshold?: number | number[]
  /** Placeholder content while loading */
  placeholder?: string | HTMLElement
  /** Error content if loading fails */
  errorContent?: string | HTMLElement
  /** Callback when component starts loading */
  onLoading?: () => void
  /** Callback when component loads successfully */
  onLoaded?: (module: any) => void
  /** Callback when loading fails */
  onError?: (error: Error) => void
}

/**
 * Component lazy load options
 */
export interface ComponentLazyLoadOptions extends LazyLoadOptions {
  /** Whether to preload the component on hover */
  preloadOnHover?: boolean
  /** Retry attempts on failure */
  retryAttempts?: number
  /** Retry delay in milliseconds */
  retryDelay?: number
}

/**
 * Lazy load state
 */
export type LazyLoadState = 'idle' | 'loading' | 'loaded' | 'error'

/**
 * Lazy loaded component wrapper
 */
export interface LazyComponent<T = any> {
  /** Current load state */
  state: LazyLoadState
  /** Loaded module (if loaded) */
  module?: T
  /** Loading error (if failed) */
  error?: Error
  /** Load the component */
  load: () => Promise<T>
  /** Preload the component without rendering */
  preload: () => Promise<T>
}

/**
 * Cache for lazy loaded modules
 */
const moduleCache = new Map<string, Promise<any>>()

/**
 * Lazy load a module with caching
 *
 * @param importFn - Dynamic import function
 * @param cacheKey - Optional cache key (defaults to function string)
 * @returns Promise of module
 */
export async function lazyLoadModule<T = any>(
  importFn: () => Promise<T>,
  cacheKey?: string,
): Promise<T> {
  const key = cacheKey || importFn.toString()

  if (moduleCache.has(key)) {
    return moduleCache.get(key)!
  }

  const promise = importFn()
  moduleCache.set(key, promise)

  try {
    return await promise
  }
  catch (error) {
    // Remove from cache on error to allow retry
    moduleCache.delete(key)
    throw error
  }
}

/**
 * Create a lazy loaded component
 *
 * @param importFn - Dynamic import function
 * @param options - Lazy load options
 * @returns Lazy component wrapper
 *
 * @example
 * ```ts
 * const LazyButton = lazyLoadComponent(
 *   () => import('./components/Button'),
 *   { preloadOnHover: true }
 * )
 *
 * // Later, load and use
 * const button = await LazyButton.load()
 * ```
 */
export function lazyLoadComponent<T = any>(
  importFn: () => Promise<T>,
  options: ComponentLazyLoadOptions = {},
): LazyComponent<T> {
  const {
    retryAttempts = 3,
    retryDelay = 1000,
    onLoading,
    onLoaded,
    onError,
  } = options

  let state: LazyLoadState = 'idle'
  let module: T | undefined
  let error: Error | undefined

  const loadWithRetry = async (attempt = 0): Promise<T> => {
    try {
      if (state === 'loading' || state === 'loaded') {
        if (module) {
          return module
        }
      }

      state = 'loading'
      onLoading?.()

      const loaded = await lazyLoadModule(importFn)
      module = loaded
      state = 'loaded'
      onLoaded?.(loaded)

      return loaded
    }
    catch (err) {
      const loadError = err as Error

      if (attempt < retryAttempts) {
        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        return loadWithRetry(attempt + 1)
      }

      state = 'error'
      error = loadError
      onError?.(loadError)
      throw loadError
    }
  }

  return {
    get state() {
      return state
    },
    get module() {
      return module
    },
    get error() {
      return error
    },
    load: () => loadWithRetry(),
    preload: () => loadWithRetry(),
  }
}

/**
 * Lazy load content when element enters viewport
 *
 * @param element - Target element to observe
 * @param importFn - Dynamic import function
 * @param options - Lazy load options
 * @returns Cleanup function
 *
 * @example
 * ```ts
 * const cleanup = lazyLoad(
 *   document.getElementById('heavy-component'),
 *   () => import('./HeavyComponent'),
 *   {
 *     rootMargin: '50px',
 *     placeholder: '<div>Loading...</div>'
 *   }
 * )
 * ```
 */
export function lazyLoad<T = any>(
  element: Element | null,
  importFn: () => Promise<T>,
  options: LazyLoadOptions = {},
): () => void {
  if (!element) {
    console.warn('lazyLoad: element is null')
    return () => {}
  }

  const {
    root = null,
    rootMargin = '0px',
    threshold = 0.01,
    placeholder,
    errorContent,
    onLoading,
    onLoaded,
    onError,
  } = options

  let hasLoaded = false
  let observer: IntersectionObserver | null = null

  // Set placeholder
  if (placeholder) {
    if (typeof placeholder === 'string') {
      element.innerHTML = placeholder
    }
    else {
      element.innerHTML = ''
      element.appendChild(placeholder)
    }
  }

  const handleIntersection: IntersectionObserverCallback = async (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !hasLoaded) {
        hasLoaded = true
        observer?.disconnect()

        try {
          onLoading?.()

          const module = await lazyLoadModule(importFn)

          onLoaded?.(module)

          // If module has a default export with render method
          if (module && typeof (module as any).default?.render === 'function') {
            const content = await (module as any).default.render()
            element.innerHTML = content
          }
        }
        catch (error) {
          const loadError = error as Error
          onError?.(loadError)

          // Set error content
          if (errorContent) {
            if (typeof errorContent === 'string') {
              element.innerHTML = errorContent
            }
            else {
              element.innerHTML = ''
              element.appendChild(errorContent)
            }
          }
          else {
            element.innerHTML = `<div style="color: red;">Failed to load component: ${loadError.message}</div>`
          }
        }
      }
    }
  }

  // Create intersection observer
  observer = new IntersectionObserver(handleIntersection, {
    root,
    rootMargin,
    threshold,
  })

  observer.observe(element)

  // Return cleanup function
  return () => {
    observer?.disconnect()
    observer = null
  }
}

/**
 * Lazy load multiple elements
 *
 * @param elements - Array of elements or NodeList
 * @param importFn - Dynamic import function or function that takes element
 * @param options - Lazy load options
 * @returns Cleanup function
 */
export function lazyLoadAll<T = any>(
  elements: Element[] | NodeListOf<Element>,
  importFn: ((element: Element) => Promise<T>) | (() => Promise<T>),
  options: LazyLoadOptions = {},
): () => void {
  const cleanupFunctions: Array<() => void> = []

  const elementsArray = Array.from(elements)

  for (const element of elementsArray) {
    const importFunction = typeof importFn === 'function' && importFn.length > 0
      ? () => (importFn as (element: Element) => Promise<T>)(element)
      : (importFn as () => Promise<T>)

    const cleanup = lazyLoad(element, importFunction, options)
    cleanupFunctions.push(cleanup)
  }

  // Return combined cleanup function
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup())
  }
}

/**
 * Preload a module without executing it
 *
 * Useful for prefetching components that will likely be needed soon
 *
 * @param importFn - Dynamic import function
 * @returns Promise of module
 */
export function preloadModule<T = any>(importFn: () => Promise<T>): Promise<T> {
  return lazyLoadModule(importFn)
}

/**
 * Preload multiple modules
 *
 * @param importFns - Array of dynamic import functions
 * @returns Promise of all modules
 */
export function preloadModules(importFns: Array<() => Promise<any>>): Promise<any[]> {
  return Promise.all(importFns.map(fn => preloadModule(fn)))
}

/**
 * Clear module cache
 *
 * Useful for testing or forcing re-imports
 *
 * @param cacheKey - Optional specific key to clear, or clear all if undefined
 */
export function clearModuleCache(cacheKey?: string): void {
  if (cacheKey) {
    moduleCache.delete(cacheKey)
  }
  else {
    moduleCache.clear()
  }
}

/**
 * Get cache statistics
 *
 * @returns Cache size and keys
 */
export function getCacheStats(): { size: number, keys: string[] } {
  return {
    size: moduleCache.size,
    keys: Array.from(moduleCache.keys()),
  }
}

/**
 * Route-based code splitting helper
 *
 * Lazy loads components based on route patterns
 *
 * @example
 * ```ts
 * const routes = {
 *   '/': () => import('./pages/Home'),
 *   '/about': () => import('./pages/About'),
 *   '/blog/:id': () => import('./pages/BlogPost')
 * }
 *
 * const loader = createRouteLoader(routes)
 * const component = await loader.load('/about')
 * ```
 */
export function createRouteLoader(routes: Record<string, () => Promise<any>>) {
  return {
    /**
     * Load component for route
     */
    async load(path: string): Promise<any> {
      const importFn = routes[path]
      if (!importFn) {
        throw new Error(`No route found for path: ${path}`)
      }
      return lazyLoadModule(importFn, `route:${path}`)
    },

    /**
     * Preload component for route
     */
    async preload(path: string): Promise<any> {
      return this.load(path)
    },

    /**
     * Preload multiple routes
     */
    async preloadRoutes(paths: string[]): Promise<any[]> {
      return Promise.all(paths.map(path => this.preload(path)))
    },
  }
}

/**
 * Image lazy loading helper
 *
 * @param img - Image element
 * @param src - Image source URL
 * @param options - Lazy load options
 * @returns Cleanup function
 */
export function lazyLoadImage(
  img: HTMLImageElement | null,
  src: string,
  options: LazyLoadOptions = {},
): () => void {
  if (!img) {
    return () => {}
  }

  const {
    root = null,
    rootMargin = '50px',
    threshold = 0.01,
    placeholder,
    onLoading,
    onLoaded,
    onError,
  } = options

  // Set placeholder
  if (placeholder && typeof placeholder === 'string') {
    img.src = placeholder
  }

  let hasLoaded = false
  let observer: IntersectionObserver | null = null

  const handleIntersection: IntersectionObserverCallback = (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !hasLoaded) {
        hasLoaded = true
        observer?.disconnect()

        onLoading?.()

        img.src = src

        img.addEventListener('load', () => {
          onLoaded?.(img)
          img.classList.add('loaded')
        }, { once: true })

        img.addEventListener('error', (event) => {
          const error = new Error(`Failed to load image: ${src}`)
          onError?.(error)
          img.classList.add('error')
        }, { once: true })
      }
    }
  }

  observer = new IntersectionObserver(handleIntersection, {
    root,
    rootMargin,
    threshold,
  })

  observer.observe(img)

  return () => {
    observer?.disconnect()
    observer = null
  }
}

/**
 * Lazy load all images with data-lazy-src attribute
 *
 * @param container - Container element to search within
 * @param options - Lazy load options
 * @returns Cleanup function
 */
export function lazyLoadImages(
  container: Element | Document = document,
  options: LazyLoadOptions = {},
): () => void {
  const images = container.querySelectorAll<HTMLImageElement>('img[data-lazy-src]')
  const cleanupFunctions: Array<() => void> = []

  images.forEach((img) => {
    const src = img.getAttribute('data-lazy-src')
    if (src) {
      const cleanup = lazyLoadImage(img, src, options)
      cleanupFunctions.push(cleanup)
    }
  })

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup())
  }
}
