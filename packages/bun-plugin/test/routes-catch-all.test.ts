import { describe, expect, it } from 'bun:test'
import { buildDynamicRouteRegexes, isStaticAssetPath, routeSpecificity } from '../src/serve'

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

/**
 * stacksjs/stx#1841 — getRoute runs before the publicDir static handler, and its
 * catch-all matches `^(.+)$`, so `/images/logo.jpg` returned the 404 page before
 * publicDir could serve the real file — every public asset was shadowed. A
 * catch-all must not match a static-asset request; it falls through to publicDir.
 */
describe('isStaticAssetPath — catch-all never shadows a static asset (#1841)', () => {
  it('flags non-page file extensions as assets', () => {
    for (const p of ['images/logo.jpg', 'a/b/c.png', 'style.css', 'app.js', 'favicon.ico', 'og.webp'])
      expect(isStaticAssetPath(p)).toBe(true)
  })

  it('does not flag pages (no extension or a page extension)', () => {
    for (const p of ['article/15', 'about', 'foo/bar', 'page.stx', 'post.md', 'index.html'])
      expect(isStaticAssetPath(p)).toBe(false)
  })

  // Mirrors getRoute: catch-all candidates are dropped for asset requests, so
  // the resolver returns null (→ publicDir serves the file, then the real 404).
  const resolveAsset = (target: string, files: string[]): string | null => {
    const asset = isStaticAssetPath(target)
    const candidates = files
      .filter(f => f.includes('[') && !(asset && /\[\.\.\./.test(f)))
      .sort((a, b) => routeSpecificity(b) - routeSpecificity(a))
    for (const file of candidates) {
      for (const regex of buildDynamicRouteRegexes(file.replace(/\.(stx|md|html)$/, ''))) {
        if (target.match(regex))
          return file
      }
    }
    return null
  }

  it('an image path does NOT resolve to the catch-all (falls through to publicDir)', () => {
    const files = ['[...all].stx', 'foo/[id].stx']
    expect(resolveAsset('images/background-auth.jpg', files)).toBeNull()
  })

  it('a real page miss still resolves to the catch-all', () => {
    const files = ['[...all].stx', 'foo/[id].stx']
    expect(resolveAsset('some/missing/page', files)).toBe('[...all].stx')
  })

  it('a specific route may still match an extensioned path', () => {
    const files = ['[...all].stx', 'download/[file].stx']
    expect(resolveAsset('download/report.pdf', files)).toBe('download/[file].stx')
  })
})
