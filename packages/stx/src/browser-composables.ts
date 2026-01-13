/**
 * STX Browser Composables
 *
 * Reusable composable functions for browser APIs.
 * All composables follow the `use*` naming convention.
 *
 * @module browser-composables
 */

import { onDestroy, onMount } from './composables'

// =============================================================================
// Types
// =============================================================================

type MaybeRef<T> = T | { value: T }

function unref<T>(value: MaybeRef<T>): T {
  return typeof value === 'object' && value !== null && 'value' in value
    ? (value as { value: T }).value
    : value
}

// =============================================================================
// Storage Composables
// =============================================================================

/**
 * Reactive localStorage with automatic serialization.
 *
 * @example
 * ```typescript
 * const theme = useLocalStorage('theme', 'dark')
 * console.log(theme.value) // 'dark'
 * theme.value = 'light' // automatically saved
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): { value: T; remove: () => void } {
  const storage = typeof window !== 'undefined' ? window.localStorage : null

  function read(): T {
    if (!storage) return defaultValue
    try {
      const item = storage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    }
    catch {
      return defaultValue
    }
  }

  function write(value: T): void {
    if (!storage) return
    try {
      storage.setItem(key, JSON.stringify(value))
    }
    catch (e) {
      console.warn(`[useLocalStorage] Failed to save "${key}":`, e)
    }
  }

  let currentValue = read()

  return {
    get value(): T {
      return currentValue
    },
    set value(newValue: T) {
      currentValue = newValue
      write(newValue)
    },
    remove(): void {
      storage?.removeItem(key)
      currentValue = defaultValue
    }
  }
}

/**
 * Reactive sessionStorage with automatic serialization.
 *
 * @example
 * ```typescript
 * const token = useSessionStorage('auth_token', null)
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  defaultValue: T
): { value: T; remove: () => void } {
  const storage = typeof window !== 'undefined' ? window.sessionStorage : null

  function read(): T {
    if (!storage) return defaultValue
    try {
      const item = storage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    }
    catch {
      return defaultValue
    }
  }

  function write(value: T): void {
    if (!storage) return
    try {
      storage.setItem(key, JSON.stringify(value))
    }
    catch (e) {
      console.warn(`[useSessionStorage] Failed to save "${key}":`, e)
    }
  }

  let currentValue = read()

  return {
    get value(): T {
      return currentValue
    },
    set value(newValue: T) {
      currentValue = newValue
      write(newValue)
    },
    remove(): void {
      storage?.removeItem(key)
      currentValue = defaultValue
    }
  }
}

// =============================================================================
// Event Composables
// =============================================================================

/**
 * Add an event listener with automatic cleanup.
 *
 * @example
 * ```typescript
 * useEventListener('resize', () => console.log('resized'))
 * useEventListener(buttonRef, 'click', () => console.log('clicked'))
 * ```
 */
export function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (e: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
): () => void

export function useEventListener<K extends keyof DocumentEventMap>(
  target: Document,
  event: K,
  handler: (e: DocumentEventMap[K]) => void,
  options?: AddEventListenerOptions
): () => void

export function useEventListener<K extends keyof HTMLElementEventMap>(
  target: MaybeRef<HTMLElement | null>,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions
): () => void

export function useEventListener(
  ...args: any[]
): () => void {
  let target: EventTarget | null
  let event: string
  let handler: EventListener
  let options: AddEventListenerOptions | undefined

  if (typeof args[0] === 'string') {
    target = typeof window !== 'undefined' ? window : null
    event = args[0]
    handler = args[1]
    options = args[2]
  }
  else {
    target = unref(args[0]) as EventTarget | null
    event = args[1]
    handler = args[2]
    options = args[3]
  }

  const cleanup = () => {
    target?.removeEventListener(event, handler, options)
  }

  if (target) {
    target.addEventListener(event, handler, options)
    onDestroy(cleanup)
  }

  return cleanup
}

