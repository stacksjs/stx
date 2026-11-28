import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { compileDomainRoutes, matchDomain, requestHost, resolveDomainElsewhere, resolveDomainRoute } from '../src/domain-routes'
import { freePorts } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

/**
 * Domain routes: `{username}.example.com/` renders `example.com/{username}`.
 *
 * The resolver first, then a real serve() to show the route table sees the
 * routed path — the page's own params, a static page still beating the root
 * dynamic one, and every other path on the routed host left alone.
 */

setDefaultTimeout(60_000)

describe('compileDomainRoutes', () => {
  it('compiles {name} labels and literal ones, most specific first', () => {
    const routes = compileDomainRoutes({ '{username}.example.com': '/{username}', 'docs.example.com': '/docs' })
    expect(routes.map(route => route.pattern)).toEqual(['docs.example.com', '{username}.example.com'])
  })

  it('drops what cannot work, saying why', () => {
    const warnings: string[] = []
    const routes = compileDomainRoutes({
      'localhost': '/x',
      '{a}.example.com': 'no-slash',
      '{a}.example.com ': '/{b}',
      'bad_label.example.com': '/y',
    }, message => warnings.push(message))
    expect(routes).toEqual([])
    expect(warnings).toHaveLength(4)
    expect(warnings[2]).toContain('{b}')
  })

  it('discards invalid allowlist entries and keeps the host scoped', () => {
    const warnings: string[] = []
    const [route] = compileDomainRoutes({
      'status.example.com': { to: '/status/example', only: ['/*', '/assets/*', '/favicon.ico', 'https://example.com/assets'] },
    }, message => warnings.push(message))
    expect(route?.only).toEqual(['/assets/*', '/favicon.ico'])
    expect(warnings).toHaveLength(1)
  })
})

describe('resolveDomainRoute', () => {
  const routes = compileDomainRoutes({ '{username}.example.com': '/{username}', 'shop.example.com': '/store' })

  it('routes the root of a matching host to its page', () => {
    expect(resolveDomainRoute('chris.example.com', '/', routes)).toBe('/chris')
    expect(resolveDomainRoute('chris.example.com', '/index', routes)).toBe('/chris')
  })

  it('lets a literal host win over a parameterised one', () => {
    expect(resolveDomainRoute('shop.example.com', '/', routes)).toBe('/store')
  })

  it('leaves every other path, the apex and deeper hosts alone', () => {
    expect(resolveDomainRoute('chris.example.com', '/pricing', routes)).toBeNull()
    expect(resolveDomainRoute('chris.example.com', '/assets/app.js', routes)).toBeNull()
    expect(resolveDomainRoute('example.com', '/', routes)).toBeNull()
    expect(resolveDomainRoute('a.b.example.com', '/', routes)).toBeNull()
    expect(resolveDomainRoute('chris.example.org', '/', routes)).toBeNull()
  })

  it('captures only real DNS labels', () => {
    const [route] = compileDomainRoutes({ '{username}.example.com': '/{username}' })
    expect(matchDomain('-bad.example.com', route!)).toBeNull()
    expect(matchDomain('ok-1.example.com', route!)).toEqual({ username: 'ok-1' })
  })
})

