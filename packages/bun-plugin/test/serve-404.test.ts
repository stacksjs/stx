import { describe, expect, it } from 'bun:test'
import { render404Page } from '../src/serve'

/**
 * Regression tests for the built-in 404 page (stx serve).
 *
 * Production 404s must NOT enumerate the app's internal route list
 * (information disclosure) and must NOT reflect the raw requested path
 * (reflected-XSS guard). Development 404s keep the browsable route list,
 * which is a useful dev affordance.
 */

// A route list mirroring what discoverFiles() would surface — including
// sensitive internal/admin routes that must never leak in production.
const INTERNAL_ROUTES = [
  'dashboard/settings/billing',
  'checkout/payment',
  'dashboard/custom-page',
  'errors/tester',
  'orders/[id]',
]

describe('render404Page — production', () => {
  const html = render404Page({
    path: '/login',
    routes: INTERNAL_ROUTES,
    isProduction: true,
  })

  it('does not enumerate any internal route', () => {
    for (const route of INTERNAL_ROUTES) {
      expect(html).not.toContain(route)
    }
  })

  it('does not emit the route-list markup', () => {
    expect(html).not.toContain('Available pages')
    expect(html).not.toContain('class="routes"')
    expect(html).not.toContain('<li>')
  })

  it('does not reflect the requested path', () => {
    expect(html).not.toContain('/login')
  })

  it('contains no HMR client marker', () => {
    // The production handler never routes this page through injectHmrClient,
    // so the HMR marker must be absent.
    expect(html).not.toContain('data-stx-hmr')
    expect(html).not.toContain('/_stx/hmr')
  })

  it('renders a clean neutral 404 with a link home', () => {
    expect(html).toContain('404')
    expect(html).toContain('href="/"')
    // dark-mode aware, self-contained (no external assets)
    expect(html).toContain('prefers-color-scheme')
    expect(html).not.toContain('http://')
    expect(html).not.toContain('https://')
  })

  it('escapes a crafted path (no reflected XSS) even if reflected', () => {
    const crafted = render404Page({
      path: '/<script>alert(1)</script>',
      routes: INTERNAL_ROUTES,
      isProduction: true,
    })
    expect(crafted).not.toContain('<script>alert(1)</script>')
  })
})

describe('render404Page — development', () => {
  const html = render404Page({
    path: '/login',
    routes: INTERNAL_ROUTES,
    isProduction: false,
  })

  it('still shows the route list', () => {
    expect(html).toContain('Available pages')
    expect(html).toContain('class="routes"')
  })

  it('lists the discovered routes as links', () => {
    expect(html).toContain('href="/dashboard/settings/billing"')
    expect(html).toContain('href="/checkout/payment"')
  })

  it('escapes reflected route + path values (no XSS)', () => {
    const crafted = render404Page({
      path: '/<img src=x onerror=alert(1)>',
      routes: ['a"><script>alert(1)</script>'],
      isProduction: false,
    })
    expect(crafted).not.toContain('<img src=x onerror=alert(1)>')
    expect(crafted).not.toContain('<script>alert(1)</script>')
  })
})
