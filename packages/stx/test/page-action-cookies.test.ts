/**
 * A page action can set a cookie, so it can sign someone in (stacksjs/stx#1927).
 *
 * Page actions landed with the right shape — a page declares `action`, gets its
 * own non-GET request, and returns either a redirect or a context merge — and
 * stopped at the first form anyone reaches for. Sign-in is DEFINED by
 * establishing a session: POST credentials, verify, **set the session cookie**,
 * 303 to the destination. Three of those four steps were expressible.
 *
 * `PageActionContext` already hands `cookies` IN, so handing them back is the
 * other half of a symmetry that was simply missing. Without it, sign-in and
 * sign-up had to keep posting to a separate JSON endpoint that could set a
 * cookie — which leaves exactly the two-handlers-per-form split page actions
 * exist to remove.
 *
 * The redirect path is the obvious one. The RE-RENDER path matters just as
 * much and is the easier one to leave out: a failed sign-in redraws the form,
 * and that response is the one that has to carry a rotated CSRF token or a
 * cleared session. Setting cookies on success only is the harder half to notice.
 */

import { describe, expect, it } from 'bun:test'
import { actionRedirectResponse, runPageAction } from '../src/page-action'
import { serializeSetCookie } from '../src/cookie-serialize'

/** A form POST, as a browser sends one. */
function submit(body: string): Request {
  return new Request('http://localhost/sign-in', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
}

describe('the sign-in shape', () => {
  it('carries the session cookie out alongside the redirect', async () => {
    const context = {
      action: ({ form }: { form: Record<string, string | string[]> }) => {
        if (form.email !== 'a@b.test')
          return { error: 'Invalid credentials' }
        return {
          redirect: '/dashboard',
          cookies: {
            session: { value: 'tok-123', maxAge: 2_592_000, sameSite: 'Lax' as const, httpOnly: true, path: '/' },
          },
        }
      },
    }

    const result = await runPageAction(context, { request: submit('email=a%40b.test'), method: 'POST' })

    expect(result.redirect).toBe('/dashboard')
    expect(result.cookies).toHaveLength(1)
    expect(result.cookies![0]).toBe('session=tok-123; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax')
  })

  it('puts them on the 303 the browser actually receives', async () => {
    const response = actionRedirectResponse('/dashboard', ['session=tok-123; HttpOnly'])

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe('/dashboard')
    expect(response.headers.get('Set-Cookie')).toContain('session=tok-123')
    // The redirect is still uncacheable — adding cookies must not lose this.
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('keeps every cookie when several are set', async () => {
    // A session cookie plus a CSRF rotation is the ordinary case, and an object
    // literal of headers cannot hold a repeated key — only `append` can.
    const response = actionRedirectResponse('/dashboard', ['session=a', 'csrf=b'])
    const all = response.headers.getSetCookie()

    expect(all).toEqual(['session=a', 'csrf=b'])
  })
})

describe('the re-render path', () => {
  it('can set a cookie without redirecting', async () => {
    // A failed sign-in redraws the form; that response still has to be able to
    // rotate a token or clear a stale session.
    const context: Record<string, any> = {
      action: () => ({ error: 'Invalid credentials', cookies: { csrf: 'rotated' } }),
    }

    const result = await runPageAction(context, { request: submit(''), method: 'POST' })

    expect(result.redirect).toBeUndefined()
    expect(result.cookies).toEqual(['csrf=rotated'])
    // …and the data it returned still reaches the template.
    expect(context.error).toBe('Invalid credentials')
  })

  it('does not merge the protocol keys into the render context', async () => {
    // `cookies` and `redirect` are the action's protocol with the caller, not
    // page data. Merging `cookies` would overwrite the REQUEST cookies the
    // template reads under that same name.
    const context: Record<string, any> = {
      cookies: { existing: 'from-request' },
      action: () => ({ ok: true, cookies: { session: 'new' } }),
    }

    await runPageAction(context, { request: submit(''), method: 'POST' })

    expect(context.cookies).toEqual({ existing: 'from-request' })
    expect(context.ok).toBe(true)
  })
})

describe('what an action may return under cookies', () => {
  it('accepts a bare string for the simple case', async () => {
    const context = { action: () => ({ cookies: { locale: 'en-GB' } }) }
    const result = await runPageAction(context, { request: submit(''), method: 'POST' })

    expect(result.cookies).toEqual(['locale=en-GB'])
  })

  it('percent-encodes, so a token cannot invent an attribute', async () => {
    // A value containing `;` would otherwise terminate the cookie early and the
    // rest would be read as attributes.
    const context = { action: () => ({ cookies: { session: 'a;HttpOnly=x' } }) }
    const result = await runPageAction(context, { request: submit(''), method: 'POST' })

    expect(result.cookies![0]).toBe('session=a%3BHttpOnly%3Dx')
  })

  it('drops an entry with no value rather than guessing', async () => {
    // An empty value DELETES a cookie, so inventing one for a malformed entry
    // would silently clear the session it was meant to set.
    const context = { action: () => ({ cookies: { broken: { maxAge: 60 }, good: 'yes' } }) }
    const result = await runPageAction(context, { request: submit(''), method: 'POST' })

    expect(result.cookies).toEqual(['good=yes'])
  })

  it('reports nothing when the action sets none', async () => {
    const context = { action: () => ({ error: 'nope' }) }
    const result = await runPageAction(context, { request: submit(''), method: 'POST' })

    expect(result.cookies).toBeUndefined()
  })
})

describe('serializeSetCookie', () => {
  it('emits Max-Age=0, which is how a cookie is deleted', () => {
    // A truthiness check on `maxAge` drops exactly this case, leaving the cookie
    // in place while the caller believes it cleared it.
    expect(serializeSetCookie('session', '', { maxAge: 0, path: '/' }))
      .toBe('session=; Max-Age=0; Path=/')
  })

  it('emits every attribute a session cookie needs', () => {
    expect(serializeSetCookie('s', 'v', {
      maxAge: 60,
      path: '/',
      domain: 'example.test',
      secure: true,
      httpOnly: true,
      sameSite: 'Strict',
    })).toBe('s=v; Max-Age=60; Path=/; Domain=example.test; Secure; HttpOnly; SameSite=Strict')
  })
})
