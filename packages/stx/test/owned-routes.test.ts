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
import { getServeModuleBundle } from '../src/caching'
import { injectRouterScript } from '../src/runtime-injection'
import { createTempDir } from '../src/temp-dir'

let dir = ''
const originalCwd = process.cwd()

beforeEach(() => {
  dir = createTempDir('stx-owned-routes-')
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

// Served, the table is the same on every page of an app and nearly the whole
// config (25 KB of HQ's 25 KB). Inlined, every document carried it and no
// browser could cache it; linked by content, it is fetched once.
describe('what a served page links', () => {
  const DOC = '<html><body><main>x</main></body></html>'
  const SERVE = { pagesDir: 'pages', buildMode: 'serve', router: { container: 'main', interceptAllLinks: true } } as any

  /** What the linked table script sets, run against a fresh window. */
  function ownedRoutesFrom(html: string): string[] {
    const src = html.match(/<script data-stx-owned-routes src="\/_stx\/modules\.([0-9a-f]{16})\.js"><\/script>/)
    expect(src).not.toBeNull()
    const code = getServeModuleBundle(src![1])
    expect(code).toBeDefined()
    const window: Record<string, any> = { __stxRouterConfig: { container: 'main' } }
    new Function('window', code!)(window)
    expect(window.__stxRouterConfig.container).toBe('main')
    return window.__stxRouterConfig.ownedRoutes
  }

  it('links the table instead of inlining it, with the same matchers', async () => {
    const inline = JSON.parse((await injectRouterScript(DOC, { pagesDir: 'pages' } as any)).match(/window\.__stxRouterConfig=(\{.*?\});/)![1]).ownedRoutes
    const html = await injectRouterScript(DOC, SERVE)

    const config = JSON.parse(html.match(/window\.__stxRouterConfig=(\{.*?\});/)![1])
    expect(config.ownedRoutes).toBeUndefined()
    expect(config.interceptAllLinks).toBe(true)
    expect(ownedRoutesFrom(html)).toEqual(inline)
  })

  it('sets the table before the router reads its config', async () => {
    const html = await injectRouterScript(DOC, SERVE)
    const config = html.indexOf('window.__stxRouterConfig=')
    const table = html.indexOf('data-stx-owned-routes')
    const router = html.indexOf('data-stx-router')
    expect(config).toBeGreaterThanOrEqual(0)
    expect(table).toBeGreaterThan(config)
    expect(router).toBeGreaterThan(table)
  })

  it('names the table by its content, so every page links the same file', async () => {
    const link = (html: string) => html.match(/data-stx-owned-routes src="([^"]+)"/)![1]
    const first = link(await injectRouterScript(DOC, SERVE))
    const second = link(await injectRouterScript('<html><body><p>other</p></body></html>', SERVE))
    expect(second).toBe(first)
  })

  it('sets up the config itself when nothing else declared one', async () => {
    const html = await injectRouterScript(DOC, { pagesDir: 'pages', buildMode: 'serve' } as any)
    const src = html.match(/data-stx-owned-routes src="\/_stx\/modules\.([0-9a-f]{16})\.js"/)![1]
    const window: Record<string, any> = {}
    new Function('window', getServeModuleBundle(src)!)(window)
    expect(window.__stxRouterConfig.ownedRoutes.length).toBeGreaterThan(0)
  })
})

describe('discovering in a project whose pages sit under a root', () => {
  // A Stacks app: stx infers root `resources` and pagesDir `views`, so the
  // pages are resources/views, not ./views.
  beforeEach(() => {
    fs.mkdirSync(path.join(dir, 'resources', 'views', 'blog'), { recursive: true })
    fs.mkdirSync(path.join(dir, 'resources', 'layouts'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'resources', 'views', 'index.stx'), '<main>Home</main>\n')
    fs.writeFileSync(path.join(dir, 'resources', 'views', 'about.stx'), '<main>About</main>\n')
    fs.writeFileSync(path.join(dir, 'resources', 'views', 'blog', '[slug].stx'), '<main>Post</main>\n')
  })

  it('resolves pagesDir against the root, the way the config states it', async () => {
    const sources = await getOwnedRouteMatchers('views', 'resources')

    expect(owns(sources, '/about')).toBe(true)
    expect(owns(sources, '/blog/both-halves')).toBe(true)
  })

  it('leaves the committed route manifest alone', async () => {
    // What a project commits, and what discovery used to overwrite on every
    // render: with the root ignored it found nothing, and wrote that.
    const stateDir = path.join(dir, 'state')
    fs.mkdirSync(stateDir)
    const manifest = '// the committed manifest\n'
    fs.writeFileSync(path.join(stateDir, 'routes.ts'), manifest)

    const previous = process.env.STX_DIR
    process.env.STX_DIR = stateDir
    try {
      await getOwnedRouteMatchers('views', 'resources')
      await getOwnedRouteMatchers('views', '.')
    }
    finally {
      if (previous === undefined)
        delete process.env.STX_DIR
      else
        process.env.STX_DIR = previous
    }

    expect(fs.readFileSync(path.join(stateDir, 'routes.ts'), 'utf8')).toBe(manifest)
    expect(fs.existsSync(path.join(stateDir, 'route-types.d.ts'))).toBe(false)
  })
})