/**
 * Detect clicks outside an element.
 *
 * @example
 * ```typescript
 * const dropdownRef = ref<HTMLElement>()
 * useClickOutside(dropdownRef, () => {
 *   isOpen.value = false
 * })
 * ```
 */
export function useClickOutside(
  target: MaybeRef<HTMLElement | null>,
  handler: (event: MouseEvent) => void
): () => void {
  const listener = (event: MouseEvent) => {
    const el = unref(target)
    if (!el || el.contains(event.target as Node)) return
    handler(event)
  }

  return useEventListener(document as any, 'click' as any, listener as any)
}

// =============================================================================
// Window Composables
// =============================================================================

/**
 * Reactive window size.
 *
 * @example
 * ```typescript
 * const { width, height } = useWindowSize()
 * console.log(`${width.value}x${height.value}`)
 * ```
 */
export function useWindowSize(): {
  width: { readonly value: number }
  height: { readonly value: number }
} {
  let w = typeof window !== 'undefined' ? window.innerWidth : 0
  let h = typeof window !== 'undefined' ? window.innerHeight : 0

  if (typeof window !== 'undefined') {
    useEventListener('resize', () => {
      w = window.innerWidth
      h = window.innerHeight
    })
  }

  return {
    width: { get value() { return w } },
    height: { get value() { return h } }
  }
}

/**
 * Reactive media query.
 *
 * @example
 * ```typescript
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
 * ```
 */
export function useMediaQuery(query: string): { readonly value: boolean } {
  if (typeof window === 'undefined') {
    return { value: false }
  }

  const mediaQuery = window.matchMedia(query)
  let matches = mediaQuery.matches

  const handler = (e: MediaQueryListEvent) => {
    matches = e.matches
  }

  mediaQuery.addEventListener('change', handler)
  onDestroy(() => mediaQuery.removeEventListener('change', handler))

  return {
    get value() { return matches }
  }
}

/**
 * Common breakpoint helpers.
 *
 * @example
 * ```typescript
 * const { isMobile, isTablet, isDesktop } = useBreakpoints()
 * ```
 */
export function useBreakpoints() {
  return {
    isMobile: useMediaQuery('(max-width: 639px)'),
    isTablet: useMediaQuery('(min-width: 640px) and (max-width: 1023px)'),
    isDesktop: useMediaQuery('(min-width: 1024px)'),
    isLargeDesktop: useMediaQuery('(min-width: 1280px)')
  }
}

/**
 * Detect dark mode preference.
 *
 * @example
 * ```typescript
 * const isDark = usePrefersDark()
 * ```
 */
export function usePrefersDark(): { readonly value: boolean } {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

/**
 * Reactive online/offline status.
 *
 * @example
 * ```typescript
 * const isOnline = useOnline()
 * if (!isOnline.value) showOfflineWarning()
 * ```
 */
export function useOnline(): { readonly value: boolean } {
  let online = typeof navigator !== 'undefined' ? navigator.onLine : true

  if (typeof window !== 'undefined') {
    useEventListener('online', () => { online = true })
    useEventListener('offline', () => { online = false })
  }

  return {
    get value() { return online }
  }
}

/**
 * Reactive mouse position.
 *
 * @example
 * ```typescript
 * const { x, y } = useMouse()
 * ```
 */
export function useMouse(): {
  x: { readonly value: number }
  y: { readonly value: number }
} {
  let x = 0
  let y = 0

  if (typeof window !== 'undefined') {
    useEventListener('mousemove', (e) => {
      x = e.clientX
      y = e.clientY
    })
  }

  return {
    x: { get value() { return x } },
    y: { get value() { return y } }
  }
}

/**
 * Reactive scroll position.
 *
 * @example
 * ```typescript
 * const { x, y } = useScroll()
 * // Or for a specific element
 * const { x, y } = useScroll(containerRef)
 * ```
 */
export function useScroll(target?: MaybeRef<HTMLElement | null>): {
  x: { readonly value: number }
  y: { readonly value: number }
  isScrolling: { readonly value: boolean }
} {
  let x = 0
  let y = 0
  let isScrolling = false
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null

  const el = target ? unref(target) : (typeof window !== 'undefined' ? window : null)

  if (el) {
    const handler = () => {
      if (el === window) {
        x = window.scrollX
        y = window.scrollY
      }
      else if (el instanceof HTMLElement) {
        x = el.scrollLeft
        y = el.scrollTop
      }

      isScrolling = true
      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        isScrolling = false
      }, 150)
    }

    if (el === window) {
      useEventListener('scroll', handler)
    }
    else {
      (el as HTMLElement).addEventListener('scroll', handler)
      onDestroy(() => (el as HTMLElement).removeEventListener('scroll', handler))
    }
  }

  return {
    x: { get value() { return x } },
    y: { get value() { return y } },
    isScrolling: { get value() { return isScrolling } }
  }
}

