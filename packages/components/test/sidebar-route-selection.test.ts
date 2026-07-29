import { describe, expect, it } from 'bun:test'
import { findActiveSidebarHref } from '../src/ui/sidebar/route-selection'

describe('Sidebar route selection', () => {
  it('selects the longest matching local route', () => {
    expect(findActiveSidebarHref('/commerce/products/42', [
      '/',
      '/commerce',
      '/commerce/products',
      '/commerce/products/reviews',
    ])).toBe('/commerce/products')
  })

  it('matches the root only on the root route', () => {
    expect(findActiveSidebarHref('/', ['/', '/dashboard'])).toBe('/')
    expect(findActiveSidebarHref('/dashboard', ['/', '/dashboard'])).toBe('/dashboard')
  })

  it('does not match sibling prefixes or external URLs', () => {
    expect(findActiveSidebarHref('/health-check', [
      '/health',
      'https://example.com/health-check',
    ])).toBeNull()
  })

  it('ignores query strings and trailing slashes', () => {
    expect(findActiveSidebarHref('/commerce/taxes/?status=active', [
      '/commerce/taxes',
    ])).toBe('/commerce/taxes')
  })
})
