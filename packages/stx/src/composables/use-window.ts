/**
 * useWindow - Reactive window properties composables
 *
 * Provides reactive tracking of window size, scroll position, visibility, etc.
 */

export interface WindowSize {
  width: number
  height: number
}

export interface ScrollPosition {
  x: number
  y: number
}

export interface WindowSizeRef extends WindowSize {
  subscribe: (callback: (size: WindowSize) => void) => () => void
}

export interface ScrollRef extends ScrollPosition {
  subscribe: (callback: (position: ScrollPosition) => void) => () => void
  scrollTo: (options: ScrollToOptions | number, y?: number) => void
  scrollToTop: () => void
  scrollToBottom: () => void
}

export interface VisibilityRef {
  isVisible: boolean
  subscribe: (callback: (visible: boolean) => void) => () => void
}

/**
 * Track window size reactively
 *
 * @example
 * ```ts
 * const size = useWindowSize()
 * console.log(size.width, size.height)
 *
 * size.subscribe(({ width, height }) => {
 *   console.log('Window resized:', width, height)
 * })
 * ```
 */
export function useWindowSize(): WindowSizeRef {
  const subscribers = new Set<(size: WindowSize) => void>()
  const isClient = typeof window !== 'undefined'

  let currentSize: WindowSize = {
    width: isClient ? window.innerWidth : 0,
    height: isClient ? window.innerHeight : 0,
  }

  if (isClient) {
    const handler = () => {
      currentSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      for (const callback of subscribers) {
        try {
          callback(currentSize)
        } catch (e) {
          console.error('[useWindowSize] Subscriber error:', e)
        }
      }
    }

    window.addEventListener('resize', handler, { passive: true })
  }

  return {
    get width() { return currentSize.width },
    get height() { return currentSize.height },
    subscribe: (callback) => {
      subscribers.add(callback)
      callback(currentSize)
      return () => subscribers.delete(callback)
    },
  }
}

/**
 * Track scroll position reactively
 *
 * @example
 * ```ts
 * const scroll = useScroll()
 * console.log(scroll.x, scroll.y)
 *
 * scroll.subscribe(({ y }) => {
 *   if (y > 100) showBackToTop()
 * })
 *
 * scroll.scrollToTop()
 * ```
 */
export function useScroll(): ScrollRef {
  const subscribers = new Set<(position: ScrollPosition) => void>()
  const isClient = typeof window !== 'undefined'

  let currentPosition: ScrollPosition = {
    x: isClient ? window.scrollX : 0,
    y: isClient ? window.scrollY : 0,
  }

  if (isClient) {
    const handler = () => {
      currentPosition = {
        x: window.scrollX,
        y: window.scrollY,
      }
      for (const callback of subscribers) {
        try {
          callback(currentPosition)
        } catch (e) {
          console.error('[useScroll] Subscriber error:', e)
        }
      }
    }

    window.addEventListener('scroll', handler, { passive: true })
  }

  return {
    get x() { return currentPosition.x },
    get y() { return currentPosition.y },
    subscribe: (callback) => {
      subscribers.add(callback)
      callback(currentPosition)
      return () => subscribers.delete(callback)
    },
    scrollTo: (options, y) => {
      if (!isClient) return
      if (typeof options === 'number') {
        window.scrollTo(options, y ?? 0)
      } else {
        window.scrollTo(options)
      }
    },
    scrollToTop: () => {
      if (!isClient) return
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    scrollToBottom: () => {
      if (!isClient) return
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    },
  }
}

/**
 * Track document visibility
 *
 * @example
 * ```ts
 * const visibility = useVisibility()
 *
 * visibility.subscribe((visible) => {
 *   if (!visible) pauseVideo()
 *   else resumeVideo()
 * })
 * ```
 */
export function useVisibility(): VisibilityRef {
  const subscribers = new Set<(visible: boolean) => void>()
  const isClient = typeof document !== 'undefined'

  let isVisible = isClient ? document.visibilityState === 'visible' : true

  if (isClient) {
    document.addEventListener('visibilitychange', () => {
      isVisible = document.visibilityState === 'visible'
      for (const callback of subscribers) {
        try {
          callback(isVisible)
        } catch (e) {
          console.error('[useVisibility] Subscriber error:', e)
        }
      }
    })
  }

  return {
    get isVisible() { return isVisible },
    subscribe: (callback) => {
      subscribers.add(callback)
      callback(isVisible)
      return () => subscribers.delete(callback)
    },
  }
}

/**
 * Reactive document title
 *
 * @example
 * ```ts
 * const title = useTitle('My App')
 * title.value = 'New Page - My App'
 * ```
 */
export function useTitle(initialTitle?: string): { value: string; set: (title: string) => void } {
  const isClient = typeof document !== 'undefined'

  if (initialTitle && isClient) {
    document.title = initialTitle
  }

  return {
    get value() {
      return isClient ? document.title : ''
    },
    set value(newTitle: string) {
      if (isClient) document.title = newTitle
    },
    set: (title: string) => {
      if (isClient) document.title = title
    },
  }
}

/**
 * Reactive favicon
 */
export function useFavicon(href?: string): { value: string; set: (href: string) => void } {
  const isClient = typeof document !== 'undefined'

  const getLinkElement = (): HTMLLinkElement | null => {
    if (!isClient) return null
    let link = document.querySelector<HTMLLinkElement>('link[rel*="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    return link
  }

  if (href) {
    const link = getLinkElement()
    if (link) link.href = href
  }

  return {
    get value() {
      const link = getLinkElement()
      return link?.href || ''
    },
    set value(newHref: string) {
      const link = getLinkElement()
      if (link) link.href = newHref
    },
    set: (newHref: string) => {
      const link = getLinkElement()
      if (link) link.href = newHref
    },
  }
}