// =============================================================================
// Timing Composables
// =============================================================================

/**
 * Debounce a function.
 *
 * @example
 * ```typescript
 * const debouncedSearch = useDebounce((query: string) => {
 *   fetchResults(query)
 * }, 300)
 * ```
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }

  onDestroy(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })

  return debouncedFn
}

/**
 * Debounce a value.
 *
 * @example
 * ```typescript
 * const searchQuery = ref('')
 * const debouncedQuery = useDebouncedValue(() => searchQuery.value, 300)
 * ```
 */
export function useDebouncedValue<T>(
  getter: () => T,
  delay: number
): { readonly value: T } {
  let currentValue = getter()
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const update = () => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      currentValue = getter()
    }, delay)
  }

  // Poll for changes
  const intervalId = setInterval(update, 16)
  onDestroy(() => {
    clearInterval(intervalId)
    if (timeoutId) clearTimeout(timeoutId)
  })

  return {
    get value() { return currentValue }
  }
}

/**
 * Throttle a function.
 *
 * @example
 * ```typescript
 * const throttledScroll = useThrottle(() => {
 *   updateHeader()
 * }, 100)
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const throttledFn = (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= limit) {
      lastCall = now
      fn(...args)
    }
    else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        fn(...args)
      }, limit - (now - lastCall))
    }
  }

  onDestroy(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })

  return throttledFn
}

/**
 * Reactive interval.
 *
 * @example
 * ```typescript
 * const { counter, pause, resume, reset } = useInterval(1000)
 * ```
 */
export function useInterval(
  interval: number,
  options: { immediate?: boolean } = {}
): {
  counter: { readonly value: number }
  pause: () => void
  resume: () => void
  reset: () => void
} {
  let count = 0
  let isActive = options.immediate !== false
  let intervalId: ReturnType<typeof setInterval> | null = null

  const start = () => {
    if (intervalId) return
    intervalId = setInterval(() => {
      if (isActive) count++
    }, interval)
  }

  const pause = () => {
    isActive = false
  }

  const resume = () => {
    isActive = true
  }

  const reset = () => {
    count = 0
  }

  if (typeof window !== 'undefined') {
    start()
    onDestroy(() => {
      if (intervalId) clearInterval(intervalId)
    })
  }

  return {
    counter: { get value() { return count } },
    pause,
    resume,
    reset
  }
}

/**
 * One-time timeout with controls.
 *
 * @example
 * ```typescript
 * const { isPending, start, stop } = useTimeout(() => {
 *   showNotification()
 * }, 5000)
 * ```
 */
export function useTimeout(
  callback: () => void,
  delay: number
): {
  isPending: { readonly value: boolean }
  start: () => void
  stop: () => void
} {
  let isPending = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const start = () => {
    stop()
    isPending = true
    timeoutId = setTimeout(() => {
      isPending = false
      callback()
    }, delay)
  }

  const stop = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    isPending = false
  }

  onDestroy(stop)

  return {
    isPending: { get value() { return isPending } },
    start,
    stop
  }
}

// =============================================================================
// Utility Composables
// =============================================================================

