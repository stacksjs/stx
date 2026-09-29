/**
 * A page's module bundle is served as a file, end to end against a real
 * serve() subprocess.
 *
 * Inlined, the bundle travelled in the page and in every SPA fragment of it,
 * so a phone re-downloaded and re-parsed it (up to ~250KB) on each navigation
 * and could cache none of it. Serve mode now links it under a content hash and
 * answers that URL immutably.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 46_800 + (process.pid % 600)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-module-file-'))
  await Bun.write(path.join(dir, 'lib', 'greeting.ts'), `export const GREETING = 'module-bundle-marker'\n`)
  await Bun.write(path.join(dir, 'components', 'Hello.stx'), `<p id="hello">hello</p>
<script client>
import { GREETING } from '../lib/greeting'
window.__greeting = GREETING
</script>
`)
  await Bun.write(path.join(dir, 'layouts', 'default.stx'), `<!DOCTYPE html>
<html lang="en">
<head><title>Bundle</title></head>
<body>
  <main>
    @yield('content')
  </main>
</body>
</html>
`)
  await Bun.write(path.join(dir, 'views', 'hello.stx'), `@extends('layouts/default')
@section('content')
<Hello />
@endsection
`)
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT}, componentsDir: 'components' })
`)

  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })
  const deadline = Date.now() + 30_000
  while (true) {
    try {
      await fetch(`${BASE}/definitely-not-a-page`)
      break
    }
    catch {
      if (Date.now() > deadline)
        throw new Error('serve() did not start')
      await Bun.sleep(100)
    }
  }
})

afterAll(async () => {
  proc?.kill()
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

const bundleUrl = (html: string): string | undefined => html.match(/<script\b[^>]*data-stx-modules[^>]*src="(\/_stx\/modules\.[0-9a-f]{16}\.js)"/)?.[1]

describe('the page module bundle as a file', () => {
  it('links the bundle instead of inlining it, and serves it immutably', async () => {
    const html = await (await fetch(`${BASE}/hello`)).text()
    const url = bundleUrl(html)
    expect(url).toBeDefined()
    expect(html).not.toContain('module-bundle-marker')

    const res = await fetch(`${BASE}${url}`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('javascript')
    expect(res.headers.get('cache-control')).toContain('immutable')
    expect(await res.text()).toContain('module-bundle-marker')
  })

  it('links the same file from the SPA fragment, which the router loads before the page scripts', async () => {
    const full = await (await fetch(`${BASE}/hello`)).text()
    const fragment = await (await fetch(`${BASE}/hello`, { headers: { 'X-STX-Router': 'true' } })).text()
    expect(bundleUrl(fragment)).toBe(bundleUrl(full))
    expect(fragment).not.toContain('module-bundle-marker')
  })

  it('answers a hash it never produced with a 404, not a cached page', async () => {
    const res = await fetch(`${BASE}/_stx/modules.0123456789abcdef.js`)
    expect(res.status).toBe(404)
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})
