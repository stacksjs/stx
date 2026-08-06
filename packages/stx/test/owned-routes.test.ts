/**
 * The server tells the client which paths it owns (stacksjs/stx#1864).
 *
 * The client half of this is `packages/router/test/client-owned-routes.test.ts`.
 * This side covers what gets shipped: the matchers are the file router's OWN
 * compiled regexes, so the client cannot disagree with the server about what is
 * a page, and the key is omitted entirely when discovery found nothing.
 *
 * That omission is the safety property. An empty array on the client would read
 * as "this site owns no routes" and disable SPA navigation everywhere; absent
 * means unknown, and the router keeps its previous behaviour.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { clearOwnedRoutesCache, getOwnedRouteMatchers } from '../src/owned-routes'
import { injectRouterScript } from '../src/runtime-injection'

let dir = ''
const originalCwd = process.cwd()

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-owned-routes-'))
  fs.mkdirSync(path.join(dir, 'pages', 'cars'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'pages', 'index.stx'), '<main>Home</main>\n')
  fs.writeFileSync(path.join(dir, 'pages', 'login.stx'), '<main>Login</main>\n')
  fs.writeFileSync(path.join(dir, 'pages', 'cars', '[id].stx'), '<main>Car</main>\n')
  clearOwnedRoutesCache()
  process.chdir(dir)
})

afterEach(() => {
  process.chdir(originalCwd)
  clearOwnedRoutesCache()
  if (dir)
    fs.rmSync(dir, { recursive: true, force: true })
})

/** Does any shipped matcher claim this path? */
function owns(sources: string[], pathname: string): boolean {
  return sources.some(source => new RegExp(source).test(pathname))
}

describe('discovering owned routes', () => {
  it('claims the pages that exist', async () => {
    const sources = await getOwnedRouteMatchers('pages')

    expect(owns(sources, '/')).toBe(true)
    expect(owns(sources, '/login')).toBe(true)
  })

  it('claims a dynamic route by its own compiled matcher', async () => {
    // Not a re-implementation: the same regex the server routes with.
    const sources = await getOwnedRouteMatchers('pages')

    expect(owns(sources, '/cars/42')).toBe(true)
  })

  it('does not claim an endpoint that is not a page', async () => {
    // The reported case — claiming this fetched it, failed to swap, then
    // navigated for real, minting OAuth state twice.
    const sources = await getOwnedRouteMatchers('pages')

    expect(owns(sources, '/api/auth/github/redirect')).toBe(false)
    expect(owns(sources, '/docs/guide')).toBe(false)
  })

  it('returns nothing for a directory with no pages', async () => {
    const sources = await getOwnedRouteMatchers('does-not-exist')

    expect(sources).toEqual([])
  })
})

describe('what reaches the page', () => {
  const DOC = '<html><body><main>x</main></body></html>'

  it('ships the matchers in the router config', async () => {
    const html = await injectRouterScript(DOC, { pagesDir: 'pages' } as any)

    const match = html.match(/window\.__stxRouterConfig=(\{.*?\});/)
    expect(match).not.toBeNull()
    expect(JSON.parse(match![1]).ownedRoutes.length).toBeGreaterThan(0)
  })

  it('ships them even when no router config was declared', async () => {
    // The config script used to be emitted only when stx.config.ts had a
    // `router` block, so the common case would have shipped no table at all.
    const html = await injectRouterScript(DOC, { pagesDir: 'pages' } as any)

    expect(html).toContain('window.__stxRouterConfig=')
    expect(JSON.parse(html.match(/window\.__stxRouterConfig=(\{.*?\});/)![1]).ownedRoutes.length)
      .toBeGreaterThan(0)
  })

  it('omits the key entirely when nothing was discovered', async () => {
    // Absent means unknown. An empty array would read as "owns nothing" and
    // disable SPA navigation for the whole site.
    const html = await injectRouterScript(DOC, { pagesDir: 'no-such-dir' } as any)

    // Assert on the CONFIG, not the document: the router script itself
    // legitimately mentions the key when it reads it.
    const match = html.match(/window\.__stxRouterConfig=(\{.*?\});/)
    expect(match === null || JSON.parse(match[1]).ownedRoutes === undefined).toBe(true)
  })

  it('keeps the declared router options alongside them', async () => {
    const html = await injectRouterScript(DOC, {
      pagesDir: 'pages',
      router: { interceptAllLinks: true, container: '[data-stx-content]' },
    } as any)

    const config = JSON.parse(html.match(/window\.__stxRouterConfig=(\{.*?\});/)![1])
    expect(config.interceptAllLinks).toBe(true)
    expect(config.container).toBe('[data-stx-content]')
    expect(config.ownedRoutes.length).toBeGreaterThan(0)
  })
})