/**
 * Boolean toggle.
 *
 * @example
 * ```typescript
 * const [isOpen, toggle, setOpen] = useToggle(false)
 * toggle() // true
 * setOpen(false) // false
 * ```
 */
export function useToggle(
  initial = false
): [{ value: boolean }, () => void, (value: boolean) => void] {
  let state = initial

  const toggle = () => {
    state = !state
  }

  const set = (value: boolean) => {
    state = value
  }

  return [
    {
      get value() { return state },
      set value(v: boolean) { state = v }
    },
    toggle,
    set
  ]
}

/**
 * Counter with controls.
 *
 * @example
 * ```typescript
 * const { count, inc, dec, set, reset } = useCounter(0)
 * inc() // 1
 * inc(5) // 6
 * dec() // 5
 * ```
 */
export function useCounter(
  initial = 0,
  options: { min?: number; max?: number } = {}
): {
  count: { value: number }
  inc: (delta?: number) => void
  dec: (delta?: number) => void
  set: (value: number) => void
  reset: () => void
} {
  let count = initial

  const clamp = (value: number): number => {
    if (options.min !== undefined && value < options.min) return options.min
    if (options.max !== undefined && value > options.max) return options.max
    return value
  }

  return {
    count: {
      get value() { return count },
      set value(v: number) { count = clamp(v) }
    },
    inc: (delta = 1) => { count = clamp(count + delta) },
    dec: (delta = 1) => { count = clamp(count - delta) },
    set: (value: number) => { count = clamp(value) },
    reset: () => { count = initial }
  }
}

/**
 * Clipboard access.
 *
 * @example
 * ```typescript
 * const { copy, copied, text } = useClipboard()
 * await copy('Hello!')
 * if (copied.value) showToast('Copied!')
 * ```
 */
export function useClipboard(): {
  text: { readonly value: string }
  copied: { readonly value: boolean }
  copy: (text: string) => Promise<void>
  read: () => Promise<string>
} {
  let text = ''
  let copied = false
  let copiedTimeout: ReturnType<typeof setTimeout> | null = null

  const copy = async (value: string): Promise<void> => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      console.warn('[useClipboard] Clipboard API not available')
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      text = value
      copied = true

      if (copiedTimeout) clearTimeout(copiedTimeout)
      copiedTimeout = setTimeout(() => {
        copied = false
      }, 1500)
    }
    catch (e) {
      console.error('[useClipboard] Failed to copy:', e)
    }
  }

  const read = async (): Promise<string> => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return ''
    }

    try {
      text = await navigator.clipboard.readText()
      return text
    }
    catch {
      return ''
    }
  }

  onDestroy(() => {
    if (copiedTimeout) clearTimeout(copiedTimeout)
  })

  return {
    text: { get value() { return text } },
    copied: { get value() { return copied } },
    copy,
    read
  }
}

/**
 * Document title.
 *
 * @example
 * ```typescript
 * const title = useTitle('My App')
 * title.value = 'New Page - My App'
 * ```
 */
export function useTitle(initial?: string): { value: string } {
  let title = typeof document !== 'undefined'
    ? document.title
    : (initial || '')

  if (initial && typeof document !== 'undefined') {
    document.title = initial
  }

  return {
    get value() { return title },
    set value(newTitle: string) {
      title = newTitle
      if (typeof document !== 'undefined') {
        document.title = newTitle
      }
    }
  }
}

/**
 * Element visibility with IntersectionObserver.
 *
 * @example
 * ```typescript
 * const target = ref<HTMLElement>()
 * const { isVisible } = useIntersectionObserver(target)
 * ```
 */
export function useIntersectionObserver(
  target: MaybeRef<HTMLElement | null>,
  options: IntersectionObserverInit = {}
): {
  isVisible: { readonly value: boolean }
  stop: () => void
} {
  let isVisible = false
  let observer: IntersectionObserver | null = null

  const stop = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onMount(() => {
    const el = unref(target)
    if (!el || typeof IntersectionObserver === 'undefined') return

    observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    }, options)

    observer.observe(el)
  })

  onDestroy(stop)

  return {
    isVisible: { get value() { return isVisible } },
    stop
  }
}

