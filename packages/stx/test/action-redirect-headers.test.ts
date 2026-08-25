/**
 * A redirecting action carries the headers the page asked for (stacksjs/stx#1943).
 *
 * #1943 is about `setResponseHeader` being honoured in dev and dropped in
 * production. Most of it was fixed in 465b869870 — `hydrateTemplateStream`
 * returns the recorded headers and the production server merges them on the
 * HTML and streaming paths. The redirect path was the piece left over:
 * `actionRedirectResponse` took cookies and nothing else, so a page that set a
 * header and then redirected lost it.
 *
 * Unlike the rest of the issue that one was NOT a divergence — the dev server
 * called the same helper the same way, so both sides dropped it. Which is worth
 * saying because fixing only production would have created the divergence the
 * issue is complaining about, pointing the other way.
 *
 * `Location` is the one header a page cannot set through this channel: the
 * destination is the function's contract. A test pins that, because silently
 * retargeting a redirect is a worse failure than ignoring a header.
 */

import { describe, expect, it } from 'bun:test'
import { actionRedirectResponse } from '../src/page-action'

describe('headers on a redirecting action', () => {
  it('carries a header the page set', () => {
    const response = actionRedirectResponse('/dashboard', [], { 'X-Robots-Tag': 'noindex' })

    expect(response.status).toBe(303)
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex')
    expect(response.headers.get('Location')).toBe('/dashboard')
  })

  it('carries several', () => {
    const response = actionRedirectResponse('/dashboard', [], {
      'X-Robots-Tag': 'noindex',
      'Content-Language': 'en-GB',
    })

    expect(response.headers.get('X-Robots-Tag')).toBe('noindex')
    expect(response.headers.get('Content-Language')).toBe('en-GB')
  })

  it('lets the page override Cache-Control', () => {
    // `no-store` is the default because a redirect answering a submission is
    // never cacheable, but it is a default rather than a rule — a page that has
    // decided otherwise has said so explicitly.
    const response = actionRedirectResponse('/dashboard', [], { 'Cache-Control': 'private, max-age=30' })

    expect(response.headers.get('Cache-Control')).toBe('private, max-age=30')
  })

  it('does not let the page retarget the redirect', () => {
    const response = actionRedirectResponse('/dashboard', [], { Location: '/elsewhere' })

    expect(response.headers.get('Location')).toBe('/dashboard')
  })

  it('does not let a differently-cased Location through either', () => {
    // Headers are case-insensitive, so an exact-match guard would be no guard.
    const response = actionRedirectResponse('/dashboard', [], { 'lOcAtIoN': '/elsewhere' })

    expect(response.headers.get('Location')).toBe('/dashboard')
  })

  it('still emits every cookie alongside the headers', () => {
    // The two channels share one Headers, so it is worth checking that adding
    // the second did not disturb the first — `set` on a Set-Cookie would have
    // collapsed these to one.
    const response = actionRedirectResponse(
      '/dashboard',
      ['session=a; HttpOnly', 'csrf=b'],
      { 'X-Robots-Tag': 'noindex' },
    )

    expect(response.headers.getSetCookie()).toHaveLength(2)
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex')
  })

  it('behaves exactly as before when the page set no headers', () => {
    const response = actionRedirectResponse('/dashboard', ['session=a'])

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe('/dashboard')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.getSetCookie()).toEqual(['session=a'])
  })
})
