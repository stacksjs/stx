/**
 * STX Client-Side Router
 *
 * Lightweight SPA router for STX applications.
 * Intercepts navigation, fetches pages via AJAX, and swaps content.
 */

export interface RouterOptions {
  /** Selector for the content container to swap (default: 'main') */
  container?: string
  /** Selector for links to intercept (default: 'a[href]') */
  linkSelector?: string
  /** CSS class added during navigation (default: 'stx-navigating') */
  loadingClass?: string
  /** Enable view transitions API if available (default: true) */
  viewTransitions?: boolean
  /** Cache fetched pages (default: true) */
  cache?: boolean
  /** Scroll to top on navigation (default: true) */
  scrollToTop?: boolean
  /** Callback before navigation */
  onBeforeNavigate?: (url: string) => boolean | void
  /** Callback after navigation */
  onAfterNavigate?: (url: string) => void
  /** Callback on navigation error */
  onError?: (error: Error, url: string) => void
}

interface CacheEntry {
  html: string
  title: string
  timestamp: number
}

class STXRouter {
  private options: Required<RouterOptions>
  private cache: Map<string, CacheEntry> = new Map()
  private isNavigating = false
  private currentUrl: string

  constructor(options: RouterOptions = {}) {
    this.options = {
      container: options.container ?? 'main',
      linkSelector: options.linkSelector ?? 'a[href]',
      loadingClass: options.loadingClass ?? 'stx-navigating',
      viewTransitions: options.viewTransitions ?? true,
      cache: options.cache ?? true,
      scrollToTop: options.scrollToTop ?? true,
      onBeforeNavigate: options.onBeforeNavigate ?? (() => true),
      onAfterNavigate: options.onAfterNavigate ?? (() => {}),
      onError: options.onError ?? ((err) => console.error('[STX Router]', err)),
    }
    this.currentUrl = window.location.href
  }

  /**
   * Initialize the router
   */
  init(): void {
    // Intercept link clicks
    document.addEventListener('click', this.handleClick.bind(this))

    // Handle browser back/forward
    window.addEventListener('popstate', this.handlePopState.bind(this))

    // Cache current page
    if (this.options.cache) {
      this.cacheCurrentPage()
    }
  }

  /**
   * Navigate to a URL programmatically
   */
  async navigate(url: string, pushState = true): Promise<void> {
    if (this.isNavigating) return

    const targetUrl = new URL(url, window.location.origin)

    // Skip if same page or different origin
    if (targetUrl.href === this.currentUrl) return
    if (targetUrl.origin !== window.location.origin) {
      window.location.href = url
      return
    }

    // Before navigate callback
    if (this.options.onBeforeNavigate(url) === false) return

    this.isNavigating = true
    document.body.classList.add(this.options.loadingClass)

    try {
      const content = await this.fetchPage(targetUrl.href)

      if (content) {
        await this.swapContent(content)

        if (pushState) {
          window.history.pushState({ url: targetUrl.href }, '', targetUrl.href)
        }

        this.currentUrl = targetUrl.href

        if (this.options.scrollToTop) {
          window.scrollTo({ top: 0, behavior: 'instant' })
        }

        this.options.onAfterNavigate(targetUrl.href)
      }
    } catch (error) {
      this.options.onError(error as Error, url)
      // Fallback to full page load
      window.location.href = url
    } finally {
      this.isNavigating = false
      document.body.classList.remove(this.options.loadingClass)
    }
  }

  /**
   * Prefetch a page for faster navigation
   */
  async prefetch(url: string): Promise<void> {
    const targetUrl = new URL(url, window.location.origin)
    if (targetUrl.origin !== window.location.origin) return
    if (this.cache.has(targetUrl.href)) return

    try {
      await this.fetchPage(targetUrl.href)
    } catch {
      // Silently fail prefetch
    }
  }

  /**
   * Clear the page cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  private handleClick(event: MouseEvent): void {
    // Find closest link
    const link = (event.target as Element).closest(this.options.linkSelector) as HTMLAnchorElement
    if (!link) return

    // Skip if modifier keys pressed
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    // Skip if not left click
    if (event.button !== 0) return

    // Skip if link has target
    if (link.target && link.target !== '_self') return

    // Skip if download link
    if (link.hasAttribute('download')) return

    // Skip if external link
    const href = link.getAttribute('href')
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

    // Skip if data-stx-no-router
    if (link.hasAttribute('data-stx-no-router')) return

    const targetUrl = new URL(href, window.location.origin)
    if (targetUrl.origin !== window.location.origin) return

    event.preventDefault()
    this.navigate(href)
  }

  private handlePopState(event: PopStateEvent): void {
    const url = event.state?.url || window.location.href
    this.navigate(url, false)
  }

  private async fetchPage(url: string): Promise<{ html: string; title: string } | null> {
    // Check cache first
    if (this.options.cache && this.cache.has(url)) {
      const cached = this.cache.get(url)!
      // Cache valid for 5 minutes
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        return { html: cached.html, title: cached.title }
      }
      this.cache.delete(url)
    }

    const response = await fetch(url, {
      headers: {
        'X-STX-Router': 'true',
        'Accept': 'text/html',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`)
    }

    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const container = doc.querySelector(this.options.container)
    if (!container) {
      throw new Error(`Container "${this.options.container}" not found in response`)
    }

    const result = {
      html: container.innerHTML,
      title: doc.title,
    }

    // Cache the result
    if (this.options.cache) {
      this.cache.set(url, { ...result, timestamp: Date.now() })
    }

    return result
  }

  private async swapContent(content: { html: string; title: string }): Promise<void> {
    const container = document.querySelector(this.options.container)
    if (!container) {
      throw new Error(`Container "${this.options.container}" not found`)
    }

    const swap = () => {
      container.innerHTML = content.html
      document.title = content.title

      // Re-run any inline scripts in the new content
      const scripts = container.querySelectorAll('script')
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script')
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value)
        })
        newScript.textContent = oldScript.textContent
        oldScript.parentNode?.replaceChild(newScript, oldScript)
      })

      // Dispatch event for components to reinitialize
      window.dispatchEvent(new CustomEvent('stx:navigate', { detail: { url: this.currentUrl } }))
    }

    // Use View Transitions API if available
    if (this.options.viewTransitions && 'startViewTransition' in document) {
      await (document as any).startViewTransition(swap).finished
    } else {
      swap()
    }
  }

  private cacheCurrentPage(): void {
    const container = document.querySelector(this.options.container)
    if (container) {
      this.cache.set(this.currentUrl, {
        html: container.innerHTML,
        title: document.title,
        timestamp: Date.now(),
      })
    }
  }
}

// Auto-initialize if in browser
let router: STXRouter | null = null

export function initRouter(options?: RouterOptions): STXRouter {
  if (router) return router
  router = new STXRouter(options)
  router.init()
  return router
}

export function getRouter(): STXRouter | null {
  return router
}

// Export for manual use
export { STXRouter }

// Browser global
if (typeof window !== 'undefined') {
  (window as any).STXRouter = {
    init: initRouter,
    get: getRouter,
    Router: STXRouter,
  }
}
