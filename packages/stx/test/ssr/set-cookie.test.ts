/**
 * `ctx.setCookie()` from a handler reaches the response (stacksjs/stx#1944).
 *
 * `setCookie` pushed onto a local array that `createContext` drained into
 * `responseHeaders` as its LAST statement — before returning the context, and
 * therefore before any handler could call it. Everything a handler set landed
 * in an array nothing read again.
 *
 * What made it survive: the session cookie is appended inside `createContext`,
 * ahead of that drain. So responses did carry `Set-Cookie`, sessions worked, and
 * the only broken call was the one an application makes. A smoke test asking
 * "does the server set cookies" passes on the session cookie alone — which is
 * why every test here asserts on a cookie the HANDLER set, by name.
 *
 * The second case is the one the issue does not mention. Copying the context
 * headers with `forEach` + `set` keeps only the LAST `Set-Cookie`, because each
 * iteration overwrites the previous. That was unreachable while a response never
 * carried more than the session cookie, so fixing the drain is what would have
 * exposed it. Both directions are pinned.
 */

import { describe, expect, it } from 'bun:test'
import { createApp } from '../../src/ssr'

/** The cookie pairs a response carries, as `name=value` without attributes. */
function cookiePairs(response: Response): string[] {
  return response.headers.getSetCookie().map(c => c.split(';')[0])
}

describe('ctx.setCookie from a handler', () => {
  it('emits a Set-Cookie', async () => {
    const app = createApp()
    app.get('/set', (ctx) => {
      ctx.setCookie('theme', 'dark', { path: '/' })
      return new Response('ok')
    })

    const response = await app.fetch(new Request('http://localhost/set'))

    expect(cookiePairs(response)).toContain('theme=dark')
  })

  it('carries the options it was given', async () => {
    const app = createApp()
    app.get('/set', (ctx) => {
      ctx.setCookie('token', 'abc', { httpOnly: true, path: '/admin', maxAge: 60 })
      return new Response('ok')
    })

    const response = await app.fetch(new Request('http://localhost/set'))
    const cookie = response.headers.getSetCookie().find(c => c.startsWith('token='))

    expect(cookie).toBeDefined()
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Path=/admin')
    expect(cookie).toContain('Max-Age=60')
  })

  it('emits every cookie a handler sets, not just the last', async () => {
    // `forEach` + `set` kept one. Two cookies is the smallest case that tells
    // the difference, and an app setting a preference alongside a session is
    // the ordinary one.
    const app = createApp()
    app.get('/set', (ctx) => {
      ctx.setCookie('first', '1')
      ctx.setCookie('second', '2')
      return new Response('ok')
    })

    const response = await app.fetch(new Request('http://localhost/set'))
    const pairs = cookiePairs(response)

    expect(pairs).toContain('first=1')
    expect(pairs).toContain('second=2')
  })

  it('does not displace the session cookie', async () => {
    // The other direction of the same overwrite: a handler's cookie must not
    // cost the caller their session.
    const app = createApp()
    app.get('/set', (ctx) => {
      ctx.setCookie('theme', 'dark')
      return new Response('ok')
    })

    const response = await app.fetch(new Request('http://localhost/set'))
    const names = cookiePairs(response).map(p => p.split('=')[0])

    expect(names).toContain('theme')
    expect(names.length).toBeGreaterThanOrEqual(2)
  })

  it('survives a cookie value containing a comma', async () => {
    // `Expires` carries one (`Expires=Wed, 21 Oct ...`), so any implementation
    // that joins cookies into a single comma-separated header splits them back
    // apart wrongly.
    const app = createApp()
    app.get('/set', (ctx) => {
      ctx.setCookie('session_note', 'a', { expires: new Date('2026-10-21T07:28:00Z') })
      ctx.setCookie('other', 'b')
      return new Response('ok')
    })

    const response = await app.fetch(new Request('http://localhost/set'))
    const pairs = cookiePairs(response)

    expect(pairs).toContain('session_note=a')
    expect(pairs).toContain('other=b')
  })
})

describe('non-cookie context headers', () => {
  it('still override rather than accumulate', async () => {
    // Cookies append; everything else must keep `set`, or a context header
    // would arrive alongside the default instead of replacing it.
    const app = createApp()
    app.get('/set', (ctx) => {
      ctx.responseHeaders.set('X-Custom', 'one')
      ctx.responseHeaders.set('X-Custom', 'two')
      return new Response('ok')
    })

    const response = await app.fetch(new Request('http://localhost/set'))

    expect(response.headers.get('X-Custom')).toBe('two')
  })
})
