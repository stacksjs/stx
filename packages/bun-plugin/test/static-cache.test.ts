import { describe, expect, it } from 'bun:test'
import { staticCacheControl } from '../src/serve'

describe('staticCacheControl', () => {
  it('never caches in development', () => {
    expect(staticCacheControl('/images/hero.jpg', false)).toBe('no-store')
    expect(staticCacheControl('/app.a1b2c3d4.js', false)).toBe('no-store')
  })

  it('caches ordinary production assets for an hour', () => {
    // Long enough to matter to a browser and a link-preview crawler, short
    // enough that a deploy that replaces a share card is not stale for a year.
    expect(staticCacheControl('/images/og/home.jpg', true)).toBe('public, max-age=3600')
    expect(staticCacheControl('/favicon.svg', true)).toBe('public, max-age=3600')
  })

  it('caches fingerprinted assets forever', () => {
    // The content hash is the version: this URL cannot come to mean anything
    // else.
    expect(staticCacheControl('/app.a1b2c3d4.js', true)).toBe('public, max-age=31536000, immutable')
    expect(staticCacheControl('/assets/site-0f1e2d3c4b5a.css', true)).toBe('public, max-age=31536000, immutable')
  })

  it('does not mistake a plain name with digits for a fingerprint', () => {
    expect(staticCacheControl('/images/icon-512.png', true)).toBe('public, max-age=3600')
    expect(staticCacheControl('/images/og/2026-harvest.jpg', true)).toBe('public, max-age=3600')
  })
})
