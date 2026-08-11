import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildDynamicRouteRegexes, isStaticAssetPath, publicFileExists, routeSpecificity } from '../src/serve'

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

  // Mirrors getRoute: every dynamic candidate is dropped when publicDir really
  // holds the file, so the resolver returns null and publicDir serves it.
  // `exists` stands in for the disk.
  const resolveAsset = (target: string, files: string[], exists: string[] = []): string | null => {
    const asset = exists.includes(target)
    const candidates = files
      .filter(f => f.includes('[') && !asset)
      .sort((a, b) => routeSpecificity(b) - routeSpecificity(a))
    for (const file of candidates) {
      for (const regex of buildDynamicRouteRegexes(file.replace(/\.(stx|md|html)$/, ''))) {
        if (target.match(regex))
          return file
      }
    }
    return null
  }

  it('an image that publicDir has does NOT resolve to the catch-all', () => {
    const files = ['[...all].stx', 'foo/[id].stx']
    const target = 'images/background-auth.jpg'
    expect(resolveAsset(target, files, [target])).toBeNull()
  })

  it('a real page miss still resolves to the catch-all', () => {
    const files = ['[...all].stx', 'foo/[id].stx']
    expect(resolveAsset('some/missing/page', files)).toBe('[...all].stx')
  })

  it('a specific route may still match an extensioned path publicDir lacks', () => {
    const files = ['[...all].stx', 'download/[file].stx']
    expect(resolveAsset('download/report.pdf', files)).toBe('download/[file].stx')
  })

  /*
   * A forge's routes start at the root: `[owner]` claims every one-segment
   * path and `[owner]/[repository]` every two-segment one. Restricting the
   * drop to catch-alls assumed a shallow tree, so `/favicon.ico` and
   * `/js/mermaid.js` rendered pages and the whole publicDir was unreachable.
   */
  it('a plain dynamic route does not shadow a real public file either', () => {
    const files = ['[owner]/[repository].stx', '[owner].stx']
    expect(resolveAsset('js/mermaid.js', files, ['js/mermaid.js'])).toBeNull()
    expect(resolveAsset('favicon.ico', files, ['favicon.ico'])).toBeNull()
  })

  it('but a dynamic route still answers when publicDir has nothing there', () => {
    const files = ['[owner]/[repository].stx', '[owner].stx']
    expect(resolveAsset('stacks/stacks', files)).toBe('[owner]/[repository].stx')
  })

  /*
   * The other half of the disk check. An app whose catch-all serves paths that
   * carry extensions - a code browser rendering
   * `/owner/repo/tree/main/src/index.ts` - had every such page refused, because
   * the extension test called it an asset. Nothing is at that path in
   * publicDir, so nothing should be dropped.
   */
  it('an extensioned path publicDir does not have still resolves to the catch-all', () => {
    const files = ['[...all].stx', 'foo/[id].stx']
    expect(resolveAsset('owner/repo/tree/main/src/index.ts', files)).toBe('[...all].stx')
  })
})

/**
 * The disk check itself. It answers for files that are really there, and
 * refuses to answer for anything outside the root however the path is spelled.
 */
describe('publicFileExists', () => {
  const root = 'test/fixtures/public-exists'

  beforeAll(() => {
    mkdirSync(join(root, 'images'), { recursive: true })
    writeFileSync(join(root, 'images', 'logo.jpg'), 'not really a jpeg')
  })

  afterAll(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('finds a file that is there', () => {
    expect(publicFileExists('/images/logo.jpg', root)).toBe(true)
  })

  it('does not find one that is not', () => {
    expect(publicFileExists('/images/missing.jpg', root)).toBe(false)
    expect(publicFileExists('/owner/repo/tree/main/src/index.ts', root)).toBe(false)
  })

  it('is false for a directory, which is not a file to serve', () => {
    expect(publicFileExists('/images', root)).toBe(false)
  })

  it('refuses to walk out of the root', () => {
    expect(publicFileExists('/../../package.json', root)).toBe(false)
    expect(publicFileExists('/images/../../../package.json', root)).toBe(false)
  })

  it('reads an escaped path the same way the server will', () => {
    expect(publicFileExists('/images/%6Cogo.jpg', root)).toBe(true)
  })

  it('declines a path carrying a NUL', () => {
    expect(publicFileExists('/images/logo.jpg%00.txt', root)).toBe(false)
  })
})
