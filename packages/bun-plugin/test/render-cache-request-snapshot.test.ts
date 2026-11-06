import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createTempDir } from '../../stx/src/temp-dir'
import { freePort } from '../../stx/test-utils/test-port'

const SERVE = path.join(import.meta.dir, '../src/serve.ts')
const servers: Array<{ base: string, process: ReturnType<typeof Bun.spawn> }> = []
let directory = ''

beforeAll(async () => {
  directory = createTempDir('stx-render-input-snapshot-')
  await Bun.write(path.join(directory, 'views/cached.stx'), `<script server>
const marker = crypto.randomUUID()
const identity = cookies.identity || 'anonymous'
const language = __stxServeContext.request.headers.get('accept-language') || 'en'
const audience = __stxServeContext.audience
setResponseHeader('X-Frame-Options', 'SAMEORIGIN')
__stxServeContext.renderedFor = identity
</script>
<main data-marker="{{ marker }}">{{ identity }} {{ language }} {{ audience }} {{ ip }} {{ host }}</main>
`)
  await Bun.write(path.join(directory, 'views/header-view.stx'), `<script server>
const marker = crypto.randomUUID()
const authorization = __stxServeContext.request.headers.get('authorization')
const account = authorization === 'Bearer fixture-alpha' ? 'account-alpha' : 'account-bravo'
const language = __stxServeContext.request.headers.get('accept-language') || 'en'
</script>
<main data-marker="{{ marker }}">{{ account }} {{ language }}</main>
`)
  for (const name of ['private', 'private/[id]']) {
    await Bun.write(path.join(directory, 'views', `${name}.stx`), `<script server>
const marker = crypto.randomUUID()
setResponseHeader('cAcHe-CoNtRoL', 'private, no-store')
</script>
<main data-marker="{{ marker }}">private</main>
`)
  }
  await Bun.write(path.join(directory, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE)}
serve({
  patterns: ['views'],
  port: Number(process.env.FIXTURE_PORT),
  quiet: true,
  renderCache: true,
  renderCacheVary: process.env.FIXTURE_VARY === 'source' ? 'source' : 'request',
  clientAddress: request => request.headers.get('x-fixture-ip') || '127.0.0.1',
  onRequest: request => ({
    audience: request.headers.get('x-audience') || 'public',
    ...(request.headers.has('x-private') ? { responseHeaders: { 'Cache-Control': 'private, no-store' } } : {}),
  }),
})
`)
  for (const vary of ['request', 'source']) {
    const port = freePort()
    const child = Bun.spawn([process.execPath, 'driver.ts'], {
      cwd: directory,
      env: { ...Bun.env, FIXTURE_PORT: String(port), FIXTURE_VARY: vary },
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const base = `http://localhost:${port}`
    servers.push({ base, process: child })
    const deadline = Date.now() + 30_000
    while (true) {
      try {
        await fetch(`${base}/not-a-page`)
        break
      }
      catch {
        if (Date.now() > deadline) throw new Error('Render input fixture did not start')
        await Bun.sleep(100)
      }
    }
  }
})

afterAll(async () => {
  for (const server of servers) {
    server.process.kill()
    await server.process.exited
  }
  if (directory) await rm(directory, { recursive: true, force: true })
})

async function read(index: number, route: string, headers: Record<string, string> = {}) {
  // A browser retains its CSRF cookie. Without it, each fetch establishes a
  // different session and correctly receives a different request-cache key.
  const requestHeaders = new Headers(headers)
  if (!requestHeaders.get('cookie')?.includes('X-CSRF-Token='))
    requestHeaders.set('cookie', `X-CSRF-Token=${'a'.repeat(64)}; ${requestHeaders.get('cookie') ?? ''}`)
  const response = await fetch(`${servers[index].base}${route}`, { headers: requestHeaders })
  expect(response.status).toBe(200)
  const html = await response.text()
  const marker = /data-marker="([\w-]+)"/.exec(html)?.[1]
  expect(marker).toBeDefined()
  return { marker, html, headers: response.headers }
}

describe('render cache input snapshots', () => {
  test('reuses the input key after a template sets headers and adds render context', async () => {
    const first = await read(0, '/cached')
    const second = await read(0, '/cached')
    expect(second.marker).toBe(first.marker)
    expect(second.headers.get('x-frame-options')).toBe('SAMEORIGIN')
  })

  const boundaries: Array<[string, Record<string, string>]> = [
    ['cookie', { cookie: 'identity=bravo' }],
    ['language', { cookie: 'identity=alpha', 'accept-language': 'de' }],
    ['host', { cookie: 'identity=alpha', host: 'other.fixture.test' }],
    ['hook', { cookie: 'identity=alpha', 'x-audience': 'members' }],
    ['client address', { cookie: 'identity=alpha', 'x-fixture-ip': '192.0.2.2' }],
    ['CSRF session', { cookie: `identity=alpha; X-CSRF-Token=${'b'.repeat(64)}` }],
    ['authorization', { cookie: 'identity=alpha', authorization: 'Bearer synthetic-credential' }],
  ]
  for (const [name, headers] of boundaries) {
    test(`keeps the ${name} boundary`, async () => {
      const original = await read(0, '/cached', { cookie: 'identity=alpha' })
      expect((await read(0, '/cached', { cookie: 'identity=alpha' })).marker).toBe(original.marker)
      expect((await read(0, '/cached', headers)).marker).not.toBe(original.marker)
      expect(original.html).toContain('alpha')
    })
  }

  test('never reuses one authorization header’s rendered account for another', async () => {
    const alpha = await read(0, '/header-view', { authorization: 'Bearer fixture-alpha' })
    const bravo = await read(0, '/header-view', { authorization: 'Bearer fixture-bravo' })
    expect(alpha.html).toContain('account-alpha')
    expect(bravo.html).toContain('account-bravo')
    expect(bravo.html).not.toContain('account-alpha')
    expect(bravo.marker).not.toBe(alpha.marker)
  })

  test('varies a header-derived language even without configured route locales', async () => {
    const english = await read(0, '/header-view', { 'accept-language': 'en' })
    const german = await read(0, '/header-view', { 'accept-language': 'de' })
    expect(english.html).toContain('en</main>')
    expect(german.html).toContain('de</main>')
    expect(german.marker).not.toBe(english.marker)
  })

  for (const [index, mode] of ['request', 'source'].entries()) {
    test(`${mode}: never retains a rendered no-store response`, async () => {
      const first = await read(index, '/private')
      const second = await read(index, '/private')
      expect(second.marker).not.toBe(first.marker)
      expect(second.headers.get('cache-control')).toBe('private, no-store')
    })
  }

  test('does not retain a no-store dynamic source shell', async () => {
    const first = await read(1, '/private/one')
    const second = await read(1, '/private/two')
    expect(second.marker).not.toBe(first.marker)
  })

  test('honors a hook no-store response before reading an existing source entry', async () => {
    const publicPage = await read(1, '/cached')
    const privatePage = await read(1, '/cached', { 'x-private': '1' })
    expect(privatePage.marker).not.toBe(publicPage.marker)
    expect(privatePage.headers.get('cache-control')).toBe('private, no-store')
    expect((await read(1, '/cached')).marker).toBe(publicPage.marker)
  })

  test('a no-store request bypasses the source cache without replacing its public entry', async () => {
    const publicPage = await read(1, '/cached')
    const fresh = await read(1, '/cached', { 'cache-control': 'No-Store' })
    expect(fresh.marker).not.toBe(publicPage.marker)
    expect((await read(1, '/cached')).marker).toBe(publicPage.marker)
  })
})