describe('elsewhere', () => {
  const routes = compileDomainRoutes({ '{username}.example.com': { to: '/{username}', elsewhere: 'https://example.com/ignored-path' } })
  const asset = (pathname: string) => pathname.startsWith('/api/') || /\.[a-z0-9]+$/.test(pathname)

  it('keeps only the origin, and still routes the root', () => {
    expect(routes[0]!.elsewhere).toBe('https://example.com')
    expect(resolveDomainRoute('chris.example.com', '/', routes)).toBe('/chris')
  })

  it('sends the host\'s other pages to where the site lives, query and all', () => {
    expect(resolveDomainElsewhere('chris.example.com', '/pricing', '?a=1', routes, asset)).toBe('https://example.com/pricing?a=1')
    expect(resolveDomainElsewhere('chris.example.com', '/', '', routes, asset)).toBeNull()
  })

  it('answers assets and the API in place', () => {
    expect(resolveDomainElsewhere('chris.example.com', '/api/u/chris', '', routes, asset)).toBeNull()
    expect(resolveDomainElsewhere('chris.example.com', '/assets/app.js', '', routes, asset)).toBeNull()
  })

  it('leaves other hosts, and routes without elsewhere, alone', () => {
    expect(resolveDomainElsewhere('example.com', '/pricing', '', routes, asset)).toBeNull()
    const plain = compileDomainRoutes({ '{username}.example.com': '/{username}' })
    expect(resolveDomainElsewhere('chris.example.com', '/pricing', '', plain, asset)).toBeNull()
  })

  it('refuses an elsewhere that is not an http(s) origin', () => {
    const warnings: string[] = []
    expect(compileDomainRoutes({ '{u}.example.com': { to: '/{u}', elsewhere: 'javascript:alert(1)' } }, m => warnings.push(m))).toEqual([])
    expect(warnings[0]).toContain('elsewhere')
  })
})

describe('requestHost', () => {
  it('prefers the forwarded host, without its port, lowercased', () => {
    expect(requestHost(new Request('http://127.0.0.1:3000/', { headers: { 'host': '127.0.0.1:3000', 'x-forwarded-host': 'Chris.Example.com:443' } }))).toBe('chris.example.com')
    expect(requestHost(new Request('http://chris.example.com/'))).toBe('chris.example.com')
  })
})

