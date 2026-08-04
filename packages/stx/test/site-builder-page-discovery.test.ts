/**
 * The site builder publishes pages, not layouts (stacksjs/stx#1821).
 *
 * It globbed `pagesDir/**\/*.stx` with no exclusion, so every match became a
 * build entrypoint, a public route AND a sitemap entry.
 *
 * That bites because `layoutsDir` is routinely a SUBDIRECTORY of `pagesDir` —
 * the config actively encourages it (`pagesDir: 'views'` with
 * `layoutsDir: 'views/layouts'`). A layout shell is `@yield('content')` with no
 * content, so the build published `/layouts/default` and `/layouts/marketing`:
 * a crawler following the sitemap indexed empty pages, and anyone requesting the
 * URL got a broken half-rendered document.
 *
 * Nothing in the config flagged the overlap — a silently valid arrangement that
 * silently published.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Glob } from 'bun'

let dir: string

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-pages-'))
  for (const rel of [
    'views/index.stx',
    'views/about.stx',
    'views/blog/post.stx',
    'views/layouts/default.stx',
    'views/layouts/marketing.stx',
    'views/partials/nav.stx',
    'views/components/Card.stx',
    'views/_private.stx',
  ]) {
    const abs = path.join(dir, rel)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, '<main>x</main>')
  }
})

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

/**
 * The discovery rule, mirrored from build.ts so it can be exercised without
 * running a full static build (which needs a Bun.build per page).
 */
function discover(pagesDir: string, excludeDirs = ['layouts', 'partials', 'components']): string[] {
  const glob = new Glob(`${pagesDir}/**/*.stx`)
  const all = [...glob.scanSync({ cwd: dir })]
  return all.filter((file) => {
    const rel = file.slice(pagesDir.length).replace(/^[\\/]+/, '')
    const segments = rel.split(/[\\/]/)
    if (segments.slice(0, -1).some(seg => excludeDirs.includes(seg)))
      return false
    return !segments.some(seg => seg.startsWith('_'))
  }).sort()
}

describe('page discovery', () => {
  it('publishes real pages', () => {
    const pages = discover('views')
    expect(pages).toContain('views/index.stx')
    expect(pages).toContain('views/about.stx')
    expect(pages).toContain('views/blog/post.stx')
  })

  it('does not publish layouts nested under pagesDir', () => {
    // The reported case, verbatim: /layouts/default and /layouts/marketing.
    const pages = discover('views')
    expect(pages.filter(p => p.includes('/layouts/'))).toEqual([])
  })

  it('does not publish partials or components either', () => {
    const pages = discover('views')
    expect(pages.filter(p => p.includes('/partials/'))).toEqual([])
    expect(pages.filter(p => p.includes('/components/'))).toEqual([])
  })

  it('honours the file-router underscore convention', () => {
    expect(discover('views')).not.toContain('views/_private.stx')
  })

  it('can be told to publish everything', () => {
    // An escape hatch matters: someone may genuinely want a flat directory.
    const pages = discover('views', [])
    expect(pages.some(p => p.includes('/layouts/'))).toBe(true)
  })

  it('only excludes those names as DIRECTORIES, not as page names', () => {
    // `views/components.stx` is a page about components, not a component.
    fs.writeFileSync(path.join(dir, 'views', 'components.stx'), '<main>x</main>')
    expect(discover('views')).toContain('views/components.stx')
  })
})
