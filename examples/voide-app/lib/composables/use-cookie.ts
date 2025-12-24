/**
 * useCookie - Reactive cookie composable
 */

export interface CookieOptions {
  maxAge?: number
  expires?: Date | number | string
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  default?: unknown
}

export interface CookieRef<T> {
  value: T | null
  get: () => T | null
  set: (value: T, options?: CookieOptions) => void
  remove: () => void
  subscribe: (callback: (value: T | null, prev: T | null) => void) => () => void
}

export function parseCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {}
  const cookies: Record<string, string> = {}
  const pairs = document.cookie.split(';')
  for (const pair of pairs) {
    const [key, ...valueParts] = pair.trim().split('=')
    if (key) {
      try {
        cookies[key] = decodeURIComponent(valueParts.join('='))
      } catch {
        cookies[key] = valueParts.join('=')
      }
    }
  }
  return cookies
}

export function getCookie(name: string): string | null {
  return parseCookies()[name] ?? null
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return
  const { maxAge, expires, path = '/', domain, secure, sameSite = 'lax' } = options

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
  if (maxAge !== undefined) cookieString += `; max-age=${maxAge}`
  if (expires !== undefined) {
    const expiresDate = expires instanceof Date ? expires
      : typeof expires === 'number' ? new Date(Date.now() + expires * 1000)
      : new Date(expires)
    cookieString += `; expires=${expiresDate.toUTCString()}`
  }
  if (path) cookieString += `; path=${path}`
  if (domain) cookieString += `; domain=${domain}`
  if (secure) cookieString += '; secure'
  if (sameSite) cookieString += `; samesite=${sameSite}`
  document.cookie = cookieString
}

export function removeCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  setCookie(name, '', { ...options, maxAge: 0, expires: new Date(0) })
}

export function useCookie<T = string>(name: string, options: CookieOptions = {}): CookieRef<T> {
  const { default: defaultValue = null } = options
  const subscribers = new Set<(value: T | null, prev: T | null) => void>()
  let pollInterval: ReturnType<typeof setInterval> | null = null

  const read = (): T | null => {
    if (typeof document === 'undefined') return defaultValue as T | null
    const raw = getCookie(name)
    if (raw === null) return defaultValue as T | null
    try { return JSON.parse(raw) as T } catch { return raw as unknown as T }
  }

  let currentValue = read()

  const notify = (newValue: T | null, prevValue: T | null) => {
    for (const callback of subscribers) {
      try { callback(newValue, prevValue) } catch (e) { console.error('[useCookie]', e) }
    }
  }

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
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
  }

  const ref: CookieRef<T> = {
    get value() { return currentValue },
    set value(newValue: T | null) {
      const prevValue = currentValue
      currentValue = newValue
      if (newValue === null) removeCookie(name, options)
      else setCookie(name, typeof newValue === 'string' ? newValue : JSON.stringify(newValue), options)
      notify(newValue, prevValue)
    },
    get: () => currentValue,
    set: (value: T, customOptions?: CookieOptions) => {
      const prevValue = currentValue
      currentValue = value
      setCookie(name, typeof value === 'string' ? value : JSON.stringify(value), { ...options, ...customOptions })
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
      if (subscribers.size === 1) startPolling()
      return () => { subscribers.delete(callback); if (subscribers.size === 0) stopPolling() }
    },
  }

  return ref
}

export function clearCookies(options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  for (const name of Object.keys(parseCookies())) removeCookie(name, options)
}
