import { describe, expect, it } from 'bun:test'
import { SHARED_SCRIPT_PATH, sharedScriptCacheControl, staticCacheControl } from '../src/serve'

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

describe('shared runtime and router scripts', () => {
  const current = '0123456789abcdef'

  it('matches the hashed and the legacy fixed URLs, and nothing else', () => {
    expect('/_stx/router.0123456789abcdef.js'.match(SHARED_SCRIPT_PATH)?.slice(1)).toEqual(['router', current])
    expect('/_stx/runtime.js'.match(SHARED_SCRIPT_PATH)?.slice(1)).toEqual(['runtime', undefined])
    expect('/_stx/stores.js').not.toMatch(SHARED_SCRIPT_PATH)
    expect('/_stx/router.0123.js').not.toMatch(SHARED_SCRIPT_PATH)
    expect('/_stx/router.0123456789abcdef.js.map').not.toMatch(SHARED_SCRIPT_PATH)
  })

  it('caches the current content\'s hash forever', () => {
    expect(sharedScriptCacheControl(current, current)).toBe('public, max-age=31536000, immutable')
  })

  it('never lets the fixed URL or a previous release\'s hash be kept', () => {
    // Both answer with today's script. Caching it under either URL would pin
    // it there across the next deploy — the bug content addressing fixes.
    expect(sharedScriptCacheControl(undefined, current)).toBe('no-cache')
    expect(sharedScriptCacheControl('fedcba9876543210', current)).toBe('no-cache')
  })
})
