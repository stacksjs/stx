/**
 * useMediaQuery - Reactive media query composable
 *
 * Provides reactive tracking of CSS media queries.
 */

export interface MediaQueryRef {
  /** Whether the media query matches */
  matches: boolean
  /** Subscribe to changes */
  subscribe: (callback: (matches: boolean) => void) => () => void
}

/**
 * Create a reactive media query
 *
 * @example
 * ```ts
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)')
 * const isMobile = useMediaQuery('(max-width: 768px)')
 *
 * isDark.subscribe((matches) => {
 *   console.log('Dark mode:', matches)
 * })
 * ```
 */
export function useMediaQuery(query: string): MediaQueryRef {
  const subscribers = new Set<(matches: boolean) => void>()

  const mediaQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query)
    : null

  const handler = (event: MediaQueryListEvent) => {
    for (const callback of subscribers) {
      try {
        callback(event.matches)
      }
      catch (e) {
        console.error('[useMediaQuery] Subscriber error:', e)
      }
    }
  }

  return {
    get matches() { return mediaQuery?.matches ?? false },
    subscribe: (callback) => {
      if (!subscribers.size) {
        if (mediaQuery?.addEventListener) mediaQuery.addEventListener('change', handler)
        else mediaQuery?.addListener(handler)
      }
      subscribers.add(callback)
      callback(mediaQuery?.matches ?? false)
      return () => {
        if (!subscribers.delete(callback) || subscribers.size) return
        if (mediaQuery?.removeEventListener) mediaQuery.removeEventListener('change', handler)
        else mediaQuery?.removeListener(handler)
      }
    },
  }
}

/**
 * Reactive dark mode preference
 */
export function usePreferredDark(): MediaQueryRef {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

/**
 * Reactive light mode preference
 */
export function usePreferredLight(): MediaQueryRef {
  return useMediaQuery('(prefers-color-scheme: light)')
}

/**
 * Reactive reduced motion preference
 */
export function usePreferredReducedMotion(): MediaQueryRef {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/**
 * Reactive contrast preference
 */
export function usePreferredContrast(): MediaQueryRef {
  return useMediaQuery('(prefers-contrast: more)')
}

/**
 * Common breakpoints
 */
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const

/**
 * Reactive breakpoint helpers
 */
export function useBreakpoint(breakpoint: keyof typeof breakpoints): MediaQueryRef {
  return useMediaQuery(breakpoints[breakpoint])
}

export function useIsMobile(): MediaQueryRef {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsTablet(): MediaQueryRef {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

export function useIsDesktop(): MediaQueryRef {
  return useMediaQuery('(min-width: 1024px)')
}
