/**
 * useColorMode / useDark — Theme management composables
 *
 * Detect system preference, persist user choice, toggle dark/light mode,
 * and sync across tabs — all with auto-cleanup.
 */

// =============================================================================
// Types
// =============================================================================

export type ColorMode = 'light' | 'dark' | 'auto'

export interface ColorModeOptions {
  /** localStorage key (default: 'stx-color-mode') */
  storageKey?: string
  /** Initial mode (default: 'auto') */
  initialMode?: ColorMode
  /** CSS class applied to <html> when dark (default: 'dark') */
  darkClass?: string
  /** Use a data-attribute instead of a class (e.g. 'data-theme') */
  attribute?: string
  /** Disable CSS transitions during mode switch to prevent flash (default: true) */
  disableTransitions?: boolean
}

export interface ColorModeRef {
  /** Current resolved mode ('light' or 'dark') */
  readonly mode: 'light' | 'dark'
  /** User preference ('light', 'dark', or 'auto') */
  readonly preference: ColorMode
  /** Convenience: true when resolved mode is dark */
  readonly isDark: boolean
  /** Set mode explicitly */
  set: (mode: ColorMode) => void
  /** Toggle between light and dark (resets 'auto' to the opposite of current) */
  toggle: () => void
  /** Subscribe to mode changes */
  subscribe: (fn: (mode: 'light' | 'dark', preference: ColorMode) => void) => () => void
}

export interface DarkRef {
  /** Whether dark mode is active */
  readonly isDark: boolean
  /** Toggle dark mode */
  toggle: () => void
  /** Set dark mode explicitly */
  set: (dark: boolean) => void
  /** Subscribe to dark-mode changes */
  subscribe: (fn: (isDark: boolean) => void) => () => void
}

// =============================================================================
// useColorMode
// =============================================================================

/**
 * Full-featured color-mode manager.
 *
 * @example
 * ```ts
 * const { mode, isDark, toggle, set } = useColorMode()
 * toggle()           // switch light↔dark
 * set('auto')        // follow system preference
 * ```
 */
export function useColorMode(options: ColorModeOptions = {}): ColorModeRef {
  const {
    storageKey = 'stx-color-mode',
    initialMode = 'auto',
    darkClass = 'dark',
    attribute,
    disableTransitions = true,
  } = options

  let preference: ColorMode = initialMode
  let resolved: 'light' | 'dark' = 'light'
  const listeners: Set<(mode: 'light' | 'dark', preference: ColorMode) => void> = new Set()
  const cleanups: Array<() => void> = []

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const isBrowser = typeof window !== 'undefined'

  function getSystemPreference(): 'light' | 'dark' {
    if (!isBrowser) return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function resolve(pref: ColorMode): 'light' | 'dark' {
    return pref === 'auto' ? getSystemPreference() : pref
  }

  function applyToDOM(mode: 'light' | 'dark') {
    if (!isBrowser) return
    const el = document.documentElement

    // Optionally suppress CSS transitions during switch
    if (disableTransitions) {
      el.style.setProperty('transition', 'none', 'important')
    }

    if (attribute) {
      el.setAttribute(attribute, mode)
    }
    else {
      if (mode === 'dark') {
        el.classList.add(darkClass)
      }
      else {
        el.classList.remove(darkClass)
      }
    }

    if (disableTransitions) {
      // Force reflow then re-enable transitions
      // eslint-disable-next-line ts/no-unused-expressions
      el.offsetHeight
      el.style.removeProperty('transition')
    }
  }

  function persist(pref: ColorMode) {
    if (!isBrowser) return
    try { localStorage.setItem(storageKey, pref) }
    catch { /* quota / private mode */ }
  }

  function readPersisted(): ColorMode | null {
    if (!isBrowser) return null
    try {
      const v = localStorage.getItem(storageKey)
      if (v === 'light' || v === 'dark' || v === 'auto') return v
    }
    catch { /* private mode */ }
    return null
  }

  // ---------------------------------------------------------------------------
  // Core update
  // ---------------------------------------------------------------------------

  function update(pref: ColorMode) {
    preference = pref
    resolved = resolve(pref)
    applyToDOM(resolved)
    persist(pref)
    listeners.forEach(fn => fn(resolved, preference))
  }

  // ---------------------------------------------------------------------------
  // Initialise
  // ---------------------------------------------------------------------------

  const persisted = readPersisted()
  update(persisted ?? initialMode)

  // ---------------------------------------------------------------------------
  // System preference change listener
  // ---------------------------------------------------------------------------

  if (isBrowser) {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => {
      if (preference === 'auto') {
        resolved = getSystemPreference()
        applyToDOM(resolved)
        listeners.forEach(fn => fn(resolved, preference))
      }
    }
    mql.addEventListener('change', onSystemChange)
    cleanups.push(() => mql.removeEventListener('change', onSystemChange))

    // Cross-tab sync via storage event
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return
      const v = e.newValue as ColorMode | null
      if (v === 'light' || v === 'dark' || v === 'auto') {
        preference = v
        resolved = resolve(v)
        applyToDOM(resolved)
        listeners.forEach(fn => fn(resolved, preference))
      }
    }
    window.addEventListener('storage', onStorage)
    cleanups.push(() => window.removeEventListener('storage', onStorage))
  }

  // Auto-cleanup
  if (typeof (globalThis as any).onDestroy === 'function') {
    ;(globalThis as any).onDestroy(() => {
      cleanups.forEach(fn => fn())
      listeners.clear()
    })
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    get mode() { return resolved },
    get preference() { return preference },
    get isDark() { return resolved === 'dark' },
    set(mode: ColorMode) { update(mode) },
    toggle() {
      update(resolved === 'dark' ? 'light' : 'dark')
    },
    subscribe(fn) {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
  }
}

// =============================================================================
// useDark
// =============================================================================

/**
 * Convenience wrapper — just isDark, toggle, set.
 *
 * @example
 * ```ts
 * const { isDark, toggle } = useDark()
 * toggle()
 * ```
 */
export function useDark(options: ColorModeOptions = {}): DarkRef {
  const cm = useColorMode(options)

  return {
    get isDark() { return cm.isDark },
    toggle() { cm.toggle() },
    set(dark: boolean) { cm.set(dark ? 'dark' : 'light') },
    subscribe(fn) {
      return cm.subscribe(mode => fn(mode === 'dark'))
    },
  }
}
