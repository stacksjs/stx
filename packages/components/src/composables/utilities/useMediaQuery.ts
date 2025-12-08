/**
 * Hook for responsive media queries
 *
 * @example
 * ```ts
 * const { matches } = useMediaQuery('(min-width: 768px)')
 * const { matches: isDark } = useIsDarkMode()
 * const { matches: isMobile } = useIsMobile()
 * ```
 */

/**
 * Options for useMediaQuery hook
 */
export interface UseMediaQueryOptions {
  /** Default value when window.matchMedia is not available */
  defaultValue?: boolean
}

/**
 * Hook for responsive media queries
 *
 * @param query - Media query string
 * @param options - Configuration options
 * @returns Object with matches boolean and updateMatches function
 */
export function useMediaQuery(
  query: string,
  options: UseMediaQueryOptions = {},
): { matches: boolean, updateMatches: () => void } {
  const { defaultValue = false } = options

  let matches = defaultValue
  let mediaQueryList: MediaQueryList | null = null

  // Initialize
  if (typeof window !== 'undefined' && 'matchMedia' in window) {
    mediaQueryList = window.matchMedia(query)
    matches = mediaQueryList.matches

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      matches = event.matches
    }

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange)
    }
    else {
      // Fallback for older browsers
      mediaQueryList.addListener(handleChange)
    }
  }

  function updateMatches() {
    if (mediaQueryList) {
      matches = mediaQueryList.matches
    }
  }

  return { matches, updateMatches }
}

/**
 * Common responsive breakpoints
 */
export const Breakpoints = {
  'xs': '(min-width: 320px)',
  'sm': '(min-width: 640px)',
  'md': '(min-width: 768px)',
  'lg': '(min-width: 1024px)',
  'xl': '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  'mobile': '(max-width: 767px)',
  'tablet': '(min-width: 768px) and (max-width: 1023px)',
  'desktop': '(min-width: 1024px)',
  'dark': '(prefers-color-scheme: dark)',
  'light': '(prefers-color-scheme: light)',
  'reducedMotion': '(prefers-reduced-motion: reduce)',
  'portrait': '(orientation: portrait)',
  'landscape': '(orientation: landscape)',
} as const

/**
 * Use a predefined breakpoint
 * @param breakpoint - Breakpoint name from Breakpoints constant
 */
export function useBreakpoint(breakpoint: keyof typeof Breakpoints) {
  return useMediaQuery(Breakpoints[breakpoint])
}

/**
 * Check if viewport is mobile (max-width: 767px)
 */
export function useIsMobile() {
  return useMediaQuery(Breakpoints.mobile)
}

/**
 * Check if viewport is desktop (min-width: 1024px)
 */
export function useIsDesktop() {
  return useMediaQuery(Breakpoints.desktop)
}

/**
 * Check if user prefers dark color scheme
 */
export function useIsDarkMode() {
  return useMediaQuery(Breakpoints.dark)
}

/**
 * Check if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  return useMediaQuery(Breakpoints.reducedMotion)
}