/**
 * Focus state of an element.
 *
 * @example
 * ```typescript
 * const inputRef = ref<HTMLInputElement>()
 * const { isFocused } = useFocus(inputRef)
 * ```
 */
export function useFocus(
  target: MaybeRef<HTMLElement | null>
): {
  isFocused: { readonly value: boolean }
  focus: () => void
  blur: () => void
} {
  let isFocused = false

  onMount(() => {
    const el = unref(target)
    if (!el) return

    const onFocus = () => { isFocused = true }
    const onBlur = () => { isFocused = false }

    el.addEventListener('focus', onFocus)
    el.addEventListener('blur', onBlur)

    onDestroy(() => {
      el.removeEventListener('focus', onFocus)
      el.removeEventListener('blur', onBlur)
    })
  })

  return {
    isFocused: { get value() { return isFocused } },
    focus: () => unref(target)?.focus(),
    blur: () => unref(target)?.blur()
  }
}

// =============================================================================
// Async Composables
// =============================================================================

interface UseFetchOptions<T> {
  immediate?: boolean
  initialData?: T
  refetch?: boolean
}

interface UseFetchReturn<T> {
  data: { readonly value: T | null }
  error: { readonly value: Error | null }
  isLoading: { readonly value: boolean }
  execute: () => Promise<void>
  abort: () => void
}

/**
 * Fetch data with reactive state.
 *
 * @example
 * ```typescript
 * const { data, error, isLoading } = useFetch('/api/users')
 *
 * // With options
 * const { data, execute } = useFetch('/api/user', {
 *   immediate: false
 * })
 * await execute()
 * ```
 */
export function useFetch<T = unknown>(
  url: string | (() => string),
  options: UseFetchOptions<T> & RequestInit = {}
): UseFetchReturn<T> {
  const { immediate = true, initialData = null, refetch: _refetch, ...fetchOptions } = options

  let data: T | null = initialData
  let error: Error | null = null
  let isLoading = false
  let abortController: AbortController | null = null

  const execute = async (): Promise<void> => {
    const resolvedUrl = typeof url === 'function' ? url() : url

    abortController?.abort()
    abortController = new AbortController()

    isLoading = true
    error = null

    try {
      const response = await fetch(resolvedUrl, {
        ...fetchOptions,
        signal: abortController.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      data = await response.json()
    }
    catch (e) {
      if ((e as Error).name !== 'AbortError') {
        error = e as Error
      }
    }
    finally {
      isLoading = false
    }
  }

  const abort = () => {
    abortController?.abort()
  }

  if (immediate && typeof window !== 'undefined') {
    execute()
  }

  onDestroy(abort)

  return {
    data: { get value() { return data } },
    error: { get value() { return error } },
    isLoading: { get value() { return isLoading } },
    execute,
    abort
  }
}

/**
 * Async state management.
 *
 * @example
 * ```typescript
 * const { state, isLoading, error, execute } = useAsync(async () => {
 *   const res = await fetch('/api/data')
 *   return res.json()
 * })
 * ```
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  options: { immediate?: boolean } = {}
): {
  state: { readonly value: T | null }
  isLoading: { readonly value: boolean }
  error: { readonly value: Error | null }
  execute: () => Promise<T | null>
} {
  let state: T | null = null
  let isLoading = false
  let error: Error | null = null

  const execute = async (): Promise<T | null> => {
    isLoading = true
    error = null

    try {
      state = await fn()
      return state
    }
    catch (e) {
      error = e as Error
      return null
    }
    finally {
      isLoading = false
    }
  }

  if (options.immediate !== false && typeof window !== 'undefined') {
    execute()
  }

  return {
    state: { get value() { return state } },
    isLoading: { get value() { return isLoading } },
    error: { get value() { return error } },
    execute
  }
}
