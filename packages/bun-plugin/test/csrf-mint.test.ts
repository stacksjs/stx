import { describe, expect, it } from 'bun:test'
import { CSRF_COOKIE, csrfCookieHeader, csrfTokenToMint } from '../src/serve'

/**
 * The token has to exist before the page that embeds it is rendered.
 *
 * The usual pattern seeds a CSRF cookie on the way *out*, which works for a
 * single-page app: it reads the cookie and echoes the header on its next
 * request. It is too late for a server-rendered page with forms in it. The
 * page is what has to embed the token, and on a visitor's very first request
 * it renders before any cookie exists - so its forms carry nothing and their
 * first submit is rejected. That is the submit most likely to belong to
 * somebody trying the application for the first time.
 *
 * Found in a forge whose pages deliberately run no client-side JavaScript:
 * every form returned 403, because a form can send neither the header nor a
 * token it was never given.
 */

function request(init: { method?: string, cookie?: string, accept?: string } = {}): Request {
  const headers: Record<string, string> = {}
  if (init.cookie)
    headers.cookie = init.cookie
  if (init.accept)
    headers.accept = init.accept

  return new Request('http://localhost/acme/app', { method: init.method ?? 'GET', headers })
}

describe('csrfTokenToMint', () => {
  it('mints for a first-time visitor, who is the whole reason it exists', () => {
    expect(csrfTokenToMint(request(), {})).toMatch(/^[0-9a-f]{64}$/)
  })

  /** Rotating a live token would reject the very form somebody is about to submit. */
  it('leaves an existing token alone', () => {
    expect(csrfTokenToMint(request(), { [CSRF_COOKIE]: 'a'.repeat(64) })).toBeNull()
    expect(csrfTokenToMint(request(), { 'csrf-token': 'a'.repeat(64) })).toBeNull()
  })

  it('mints on safe methods only', () => {
    expect(csrfTokenToMint(request({ method: 'GET' }), {})).not.toBeNull()
    expect(csrfTokenToMint(request({ method: 'HEAD' }), {})).not.toBeNull()

    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'])
      expect(csrfTokenToMint(request({ method }), {}), method).toBeNull()
  })

  /**
   * A stylesheet has no forms in it. Minting on every asset would hand out a
   * new token per request while the page that matters embedded an older one.
   */
  it('mints for a document, not for an asset', () => {
    expect(csrfTokenToMint(request({ accept: 'text/html,application/xhtml+xml' }), {})).not.toBeNull()
    expect(csrfTokenToMint(request({ accept: '*/*' }), {})).not.toBeNull()
    expect(csrfTokenToMint(request({ accept: 'text/css,*/*;q=0.1' }), {})).not.toBeNull()
    expect(csrfTokenToMint(request({ accept: 'image/avif,image/webp' }), {})).toBeNull()
    expect(csrfTokenToMint(request({ accept: 'text/css' }), {})).toBeNull()
  })

  it('is a different token every time', () => {
    const minted = new Set(Array.from({ length: 50 }, () => csrfTokenToMint(request(), {})))

    expect(minted.size).toBe(50)
  })
})

describe('csrfCookieHeader', () => {
  it('carries the token, scoped to the whole site', () => {
    const header = csrfCookieHeader('abc', false)

    expect(header).toContain(`${CSRF_COOKIE}=abc`)
    expect(header).toContain('Path=/')
    expect(header).toContain('SameSite=Lax')
  })

  /** Double-submit requires a script to be able to read it. */
  it('is not HttpOnly, which is the point of double submit', () => {
    expect(csrfCookieHeader('abc', false)).not.toContain('HttpOnly')
  })

  it('is Secure over HTTPS and not over plain HTTP, so localhost works', () => {
    expect(csrfCookieHeader('abc', true)).toContain('Secure')
    expect(csrfCookieHeader('abc', false)).not.toContain('Secure')
  })
})
