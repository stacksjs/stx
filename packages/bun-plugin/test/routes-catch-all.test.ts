import { describe, expect, it } from 'bun:test'
import { buildDynamicRouteRegexes, routeSpecificity } from '../src/serve'

/**
 * The plugin's dev server compiles file routes itself. Catch-alls were turned
 * into `([^/]+)`, which cannot span a separator, so any multi-segment URL was a
 * 404 - and the route looked simply absent rather than misconfigured.
 */
describe('buildDynamicRouteRegexes', () => {
  const base = '[owner]/[repository]/tree/[ref]/[...path]'

  it('lets a catch-all span separators', () => {
    const [regex] = buildDynamicRouteRegexes(base)
    expect('stacks/stacks/tree/main/storage/framework'.match(regex!)).not.toBeNull()
  })

  it('still matches a single segment', () => {
    const [regex] = buildDynamicRouteRegexes(base)
    const m = 'stacks/stacks/tree/main/app'.match(regex!)
    expect(m![4]).toBe('app')
  })

  it('captures the whole remainder in the catch-all group', () => {
    const [regex] = buildDynamicRouteRegexes(base)
    const m = 'stacks/stacks/tree/main/storage/framework'.match(regex!)
    expect(m![4]).toBe('storage/framework')
  })

  it('keeps ordinary params to one segment', () => {
    const [regex] = buildDynamicRouteRegexes('[owner]/[repository]')
    expect('a/b/c'.match(regex!)).toBeNull()
    expect('a/b'.match(regex!)).not.toBeNull()
  })
})

/**
 * stacksjs/stx#1837 — the resolver iterates discovered files in Bun glob order
 * and returns the FIRST regex match. Bun's glob frequently returns `[...all].stx`
 * first, so its `^(.+)$` shadowed every specific dynamic route and all detail
 * pages 404'd. routeSpecificity orders candidates most-specific-first so a
 * catch-all (or a broader param route) can never win over a more specific one.
 */
describe('routeSpecificity (catch-all never shadows a specific route — #1837)', () => {
  it('ranks a catch-all below any specific route', () => {
    expect(routeSpecificity('[...all]')).toBeLessThan(routeSpecificity('article/[id]'))
    expect(routeSpecificity('[...all]')).toBeLessThan(routeSpecificity('[id]'))
    expect(routeSpecificity('blog/[...slug]')).toBeLessThan(routeSpecificity('blog/[id]'))
  })

  it('prefers more static segments over broader routes', () => {
    expect(routeSpecificity('article/[id]/edit/index')).toBeGreaterThan(routeSpecificity('article/[id]'))
    expect(routeSpecificity('judges/review/[id]')).toBeGreaterThan(routeSpecificity('judges/[id]'))
  })

  it('is extension-agnostic', () => {
    expect(routeSpecificity('foo/[id].stx')).toBe(routeSpecificity('foo/[id]'))
  })

  // Mirrors getRoute: sort candidates by specificity, then take the first regex match.
  const resolve = (target: string, files: string[]): string | null => {
    const sorted = [...files].sort((a, b) => routeSpecificity(b) - routeSpecificity(a))
    for (const file of sorted) {
      const base = file.replace(/\.(stx|md|html)$/, '')
      for (const regex of buildDynamicRouteRegexes(base)) {
        if (target.match(regex))
          return file
      }
    }
    return null
  }

  it('resolves /foo/15 to foo/[id], not the catch-all', () => {
    const files = ['[...all].stx', 'foo/[id].stx', 'foo/[id]/edit/index.stx', 'bar/[id].stx']
    expect(resolve('foo/15', files)).toBe('foo/[id].stx')
  })

  it('still routes /foo/15/edit to the nested route', () => {
    const files = ['[...all].stx', 'foo/[id].stx', 'foo/[id]/edit/index.stx']
    expect(resolve('foo/15/edit', files)).toBe('foo/[id]/edit/index.stx')
  })

  it('a genuine miss still falls through to the catch-all', () => {
    const files = ['[...all].stx', 'foo/[id].stx']
    expect(resolve('nope/deep/path', files)).toBe('[...all].stx')
  })

  it('is independent of the input file order (the glob-order heisenbug)', () => {
    const files = ['[...all].stx', 'foo/[id].stx']
    expect(resolve('foo/15', files)).toBe('foo/[id].stx')
    expect(resolve('foo/15', [...files].reverse())).toBe('foo/[id].stx')
  })
})
