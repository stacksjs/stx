/**
 * One `Set-Cookie` serializer.
 *
 * There were three, byte-identical in behaviour and separately maintained:
 * `ssr.ts` (private), `edge-runtime.ts` (`createCookie`, exported) and
 * `composables/use-cookie.ts` (client-side, writes `document.cookie`). Page
 * actions needed a fourth (stacksjs/stx#1927), which is the point at which
 * copying it again stops being cheaper than sharing it — the way a set of
 * duplicated implementations goes wrong is by drifting, and an attribute that
 * one of them emits and another does not is a cookie that works on one code
 * path and silently does not on the next.
 *
 * The client-side one in `use-cookie.ts` is deliberately left alone: it runs in
 * a browser against `document.cookie`, where `HttpOnly` is meaningless and the
 * encoding rules differ.
 *
 * @module cookie-serialize
 */

/** Attributes of a `Set-Cookie` header. */
export interface SetCookieOptions {
  /** Lifetime in seconds. `0` expires the cookie immediately. */
  maxAge?: number
  expires?: Date
  path?: string
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

/**
 * Build one `Set-Cookie` header value.
 *
 * Name and value are percent-encoded, so a session token containing `;` or `=`
 * cannot terminate the cookie early or invent an attribute.
 *
 * `maxAge` is compared against `undefined` rather than tested for truthiness:
 * `Max-Age=0` is how a cookie is DELETED, and a truthiness check drops exactly
 * that case — leaving the cookie in place while the caller believes it cleared
 * it.
 */
export function serializeSetCookie(name: string, value: string, options: SetCookieOptions = {}): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  if (options.maxAge !== undefined)
    cookie += `; Max-Age=${options.maxAge}`
  if (options.expires)
    cookie += `; Expires=${options.expires.toUTCString()}`
  if (options.path)
    cookie += `; Path=${options.path}`
  if (options.domain)
    cookie += `; Domain=${options.domain}`
  if (options.secure)
    cookie += '; Secure'
  if (options.httpOnly)
    cookie += '; HttpOnly'
  if (options.sameSite)
    cookie += `; SameSite=${options.sameSite}`

  return cookie
}
