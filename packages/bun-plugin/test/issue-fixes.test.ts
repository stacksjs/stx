/**
 * Regression suite for filed-and-fixed issues in bun-plugin-stx. Each
 * `describe` is named for its GitHub issue so a future failure points at
 * the originating bug.
 */
import { describe, expect, it } from 'bun:test'

/**
 * Mirror of the route-resolution logic in serve.ts so we can exercise the
 * regex builder without spinning up the dev server. Keep this in sync
 * with the implementation if the loop ever changes shape.
 */
function buildPatterns(relativeFilePath: string): RegExp[] {
  const fileRouteBase = relativeFilePath.replace(/\.(stx|md|html)$/, '')
  const routePattern = fileRouteBase
    .replace(/\[([^\]]+)\]/g, '([^/]+)')
    .replace(/\//g, '\\/')

  const regexPatterns: RegExp[] = [new RegExp(`^${routePattern}$`)]

  const fileRouteNoIndex = fileRouteBase.replace(/\/index$/, '')
  if (fileRouteNoIndex !== fileRouteBase) {
    const noIndexPattern = fileRouteNoIndex
      .replace(/\[([^\]]+)\]/g, '([^/]+)')
      .replace(/\//g, '\\/')
    regexPatterns.push(new RegExp(`^${noIndexPattern}$`))
  }

  if (fileRouteBase.startsWith('pages/')) {
    const prettyBase = fileRouteBase.slice(6)
    const prettyPattern = prettyBase
      .replace(/\[([^\]]+)\]/g, '([^/]+)')
      .replace(/\//g, '\\/')
    regexPatterns.push(new RegExp(`^${prettyPattern}$`))

    const prettyNoIndex = prettyBase.replace(/\/index$/, '')
    if (prettyNoIndex !== prettyBase) {
      const prettyNoIndexPattern = prettyNoIndex
        .replace(/\[([^\]]+)\]/g, '([^/]+)')
        .replace(/\//g, '\\/')
      regexPatterns.push(new RegExp(`^${prettyNoIndexPattern}$`))
    }
  }
  return regexPatterns
}

function matches(file: string, url: string): boolean {
  return buildPatterns(file).some(re => re.test(url))
}

describe('#1696 — nested dynamic [id]/segment/index.stx matches without /index', () => {
  it('matches /judges/35/profile when file is judges/[id]/profile/index.stx', () => {
    expect(matches('judges/[id]/profile/index.stx', 'judges/35/profile')).toBe(true)
  })

  it('still matches the explicit /index path (backwards compatible)', () => {
    expect(matches('judges/[id]/profile/index.stx', 'judges/35/profile/index')).toBe(true)
  })

  it('matches single-segment dynamic route /judges/:id without index suffix', () => {
    expect(matches('judges/[id].stx', 'judges/35')).toBe(true)
  })

  it('matches /court-houses/12/reviews when file is court-houses/[id]/reviews/index.stx', () => {
    expect(matches('court-houses/[id]/reviews/index.stx', 'court-houses/12/reviews')).toBe(true)
  })

  it('also matches the pages/-prefixed pretty form without /index', () => {
    expect(matches('pages/judges/[id]/profile/index.stx', 'judges/35/profile')).toBe(true)
  })

  it('does not match unrelated URLs', () => {
    expect(matches('judges/[id]/profile/index.stx', 'admin/35/profile')).toBe(false)
    expect(matches('judges/[id]/profile/index.stx', 'judges/35/cases')).toBe(false)
  })
})
