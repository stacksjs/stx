/**
 * STX Router - Browser Bundle
 *
 * Drop-in SPA router for STX applications.
 * Include this script and it auto-initializes.
 *
 * Usage:
 *   <script src="/stx-router.js"></script>
 *
 * Or with options:
 *   <script>
 *     window.STX_ROUTER_OPTIONS = { container: '#app', scrollToTop: false }
 *   </script>
 *   <script src="/stx-router.js"></script>
 *
 * Attributes:
 *   data-stx-no-router - Skip SPA navigation for a link
 *   data-stx-prefetch - Prefetch page on hover
 */

;(function() {
  'use strict'

  interface RouterOptions {
    container?: string
    linkSelector?: string
    loadingClass?: string
    viewTransitions?: boolean
    cache?: boolean
    scrollToTop?: boolean
    prefetch?: boolean
    onBeforeNavigate?: (url: string) => boolean | void
    onAfterNavigate?: (url: string) => void
    onError?: (error: Error, url: string) => void
  }

  interface CacheEntry {
    html: string
    title: string
    timestamp: number
  }

  const defaultOptions: Required<RouterOptions> = {
    container: 'main',
    linkSelector: 'a[href]',
    loadingClass: 'stx-navigating',
    viewTransitions: true,
    cache: true,
    scrollToTop: true,
    prefetch: true,
    onBeforeNavigate: () => true,
    onAfterNavigate: () => {},
    onError: (err) => console.error('[STX Router]', err),
  }

  class STXRouter {
    private options: Required<RouterOptions>
    private cache: Map<string, CacheEntry> = new Map()
    private prefetched: Set<string> = new Set()
    private isNavigating = false
    private currentUrl: string

    constructor(options: RouterOptions = {}) {
      const userOptions = (window as any).STX_ROUTER_OPTIONS || {}
      this.options = { ...defaultOptions, ...userOptions, ...options }
      this.currentUrl = window.location.href
    }

    init(): void {
      // Intercept link clicks
      document.addEventListener('click', this.handleClick.bind(this), true)

      // Handle browser back/forward
      window.addEventListener('popstate', this.handlePopState.bind(this))

      // Prefetch on hover
      if (this.options.prefetch) {
        document.addEventListener('mouseenter', this.handleHover.bind(this), true)
      }

      // Cache current page
      if (this.options.cache) {
        this.cacheCurrentPage()
      }

      // Add CSS for loading state
      this.injectStyles()

      console.log('[STX Router] Initialized')
    }

    async navigate(url: string, pushState = true): Promise<void> {
      if (this.isNavigating) return

      const targetUrl = new URL(url, window.location.origin)

      // Skip if same page (but allow hash changes)
      if (targetUrl.href === this.currentUrl && !targetUrl.hash) return

      // Skip if different origin
      if (targetUrl.origin !== window.location.origin) {
        window.location.href = url
        return
      }

      // Handle hash-only navigation
      if (targetUrl.pathname === new URL(this.currentUrl).pathname && targetUrl.hash) {
        if (pushState) {
          window.history.pushState({ url: targetUrl.href }, '', targetUrl.href)
        }
        const el = document.querySelector(targetUrl.hash)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
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

          if (this.options.scrollToTop && !targetUrl.hash) {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
          } else if (targetUrl.hash) {
            const el = document.querySelector(targetUrl.hash)
            if (el) el.scrollIntoView({ behavior: 'smooth' })
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

    async prefetch(url: string): Promise<void> {
      const targetUrl = new URL(url, window.location.origin)
      if (targetUrl.origin !== window.location.origin) return
      if (this.cache.has(targetUrl.href)) return
      if (this.prefetched.has(targetUrl.href)) return

      this.prefetched.add(targetUrl.href)

      try {
        await this.fetchPage(targetUrl.href)
      } catch {
        // Silently fail prefetch
      }
    }

    clearCache(): void {
      this.cache.clear()
      this.prefetched.clear()
    }

    private handleClick(event: MouseEvent): void {
      const link = (event.target as Element).closest(this.options.linkSelector) as HTMLAnchorElement
      if (!link) return

      // Skip if modifier keys pressed
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (event.button !== 0) return
      if (link.target && link.target !== '_self') return
      if (link.hasAttribute('download')) return

      const href = link.getAttribute('href')
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return
      if (link.hasAttribute('data-stx-no-router')) return

      const targetUrl = new URL(href, window.location.origin)
      if (targetUrl.origin !== window.location.origin) return

      event.preventDefault()
      event.stopPropagation()
      this.navigate(href)
    }

    private handleHover(event: MouseEvent): void {
      const link = (event.target as Element).closest('a[href]') as HTMLAnchorElement
      if (!link) return
      if (link.hasAttribute('data-stx-no-router')) return

      const href = link.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      // Only prefetch if has data-stx-prefetch or is an internal link
      if (link.hasAttribute('data-stx-prefetch')) {
        this.prefetch(href)
      }
    }

    private handlePopState(_event: PopStateEvent): void {
      this.navigate(window.location.href, false)
    }

    private async fetchPage(url: string): Promise<{ html: string; title: string } | null> {
      // Check cache
      if (this.options.cache && this.cache.has(url)) {
        const cached = this.cache.get(url)!
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
        throw new Error(`Container "${this.options.container}" not found`)
      }

      const result = {
        html: container.innerHTML,
        title: doc.title,
      }

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

        // Re-execute inline scripts
        const scripts = container.querySelectorAll('script')
        scripts.forEach((oldScript) => {
          const newScript = document.createElement('script')
          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value)
          })
          newScript.textContent = oldScript.textContent
          oldScript.parentNode?.replaceChild(newScript, oldScript)
        })

        // Dispatch navigation event
        window.dispatchEvent(new CustomEvent('stx:navigate', {
          detail: { url: this.currentUrl }
        }))

        // Trigger DOMContentLoaded-like event for components
        window.dispatchEvent(new CustomEvent('stx:load'))
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

    private injectStyles(): void {
      if (document.getElementById('stx-router-styles')) return

      const style = document.createElement('style')
      style.id = 'stx-router-styles'
      style.textContent = `
        .stx-navigating {
          cursor: wait;
        }
        .stx-navigating * {
          pointer-events: none;
        }
        @keyframes stx-loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .stx-navigating::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #78dce8, transparent);
          animation: stx-loading-bar 1s ease-in-out infinite;
          z-index: 99999;
        }
      `
      document.head.appendChild(style)
    }
  }

  // Initialize on DOM ready
  function init() {
    const router = new STXRouter()
    router.init()
    ;(window as any).stxRouter = router
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
