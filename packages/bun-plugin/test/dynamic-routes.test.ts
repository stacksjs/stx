import { describe, expect, it } from 'bun:test'
import { buildDynamicRouteRegexes } from '../src/serve'

/**
 * Dynamic-route regex construction (stacksjs/stx#1927).
 *
 * Nested dynamic routes (e.g. `judges/[id]/profile/index.stx`) used to
 * 404 on hard reload because the route regex kept the trailing
 * `/index`, so `^judges/([^/]+)/profile/index$` never matched the URL
 * `judges/35/profile`. These tests pin the `/index`-stripped variant.
 */

function matchesAny(fileRouteBase: string, url: string): boolean {
  return buildDynamicRouteRegexes(fileRouteBase).some(re => re.test(url))
}

describe('buildDynamicRouteRegexes — single-segment dynamic routes', () => {
  it('matches /judges/35 from judges/[id]', () => {
    expect(matchesAny('judges/[id]', 'judges/35')).toBe(true)
  })

  it('matches /judges/35 from judges/[id]/index', () => {
    expect(matchesAny('judges/[id]/index', 'judges/35')).toBe(true)
  })
})

describe('buildDynamicRouteRegexes — nested dynamic routes (the bug)', () => {
  it('matches /judges/35/profile from judges/[id]/profile/index', () => {
    expect(matchesAny('judges/[id]/profile/index', 'judges/35/profile')).toBe(true)
  })

  it('matches /judges/35/reviews from judges/[id]/reviews/index', () => {
    expect(matchesAny('judges/[id]/reviews/index', 'judges/35/reviews')).toBe(true)
  })

  it('matches /court-houses/1/bench from court-houses/[id]/bench/index', () => {
    expect(matchesAny('court-houses/[id]/bench/index', 'court-houses/1/bench')).toBe(true)
  })

  it('still matches the index-included URL for back-compat', () => {
    expect(matchesAny('judges/[id]/profile/index', 'judges/35/profile/index')).toBe(true)
  })

  it('does NOT match an unrelated path', () => {
    expect(matchesAny('judges/[id]/profile/index', 'judges/35/cases')).toBe(false)
  })

  it('captures the dynamic segment, not the static suffix', () => {
    const [, noIndexRe] = buildDynamicRouteRegexes('judges/[id]/profile/index')
    const m = 'judges/35/profile'.match(noIndexRe)
    expect(m?.[1]).toBe('35')
  })
})

describe('buildDynamicRouteRegexes — pages/ prefix', () => {
  it('matches the pages/-stripped URL', () => {
    expect(matchesAny('pages/judges/[id]/profile/index', 'judges/35/profile')).toBe(true)
  })

  it('matches the full pages/ path too', () => {
    expect(matchesAny('pages/data/[model]', 'pages/data/users')).toBe(true)
  })
})
