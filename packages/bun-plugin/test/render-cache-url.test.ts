import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

/**
 * `renderCacheVary: 'url'`: one render per address, shared by every visitor.
 *
 * The two older modes both fail a server-rendered public site. `request`
 * folds the cookies and the client address into the key, so a first visit is
 * always a miss. `source` keeps one render per route file, so a `[slug].stx`
 * that looks its slug up would answer every slug with the first one rendered.
 */

const PORT = freePort()
const BASE = `http://localhost:${PORT}`
const SERVE_SOURCE = path.join(import.meta.dir, '..', 'src', 'serve.ts')
const STX_SOURCE = path.join(import.meta.dir, '..', '..', 'stx', 'src', 'index.ts')

let fixtureDir = ''
let server: ReturnType<typeof Bun.spawn> | null = null

async function get(pathname: string, headers: Record<string, string> = {}): Promise<string> {
  const response = await fetch(`${BASE}${pathname}`, { headers })
  expect(response.status).toBe(200)
  return await response.text()
}

function marker(html: string): string {
  const found = /marker:([0-9a-f-]{36})/.exec(html)?.[1]
  if (!found) throw new Error(`no render marker in ${html.slice(0, 200)}`)
  return found
}

beforeAll(async () => {
  fixtureDir = createTempDir('stx-render-cache-url-')
  await Bun.write(path.join(fixtureDir, 'views', 'index.stx'), `<script server>
const marker = crypto.randomUUID()
const outcome = typeof query !== 'undefined' && query && query.outcome ? String(query.outcome) : 'none'
</script>
<main>marker:{{ marker }} outcome:{{ outcome }}</main>
`)
  await Bun.write(path.join(fixtureDir, 'views', 'post', '[slug].stx'), `<script server>
const marker = crypto.randomUUID()
const titles = { first: 'The first post', second: 'The second post' }
const title = titles[params.slug]
if (!title) notFound()
</script>
<main>marker:{{ marker }} title:{{ title }}</main>
`)
  await Bun.write(path.join(fixtureDir, 'views', 'account.stx'), `<script server>
definePageMeta({ cache: false })
const marker = crypto.randomUUID()
</script>
<main>marker:{{ marker }}</main>
`)
  await Bun.write(path.join(fixtureDir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SOURCE)}
import * as stx from ${JSON.stringify(STX_SOURCE)}

serve({
  patterns: ['views'],
  port: ${PORT},
  quiet: true,
  stxModule: stx,
  renderCache: true,
  renderCacheVary: 'url',
})
`)
  server = Bun.spawn(['bun', 'driver.ts'], { cwd: fixtureDir, stdout: 'pipe', stderr: 'pipe' })

  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/account`)
      if (response.ok) return
    }
    catch { /* not listening yet */ }
    await Bun.sleep(100)
  }
  throw new Error('render-cache-url fixture server did not start')
})

afterAll(async () => {
  server?.kill()
  await server?.exited
  await rm(fixtureDir, { recursive: true, force: true })
})

describe('render cache keyed by address', () => {
  test('one render answers every visitor to an address, whatever they send with the request', async () => {
    const first = marker(await get('/'))
    expect(marker(await get('/', { 'cookie': 'visitor=someone-else', 'x-forwarded-for': '203.0.113.9' }))).toBe(first)
    expect(marker(await get('/', { 'accept-language': 'de' }))).toBe(first)
  })

  test('a query string is part of the address, so a page that reads it is never answered by another query\'s render', async () => {
    const plain = await get('/')
    const invalid = await get('/?outcome=invalid')
    expect(plain).toContain('outcome:none')
    expect(invalid).toContain('outcome:invalid')
    expect(marker(invalid)).not.toBe(marker(plain))
    expect(marker(await get('/?outcome=invalid'))).toBe(marker(invalid))
    expect(await get('/')).toContain('outcome:none')
  })

  test('a dynamic route keeps one render per record, never one record\'s page for another', async () => {
    const first = await get('/post/first')
    const second = await get('/post/second')
    expect(first).toContain('title:The first post')
    expect(second).toContain('title:The second post')
    expect(marker(await get('/post/first', { cookie: 'visitor=another' }))).toBe(marker(first))
    expect(marker(await get('/post/second'))).toBe(marker(second))
    expect(marker(first)).not.toBe(marker(second))
  })

  test('an address that does not exist is answered and not kept', async () => {
    const response = await fetch(`${BASE}/post/missing`)
    expect(response.status).toBe(404)
    await response.arrayBuffer()
    expect((await fetch(`${BASE}/post/missing`)).status).toBe(404)
    expect(await get('/post/first')).toContain('title:The first post')
  })

  test('a page that opts out renders for each request', async () => {
    expect(marker(await get('/account'))).not.toBe(marker(await get('/account')))
  })
})
