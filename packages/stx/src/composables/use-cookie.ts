/**
 * useCookie - Reactive cookie composable
 *
 * Similar to Nuxt's useCookie but for STX applications.
 * Provides a reactive, type-safe wrapper around document.cookie.
 */

export interface CookieOptions {
  /** Max age in seconds */
  maxAge?: number
  /** Expiration date */
  expires?: Date | number | string
  /** Cookie path */
  path?: string
  /** Cookie domain */
  domain?: string
  /** Secure flag (HTTPS only) */
  secure?: boolean
  /** HttpOnly flag (not accessible via JavaScript - only works server-side) */
  httpOnly?: boolean
  /** SameSite attribute */
  sameSite?: 'strict' | 'lax' | 'none'
  /** Default value if cookie doesn't exist */
  default?: unknown
  /** Custom encoder/decoder */
  encode?: (value: string) => string
  decode?: (value: string) => string
}

export interface CookieRef<T> {
  /** Current value */
  value: T | null
  /** Get the current value */
  get: () => T | null
  /** Set a new value */
  set: (value: T, options?: CookieOptions) => void
  /** Remove the cookie */
  remove: () => void
  /** Subscribe to changes (via polling) */
  subscribe: (callback: (value: T | null, prev: T | null) => void) => () => void
}

const defaultEncode = encodeURIComponent
const defaultDecode = decodeURIComponent

/**
 * Parse all cookies from document.cookie
 */
export function parseCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {}

  const cookies: Record<string, string> = {}
  const pairs = document.cookie.split(';')

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.trim().split('=')
    if (key) {
      try {
        cookies[key] = defaultDecode(valueParts.join('='))
      } catch {
        cookies[key] = valueParts.join('=')
      }
    }
  }

  return cookies
}

/**
 * Get a specific cookie value
 */
export function getCookie(name: string): string | null {
  const cookies = parseCookies()
  return cookies[name] ?? null
}

/**
 * Set a cookie
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return

  const {
    maxAge,
    expires,
    path = '/',
    domain,
    secure,
    sameSite = 'lax',
    encode = defaultEncode,
  } = options

  let cookieString = `${encode(name)}=${encode(value)}`

  if (maxAge !== undefined) {
    cookieString += `; max-age=${maxAge}`
  }

  if (expires !== undefined) {
    const expiresDate = expires instanceof Date
      ? expires
      : typeof expires === 'number'
        ? new Date(Date.now() + expires * 1000)
        : new Date(expires)
    cookieString += `; expires=${expiresDate.toUTCString()}`
  }

  if (path) {
    cookieString += `; path=${path}`
  }

  if (domain) {
    cookieString += `; domain=${domain}`
  }

  if (secure) {
    cookieString += '; secure'
  }

  if (sameSite) {
    cookieString += `; samesite=${sameSite}`
  }

  document.cookie = cookieString
}

/**
 * Remove a cookie
 */
export function removeCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  setCookie(name, '', {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  })
}

/**
 * Create a reactive cookie reference
 *
 * @example
 * ```ts
 * // Simple usage
 * const token = useCookie<string>('auth_token')
 * token.value = 'abc123' // Automatically persists
 *
 * // With options
 * const session = useCookie<SessionData>('session', {
 *   maxAge: 60 * 60 * 24 * 7, // 7 days
 *   secure: true,
 *   sameSite: 'strict'
 * })
 *
 * // Subscribe to changes
 * token.subscribe((newValue) => console.log('Token changed:', newValue))
 * ```
 */
export function useCookie<T = string>(
  name: string,
  options: CookieOptions = {}
): CookieRef<T> {
  const {
    default: defaultValue = null,
    decode = defaultDecode,
  } = options

  const subscribers = new Set<(value: T | null, prev: T | null) => void>()
  let pollInterval: ReturnType<typeof setInterval> | null = null

  const read = (): T | null => {
    if (typeof document === 'undefined') return defaultValue as T | null

    const raw = getCookie(name)
    if (raw === null) return defaultValue as T | null

    try {
      // Try to parse as JSON first
      return JSON.parse(decode(raw)) as T
    } catch {
      // Return as string if not valid JSON
      return decode(raw) as unknown as T
    }
  }

  const write = (value: T | null): void => {
    if (value === null || value === undefined) {
      removeCookie(name, options)
    } else {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      setCookie(name, stringValue, options)
    }
  }

  let currentValue = read()

  const notify = (newValue: T | null, prevValue: T | null) => {
    for (const callback of subscribers) {
      try {
        callback(newValue, prevValue)
      } catch (e) {
        console.error('[useCookie] Subscriber error:', e)
      }
    }
  }

  // Start polling for changes when there are subscribers
  const startPolling = () => {
    if (pollInterval || typeof document === 'undefined') return
    pollInterval = setInterval(() => {
      const newValue = read()
      if (JSON.stringify(newValue) !== JSON.stringify(currentValue)) {
        const prevValue = currentValue
        currentValue = newValue
        notify(newValue, prevValue)
      }
    }, 1000)
  }

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  const ref: CookieRef<T> = {
    get value() {
      return currentValue
    },
    set value(newValue: T | null) {
      const prevValue = currentValue
      currentValue = newValue
      write(newValue)
      notify(newValue, prevValue)
    },
    get: () => currentValue,
    set: (value: T, customOptions?: CookieOptions) => {
      const prevValue = currentValue
      currentValue = value
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      setCookie(name, stringValue, { ...options, ...customOptions })
      notify(value, prevValue)
    },
    remove: () => {
      const prevValue = currentValue
      currentValue = null
      removeCookie(name, options)
      notify(null, prevValue)
    },
    subscribe: (callback) => {
      subscribers.add(callback)
      callback(currentValue, null)

      if (subscribers.size === 1) {
        startPolling()
      }

      return () => {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          stopPolling()
        }
      }
    },
  }

  return ref
}

/**
 * Get all cookies as an object
 */
export function useCookies(): Record<string, string> {
  return parseCookies()
}

/**
 * Clear all cookies (that are accessible)
 */
export function clearCookies(options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  const cookies = parseCookies()
  for (const name of Object.keys(cookies)) {
    removeCookie(name, options)
  }
}