describe('serve() with domains', () => {
  const [PORT, ELSEWHERE_PORT] = freePorts(2)
  const BASE = `http://127.0.0.1:${PORT}`
  const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')
  let dir: string
  let proc: ReturnType<typeof Bun.spawn> | null = null

  async function page(pathname: string, host?: string): Promise<{ status: number, text: string }> {
    const res = await fetch(`${BASE}${pathname}`, { headers: host ? { 'x-forwarded-host': host } : {} })
    return { status: res.status, text: await res.text() }
  }

  beforeAll(async () => {
    dir = createTempDir('stx-domain-routes-')
    await Bun.write(path.join(dir, 'views', 'index.stx'), '<main><p>page:home</p></main>\n')
    await Bun.write(path.join(dir, 'views', 'pricing.stx'), '<main><p>page:pricing</p></main>\n')
    await Bun.write(path.join(dir, 'views', 'status', '[slug]', 'incidents', '[id].stx'), '<main><p>page:incident</p></main>\n')
    await Bun.write(path.join(dir, 'public', 'status-assets', 'page.css'), '.status { color: black }\n')
    await Bun.write(path.join(dir, 'public', 'chunks', 'status.12.js'), '// public status chunk\n')
    await Bun.write(path.join(dir, 'public', 'chunks', 'status.other', 'app.js'), '// other app chunk\n')
    await Bun.write(path.join(dir, 'views', '[username].stx'), `<script server>
const route = useRoute()
const who = String(route.params?.username ?? '')
</script>
<main><p>page:profile:{{ who }}</p></main>
`)
    await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}
serve({
  patterns: ['views'],
  port: ${PORT},
  quiet: true,
  domains: {
    '{username}.example.com': '/{username}',
    'status.example.com': { to: '/support', only: ['/status-assets/*', '/status/support/incidents/*', '/chunks/status.*'] },
    'root-only.example.net': { to: '/support', only: [] },
  },
  onRequest(request) {
    const pathname = new URL(request.url).pathname
    if (pathname === '/api/health' || request.method === 'POST')
      return new Response('application handler')
    return null
  },
})
serve({ patterns: ['views'], port: ${ELSEWHERE_PORT}, quiet: true, domains: { '{username}.example.com': { to: '/{username}', elsewhere: 'https://example.com' } } })
`)
    await Bun.write(path.join(dir, 'public', 'robots.txt'), 'User-agent: *\n')
    proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })
    const deadline = Date.now() + 30_000
    while (true) {
      try {
        await fetch(`${BASE}/definitely-not-a-page.txt`)
        break
      }
      catch {
        if (Date.now() > deadline)
          throw new Error('serve() subprocess never came up')
        await Bun.sleep(150)
      }
    }
  })

  afterAll(async () => {
    proc?.kill()
    await rm(dir, { recursive: true, force: true })
  })

  it('renders the profile at the root of its host, with its own params', async () => {
    expect((await page('/', 'chris.example.com')).text).toContain('page:profile:chris')
  })

  it('renders the same page at its path on the main host', async () => {
    expect((await page('/chris')).text).toContain('page:profile:chris')
  })

  it('keeps a static page ahead of the root dynamic one', async () => {
    expect((await page('/pricing')).text).toContain('page:pricing')
  })

  it('with elsewhere, still renders the root, redirects other pages, and serves files in place', async () => {
    const ELSEWHERE = `http://127.0.0.1:${ELSEWHERE_PORT}`
    for (let i = 0; i < 100; i++) {
      try { await fetch(`${ELSEWHERE}/definitely-not-a-page.txt`); break }
      catch { await Bun.sleep(150) }
    }
    const host = { 'x-forwarded-host': 'chris.example.com' }
    expect(await (await fetch(`${ELSEWHERE}/`, { headers: host })).text()).toContain('page:profile:chris')
    const moved = await fetch(`${ELSEWHERE}/pricing?x=1`, { headers: host, redirect: 'manual' })
    expect([moved.status, moved.headers.get('location')]).toEqual([301, 'https://example.com/pricing?x=1'])
    expect((await fetch(`${ELSEWHERE}/robots.txt`, { headers: host, redirect: 'manual' })).status).toBe(200)
    // The client router cannot follow a cross-origin redirect, so it is told.
    const routed = await fetch(`${ELSEWHERE}/pricing`, { headers: { ...host, 'X-STX-Router': 'true' }, redirect: 'manual' })
    expect([routed.status, routed.headers.get('x-stx-location')]).toEqual([200, 'https://example.com/pricing'])
    expect(await (await fetch(`${ELSEWHERE}/pricing`)).text()).toContain('page:pricing')
  })

  it('serves only the bound page and its declared resources on a scoped domain', async () => {
    const host = 'status.example.com'
    expect((await page('/', host)).text).toContain('page:profile:support')
    expect((await page('/status/support/incidents/12', host)).text).toContain('page:incident')
    expect((await page('/status-assets/page.css', host)).text).toContain('.status')
    expect((await page('/chunks/status.12.js', host)).text).toContain('public status chunk')
    const hidden = ['/chunks/status.other/app.js', '/pricing', '/other-team', '/status/other-team/incidents/12', '/api/health', '/robots.txt', '/_stx/warmup', '/status-assets-private/app.css']
    for (const pathname of hidden)
      expect((await page(pathname, host)).status, pathname).toBe(404)
    expect((await page('/api/health')).text).toBe('application handler')
    expect((await page('/_stx/warmup')).status).toBe(200)
    expect((await page('/', 'root-only.example.net')).text).toContain('page:profile:support')
    expect((await page('/robots.txt', 'root-only.example.net')).status).toBe(404)
  })

  it('limits a scoped domain to GET and HEAD before the application callback', async () => {
    const headers = { 'x-forwarded-host': 'status.example.com' }
    expect((await fetch(`${BASE}/status-assets/page.css`, { headers, method: 'HEAD' })).status).toBe(200)
    expect((await fetch(`${BASE}/`, { headers, method: 'POST' })).status).toBe(404)
    expect((await fetch(`${BASE}/api/health`, { method: 'POST' })).status).toBe(200)
  })

  it('leaves the home page of the main host, and the other pages of the routed one, alone', async () => {
    expect((await page('/')).text).toContain('page:home')
    expect((await page('/pricing', 'chris.example.com')).text).toContain('page:pricing')
  })
})
