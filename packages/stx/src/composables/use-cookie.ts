/**
 * useCookie — reactive cookie binding (module-import path).
 *
 * stx ships two `useCookie` implementations:
 *
 *   1. This one (signals-api / module-import path) — used by tests, SSR-side
 *      tooling, and any code that imports from `'stx'` or
 *      `'@stacksjs/stx/composables'` directly.
 *   2. The runtime template literal inside `packages/stx/src/signals.ts` —
 *      injected into client pages and exposed at `window.stx.useCookie`.
 *
 * They MUST return the same shape and honor the same option keys, or callers
 * silently get different behavior depending on which entry point their import
 * resolves to. The runtime version is the canonical contract; this file
 * mirrors it. See stacksjs/stx#1710 for the divergence that motivated the
 * unification, and `test/composables/use-cookie-parity.test.ts` for the
 * tests that pin both impls to one contract.
 *
 * Shape (both impls):
 *   - returns a Signal<string> (callable; `c()` reads, `c.set(v)` writes)
 *   - setting to `''` removes the cookie (max-age=0)
 *   - options: defaultValue, encode, decode, maxAge, expires, path, domain,
 *     secure, sameSite, httpOnly
 *
 * The low-level utility exports (parseCookies, getCookie, setCookie,
 * removeCookie, useCookies, clearCookies) are unique to this module — the
 * runtime doesn't need them because it operates on `document.cookie`
 * directly inside its closure.
 */
import type { Signal } from '../signals-api'
import { state } from '../signals-api'

export interface CookieOptions {
  /** Max age in seconds. */
  maxAge?: number
  /** Expiration date (Date, ms-epoch, or parseable string). */
  expires?: Date | number | string
  /** Cookie path. Defaults to '/'. */
  path?: string
  /** Cookie domain. */
  domain?: string
  /** Secure flag (HTTPS only). Defaults to true when location.protocol === 'https:'. */
  secure?: boolean
  /** HttpOnly flag — only meaningful server-side; ignored in browser writes. */
  httpOnly?: boolean
  /** SameSite attribute. Defaults to 'Lax'. */
  sameSite?: 'strict' | 'lax' | 'none' | 'Strict' | 'Lax' | 'None'
  /** Default value returned when the cookie is missing. Defaults to ''. */
  defaultValue?: string
  /** Custom encoder (defaults to encodeURIComponent). */
  encode?: (value: string) => string
  /** Custom decoder (defaults to decodeURIComponent). */
  decode?: (value: string) => string
}

const defaultEncode = encodeURIComponent
const defaultDecode = decodeURIComponent

/**
 * Parse all cookies from `document.cookie` into a plain object.
 */
export function parseCookies(): Record<string, string> {
  if (typeof document === 'undefined')
    return {}

  const cookies: Record<string, string> = {}
  const pairs = document.cookie.split(';')

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.trim().split('=')
    if (key) {
      try {
        cookies[key] = defaultDecode(valueParts.join('='))
      }
      catch {
        cookies[key] = valueParts.join('=')
      }
    }
  }

  return cookies
}

/**
 * Read a single cookie's value. Returns `null` when missing.
 */
export function getCookie(name: string): string | null {
  const cookies = parseCookies()
  return cookies[name] ?? null
}

/**
 * Serialize options into a cookie attribute string. Shared by setCookie() and
 * the reactive useCookie() effect so attribute handling stays consistent.
 */
function serializeAttrs(name: string, value: string, options: CookieOptions): string {
  const {
    maxAge,
    expires,
    path = '/',
    domain,
    secure,
    sameSite = 'Lax',
    encode = defaultEncode,
  } = options

  const parts: string[] = [`${name}=${value ? encode(value) : ''}`]

  if (path)
    parts.push(`path=${path}`)
  if (domain)
    parts.push(`domain=${domain}`)

  // value === '' is the deletion path; max-age=0 wins regardless of caller intent.
  if (value === '') {
    parts.push('max-age=0')
  }
  else if (typeof maxAge === 'number') {
    parts.push(`max-age=${maxAge}`)
  }
  else if (expires !== undefined) {
    const expiresDate = expires instanceof Date
      ? expires
      : typeof expires === 'number'
        ? new Date(Date.now() + expires * 1000)
        : new Date(expires)
    parts.push(`expires=${expiresDate.toUTCString()}`)
  }

  parts.push(`SameSite=${sameSite}`)

  let secureFinal = secure
  if (secureFinal === undefined)
    secureFinal = typeof location !== 'undefined' && location.protocol === 'https:'
  if (secureFinal)
    parts.push('Secure')

  return parts.join('; ')
}

/**
 * Write a cookie. No reactivity — use `useCookie()` for that.
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined')
    return
  document.cookie = serializeAttrs(name, value, options)
}

/**
 * Delete a cookie (sets max-age=0 and expires=epoch).
 */
export function removeCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  setCookie(name, '', {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  })
}

/**
 * Create a reactive Signal bound to a cookie. Mirrors `useLocalStorage`'s
 * shape: read with `c()`, write with `c.set(v)`. Setting to `''` deletes the
 * cookie. The signal is one-way (writes propagate to document.cookie via an
 * `effect`); cookies don't fire a 'storage' event, so cross-tab updates
 * aren't auto-reflected.
 *
 * @example
 * ```ts
 * const token = useCookie('auth-token', { maxAge: 60 * 60 * 24 * 7 })
 * token()           // read current value
 * token.set('xyz')  // persist
 * token.set('')     // delete
 * ```
 */
export function useCookie(name: string, options: CookieOptions = {}): Signal<string> {
  const decode = options.decode || defaultDecode
  const defaultValue = options.defaultValue ?? ''

  // Escape regex metacharacters so cookie names like `__Host-session.id` are
  // matched literally (the dot was previously interpreted as "any char").
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const nameRe = new RegExp(`(?:^|; )${escapedName}=([^;]*)`)

  function read(): string {
    if (typeof document === 'undefined')
      return defaultValue
    const m = document.cookie.match(nameRe)
    return m ? decode(m[1]) : defaultValue
  }

  const s = state<string>(read())

  // Subscribe to the signal so every .set() persists to document.cookie.
  // Using subscribe (not effect) keeps this independent of any outer effect
  // tracking context the caller might be running in.
  s.subscribe((value) => {
    if (typeof document === 'undefined')
      return
    document.cookie = serializeAttrs(name, value, options)
  })

  return s
}

/**
 * Snapshot of all currently-readable cookies as a plain object.
 */
export function useCookies(): Record<string, string> {
  return parseCookies()
}

/**
 * Best-effort clear of every cookie visible to JavaScript. HttpOnly cookies
 * and cookies under a different path/domain won't be touched.
 */
export function clearCookies(options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  const cookies = parseCookies()
  for (const name of Object.keys(cookies)) {
    removeCookie(name, options)
  }
}
