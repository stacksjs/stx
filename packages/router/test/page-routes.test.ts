/**
 * `components/`, `layouts/` and `partials/` are not public URLs
 * (stacksjs/stx#1866).
 *
 * The exclusion existed only in `codegen.ts`, so the generated manifest and the
 * live route table disagreed: `.stx/routes.ts` listed the pages, `Router.routes`
 * listed the pages *and* every component, layout and partial. Those extra
 * entries were served, statically built to HTML, and published in sitemap.xml.
 *
 * One reporting app's fix was to delete `resources/views/layouts/` outright so
 * layouts could not be routed — a structural workaround for a framework bug,
 * which is the signal that this belonged in the scanner.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Router } from '../src/file-router'
import { isNonPageRoutePath, isNonPageRoutePattern, NON_PAGE_DIRS } from '../src/page-routes'

let dir = ''

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-page-routes-'))
})

afterEach(async () => {
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

function patterns(): string[] {
  return new Router(dir, { pagesDir: 'views', stateDir: path.join(dir, '.stx') })
    .routes.map(r => r.pattern).sort()
}

describe('the scanner', () => {
  it('routes pages but not components, layouts or partials', async () => {
    await Bun.write(path.join(dir, 'views', 'index.stx'), 'home')
    await Bun.write(path.join(dir, 'views', 'login.stx'), 'login')
    await Bun.write(path.join(dir, 'views', 'components', 'site-nav.stx'), 'nav')
    await Bun.write(path.join(dir, 'views', 'layouts', 'app.stx'), 'layout')
    await Bun.write(path.join(dir, 'views', 'partials', 'head.stx'), 'head')

    expect(patterns()).toEqual(['/', '/login'])
  })

  it('excludes them at any depth, not just the first segment', async () => {
    // The codegen filter matched a leading segment only, so this one slipped
    // through even the manifest.
    await Bun.write(path.join(dir, 'views', 'admin', 'index.stx'), 'admin')
    await Bun.write(path.join(dir, 'views', 'admin', 'components', 'chart.stx'), 'chart')

    expect(patterns()).toEqual(['/admin'])
  })

  it('still routes a page merely named like one', async () => {
    // `components.stx` is a page about components, not a component.
    await Bun.write(path.join(dir, 'views', 'components.stx'), 'page')

    expect(patterns()).toEqual(['/components'])
  })
})

describe('the predicates', () => {
  it('agrees with the directory list', () => {
    expect(NON_PAGE_DIRS).toContain('components')
    expect(NON_PAGE_DIRS).toContain('layouts')
    expect(NON_PAGE_DIRS).toContain('partials')
  })

  it('judges paths by directory, not filename', () => {
    expect(isNonPageRoutePath('components/site-nav.stx')).toBe(true)
    expect(isNonPageRoutePath(path.join('admin', 'partials', 'x.stx'))).toBe(true)
    expect(isNonPageRoutePath('components.stx')).toBe(false)
    expect(isNonPageRoutePath('about.stx')).toBe(false)
  })

  it('judges patterns the same way', () => {
    expect(isNonPageRoutePattern('/components/site-nav')).toBe(true)
    expect(isNonPageRoutePattern('/admin/components/chart')).toBe(true)
    expect(isNonPageRoutePattern('/about')).toBe(false)
  })

  it('keeps a real page whose URL happens to be /components', () => {
    // The scanner skips the directory, so this pattern can only come from a
    // `components.stx` page. Dropping it here would route the page but omit it
    // from the manifest and route types.
    expect(isNonPageRoutePattern('/components')).toBe(false)
  })
})

/**
 * `emails/` is a building block, not a section of the site (stacksjs/stx#1897).
 *
 * A stacks app ships `resources/views/emails/` as a first-class convention,
 * alongside the things that genuinely are pages. It matched none of the three
 * names in `NON_PAGE_DIRS`, so it flowed through every stage as if it were a
 * section of the site: `GET /emails/welcome` answered with an email template,
 * `navigate('/emails/welcome')` type-checked against the generated route map,
 * and an SSG build wrote it out as HTML and advertised it in sitemap.xml.
 *
 * The same failure as #1866, which this module was written to prevent, reached
 * through a directory the list did not name.
 */
describe('emails are not pages (#1897)', () => {
  it('skips a template under emails/', () => {
    expect(isNonPageRoutePath('emails/welcome.stx')).toBe(true)
    expect(isNonPageRoutePath('emails/order/shipped.stx')).toBe(true)
  })

  it('skips it at depth, the way the other building blocks are skipped', () => {
    expect(isNonPageRoutePath('admin/emails/invite.stx')).toBe(true)
  })

  it('excludes the pattern from the generated route table', () => {
    expect(isNonPageRoutePattern('/emails/welcome')).toBe(true)
  })

  it('leaves a page merely NAMED emails alone', () => {
    // `emails.stx` is a legitimate page — a preferences screen, say. Only the
    // directory is a building block.
    expect(isNonPageRoutePath('emails.stx')).toBe(false)
  })

  it('does not touch errors/, which really are pages', () => {
    // `errors/404.stx` and `errors/500.stx` are served by the framework on
    // those statuses, so excluding them would break the feature.
    expect(isNonPageRoutePath('errors/404.stx')).toBe(false)
  })
})
