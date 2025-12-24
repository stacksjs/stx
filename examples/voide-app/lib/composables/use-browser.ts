/**
 * Browser composables - clipboard, media queries, network, window
 */

// ============================================================================
// Clipboard
// ============================================================================

export interface ClipboardRef {
  text: string
  isSupported: boolean
  copied: boolean
  copy: (text: string) => Promise<boolean>
  read: () => Promise<string>
}

export function useClipboard(options: { timeout?: number } = {}): ClipboardRef {
  const { timeout = 1500 } = options
  let currentText = ''
  let copied = false
  let copiedTimeout: ReturnType<typeof setTimeout> | null = null
  const isSupported = typeof navigator !== 'undefined' && 'clipboard' in navigator

  const copy = async (text: string): Promise<boolean> => {
    try {
      if (isSupported) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.cssText = 'position:fixed;opacity:0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      currentText = text
      copied = true
      if (copiedTimeout) clearTimeout(copiedTimeout)
      copiedTimeout = setTimeout(() => { copied = false }, timeout)
      return true
    } catch { return false }
  }

  const read = async (): Promise<string> => {
    if (!isSupported) return ''
    try { return await navigator.clipboard.readText() } catch { return '' }
  }

  return {
    get text() { return currentText },
    get isSupported() { return isSupported },
    get copied() { return copied },
    copy,
    read,
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  return useClipboard().copy(text)
}

// ============================================================================
// Media Queries
// ============================================================================

export interface MediaQueryRef {
  matches: boolean
  subscribe: (callback: (matches: boolean) => void) => () => void
}

export function useMediaQuery(query: string): MediaQueryRef {
  const subscribers = new Set<(matches: boolean) => void>()
  const isClient = typeof window !== 'undefined'
  let currentMatches = false

  if (isClient) {
    const mediaQuery = window.matchMedia(query)
    currentMatches = mediaQuery.matches
    const handler = (event: MediaQueryListEvent) => {
      currentMatches = event.matches
      for (const cb of subscribers) { try { cb(event.matches) } catch {} }
    }
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handler)
    else mediaQuery.addListener(handler)
  }

  return {
    get matches() { return currentMatches },
    subscribe: (callback) => {
      subscribers.add(callback)
      callback(currentMatches)
      return () => subscribers.delete(callback)
    },
  }
}

export function usePreferredDark(): MediaQueryRef {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

export function usePreferredReducedMotion(): MediaQueryRef {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function useIsMobile(): MediaQueryRef {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsDesktop(): MediaQueryRef {
  return useMediaQuery('(min-width: 1024px)')
}

// ============================================================================
// Network
// ============================================================================

export interface NetworkState {
  isOnline: boolean
  isOffline: boolean
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | null
  downlink: number | null
  saveData: boolean
}

export interface NetworkRef extends NetworkState {
  subscribe: (callback: (state: NetworkState) => void) => () => void
}

export function useNetwork(): NetworkRef {
  const subscribers = new Set<(state: NetworkState) => void>()
  const isClient = typeof window !== 'undefined'

  const getConnection = () => isClient ? (navigator as any).connection : null

  const getState = (): NetworkState => {
    if (!isClient) return { isOnline: true, isOffline: false, effectiveType: null, downlink: null, saveData: false }
    const conn = getConnection()
    return {
      isOnline: navigator.onLine,
      isOffline: !navigator.onLine,
      effectiveType: conn?.effectiveType || null,
      downlink: conn?.downlink || null,
      saveData: conn?.saveData || false,
    }
  }

  let currentState = getState()

  const notify = () => {
    currentState = getState()
    for (const cb of subscribers) { try { cb(currentState) } catch {} }
  }

  if (isClient) {
    window.addEventListener('online', notify)
    window.addEventListener('offline', notify)
    getConnection()?.addEventListener('change', notify)
  }

  return {
    get isOnline() { return currentState.isOnline },
    get isOffline() { return currentState.isOffline },
    get effectiveType() { return currentState.effectiveType },
    get downlink() { return currentState.downlink },
    get saveData() { return currentState.saveData },
    subscribe: (callback) => {
      subscribers.add(callback)
      callback(currentState)
      return () => subscribers.delete(callback)
    },
  }
}

export function useOnline() {
  const network = useNetwork()
  return {
    get isOnline() { return network.isOnline },
    subscribe: (cb: (online: boolean) => void) => network.subscribe((s) => cb(s.isOnline)),
  }
}

// ============================================================================
// Window
// ============================================================================

export function useWindowSize() {
  const subscribers = new Set<(size: { width: number; height: number }) => void>()
  const isClient = typeof window !== 'undefined'
  let current = { width: isClient ? window.innerWidth : 0, height: isClient ? window.innerHeight : 0 }

  if (isClient) {
    window.addEventListener('resize', () => {
      current = { width: window.innerWidth, height: window.innerHeight }
      for (const cb of subscribers) { try { cb(current) } catch {} }
    }, { passive: true })
  }

  return {
    get width() { return current.width },
    get height() { return current.height },
    subscribe: (callback: (size: { width: number; height: number }) => void) => {
      subscribers.add(callback)
      callback(current)
      return () => subscribers.delete(callback)
    },
  }
}

export function useScroll() {
  const subscribers = new Set<(pos: { x: number; y: number }) => void>()
  const isClient = typeof window !== 'undefined'
  let current = { x: isClient ? window.scrollX : 0, y: isClient ? window.scrollY : 0 }

  if (isClient) {
    window.addEventListener('scroll', () => {
      current = { x: window.scrollX, y: window.scrollY }
      for (const cb of subscribers) { try { cb(current) } catch {} }
    }, { passive: true })
  }

  return {
    get x() { return current.x },
    get y() { return current.y },
    subscribe: (callback: (pos: { x: number; y: number }) => void) => {
      subscribers.add(callback)
      callback(current)
      return () => subscribers.delete(callback)
    },
    scrollTo: (x: number, y: number) => isClient && window.scrollTo(x, y),
    scrollToTop: () => isClient && window.scrollTo({ top: 0, behavior: 'smooth' }),
    scrollToBottom: () => isClient && window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
  }
}

export function useVisibility() {
  const subscribers = new Set<(visible: boolean) => void>()
  const isClient = typeof document !== 'undefined'
  let isVisible = isClient ? document.visibilityState === 'visible' : true

  if (isClient) {
    document.addEventListener('visibilitychange', () => {
      isVisible = document.visibilityState === 'visible'
      for (const cb of subscribers) { try { cb(isVisible) } catch {} }
    })
  }

  return {
    get isVisible() { return isVisible },
    subscribe: (callback: (visible: boolean) => void) => {
      subscribers.add(callback)
      callback(isVisible)
      return () => subscribers.delete(callback)
    },
  }
}

export function useTitle(initialTitle?: string) {
  const isClient = typeof document !== 'undefined'
  if (initialTitle && isClient) document.title = initialTitle
  return {
    get value() { return isClient ? document.title : '' },
    set value(title: string) { if (isClient) document.title = title },
    set: (title: string) => { if (isClient) document.title = title },
  }
}

export function useFavicon(href?: string) {
  const isClient = typeof document !== 'undefined'
  const getLink = () => {
    if (!isClient) return null
    let link = document.querySelector<HTMLLinkElement>('link[rel*="icon"]')
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
    return link
  }
  if (href) { const link = getLink(); if (link) link.href = href }
  return {
    get value() { return getLink()?.href || '' },
    set value(newHref: string) { const link = getLink(); if (link) link.href = newHref },
    set: (newHref: string) => { const link = getLink(); if (link) link.href = newHref },
  }
}
