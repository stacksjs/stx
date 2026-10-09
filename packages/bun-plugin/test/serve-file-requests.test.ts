/**
 * A root dynamic page does not answer requests for files.
 *
 * An app with `views/[username].stx` (a profile at `/chris`) rendered that
 * page - with its database lookup, its layout and 80KB of HTML - for
 * `/favicon.ico`, `/apple-touch-icon.png`, `/foo.txt` and every
 * `/wp-login.php` a scanner sent, because `[username]` matched any one
 * segment. A request whose last segment names a file (see stx-router's
 * file-requests.ts) is never captured by a final `[param]`, and when nothing
 * in `publicDir` answers it, it gets a plain `404 Not Found`.
 *
 * Run as production (the server Stacks deploys), so the 404 page that would
 * otherwise render is the custom one, and the dev-only favicon 204 is off.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'
import { buildDynamicRouteRegexes } from '../src/serve'

setDefaultTimeout(60_000)

const PORT = freePort()
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-file-requests-'))

  await Bun.write(path.join(dir, 'views', '[username].stx'), `<p>PROFILE:{{ params.username }}</p>\n`)
  await Bun.write(path.join(dir, 'views', 'about.stx'), `<p>ABOUT</p>\n`)
  await Bun.write(path.join(dir, 'views', '404.stx'), `<p>CUSTOM-404</p>\n`)
  await Bun.write(path.join(dir, 'views', 'docs', '[...slug].stx'), `<p>DOCS:{{ params.slug }}</p>\n`)
  await Bun.write(path.join(dir, 'public', 'robots.txt'), 'User-agent: *\n')

  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], publicDir: 'public', port: ${PORT}, quiet: true })
`)

  proc = Bun.spawn(['bun', path.join(dir, 'driver.ts')], {
    cwd: dir,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, NODE_ENV: 'production', APP_ENV: 'production' },
  })

  for (let i = 0; i < 100; i++) {
    try {
      await fetch(`${BASE}/about`)
      break
    }
    catch {
      await Bun.sleep(100)
    }
  }
})

afterAll(async () => {
  proc?.kill()
  await rm(dir, { recursive: true, force: true })
})

describe('a root [username] page and file requests', () => {
  it('still renders the page for a username', async () => {
    const res = await fetch(`${BASE}/chris`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('PROFILE:chris')
  })

  it('still renders the page for a username with a dot in it', async () => {
    const res = await fetch(`${BASE}/john.doe`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('PROFILE:john.doe')
  })

  it('answers a missing file with a plain 404, not the page or the 404 page', async () => {
    for (const file of ['/favicon.ico', '/apple-touch-icon.png', '/wp-login.php', '/foo.txt']) {
      const res = await fetch(`${BASE}${file}`)
      const body = await res.text()
      expect({ file, status: res.status }).toEqual({ file, status: 404 })
      expect(res.headers.get('content-type')).toStartWith('text/plain')
      expect(body).toBe('Not Found')
    }
  })

  it('still serves a file that publicDir really has', async () => {
    const res = await fetch(`${BASE}/robots.txt`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('User-agent: *\n')
  })

  it('leaves static pages alone', async () => {
    const res = await fetch(`${BASE}/about`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('ABOUT')
  })

  it('keeps the custom 404 page for a page-shaped miss', async () => {
    const res = await fetch(`${BASE}/about/missing`)
    // No route has two segments under /about, so this is a page-shaped miss:
    // that one still gets the app's own 404 page.
    expect(res.status).toBe(404)
    expect(await res.text()).toContain('CUSTOM-404')
  })

  it('lets a catch-all keep paths with dots, which is what a catch-all is for', async () => {
    for (const [request, slug] of [['/docs/guide.md', 'guide.md'], ['/docs/v1.2', 'v1.2'], ['/docs/src/index.ts', 'src/index.ts']]) {
      const res = await fetch(`${BASE}${request}`)
      expect({ request, status: res.status }).toEqual({ request, status: 200 })
      expect(await res.text()).toContain(`DOCS:${slug}`)
    }
  })
})

describe('buildDynamicRouteRegexes — the final [param] refuses a file name', () => {
  it('guards the segment that ends the route', () => {
    const [regex] = buildDynamicRouteRegexes('[username]')
    expect(regex!.test('chris')).toBe(true)
    expect(regex!.test('john.doe')).toBe(true)
    expect(regex!.test('favicon.ico')).toBe(false)
    expect(regex!.test('wp-login.php')).toBe(false)
  })

  it('does not guard a param followed by more route', () => {
    const [regex] = buildDynamicRouteRegexes('[owner]/[repository]/settings')
    expect('acme/three.js/settings'.match(regex!)?.slice(1)).toEqual(['acme', 'three.js'])
  })

  it('guards the /index-stripped and pages/-stripped variants too', () => {
    for (const regex of buildDynamicRouteRegexes('pages/users/[id]/index')) {
      expect(regex.test('favicon.ico')).toBe(false)
      expect(regex.test('users/favicon.ico')).toBe(false)
    }
    expect(buildDynamicRouteRegexes('pages/users/[id]/index').some(regex => regex.test('users/42'))).toBe(true)
  })

  it('exempts a catch-all', () => {
    const [regex] = buildDynamicRouteRegexes('docs/[...slug]')
    expect(regex!.test('docs/guide.md')).toBe(true)
    expect(regex!.test('docs/logo.png')).toBe(true)
  })
})
