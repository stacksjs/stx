import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

/**
 * A router request from another layout is answered with the document, once.
 *
 * The router asked for a fragment, read in its headers that the page was on
 * another layout, and asked again for the whole document, so the page was
 * rendered twice for one click: two 1.25 MB renders and two lookups of the
 * same data on one app. The router now says which layout it is on, and the
 * server answers a page on another one with the document straight away,
 * still saying which layout that is.
 */

setDefaultTimeout(60_000)

const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')
const PORT = freePort()
const BASE = `http://localhost:${PORT}`

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

const layout = (name: string) => `<!DOCTYPE html>
<html lang="en">
<head><title>${name}</title></head>
<body>
  <nav id="${name}-nav">${name}</nav>
  <main>
    @yield('content')
  </main>
</body>
</html>
`

async function renders(): Promise<number> {
  return (await readFile(path.join(dir, 'renders.log'), 'utf8').catch(() => '')).length
}

function routerRequest(url: string, have?: { layout: string, group: string }): Promise<Response> {
  return fetch(`${BASE}${url}`, {
    headers: {
      'X-STX-Router': 'true',
      'Accept': 'text/html',
      ...(have ? { 'X-STX-Have-Layout': have.layout, 'X-STX-Have-Layout-Group': have.group } : {}),
    },
  })
}

beforeAll(async () => {
  dir = createTempDir('stx-layout-crossing-')
  await Bun.write(path.join(dir, 'layouts', 'app.stx'), layout('app'))
  await Bun.write(path.join(dir, 'layouts', 'marketing.stx'), layout('marketing'))
  await Bun.write(path.join(dir, 'views', 'brand.stx'), `@extends('layouts/app')
@section('content')
<script server>
require('node:fs').appendFileSync('renders.log', 'x')
</script>
<h1>Acme</h1>
@endsection
`)
  await Bun.write(path.join(dir, 'views', 'flow.stx'), `@extends('layouts/marketing')
@section('content')
<h1>Flow</h1>
@endsection
`)
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT}, quiet: true })
`)
  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })
  const deadline = Date.now() + 30_000
  while (true) {
    try {
      await fetch(`${BASE}/flow`)
      return
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
  await proc?.exited
  await rm(dir, { recursive: true, force: true })
})

describe('a router request for a page on another layout', () => {
  it('gets the document in one render, saying which layout it is', async () => {
    const before = await renders()
    const response = await routerRequest('/brand', { layout: 'layouts/marketing', group: 'marketing' })
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('X-STX-Fragment')).toBeNull()
    expect(response.headers.get('X-STX-Layout')).toBe('layouts/app')
    expect(response.headers.get('X-STX-Layout-Group')).toBe('app')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('id="app-nav"')
    expect(html).toContain('Acme')
    expect(await renders() - before).toBe(1)
  })

  it('names the headers that chose the body in Vary', async () => {
    const response = await routerRequest('/brand', { layout: 'layouts/marketing', group: 'marketing' })
    await response.text()
    const vary = response.headers.get('Vary') ?? ''
    expect(vary).toContain('X-STX-Router')
  })
})

describe('a router request within the same layout', () => {
  it('still gets a fragment', async () => {
    const response = await routerRequest('/brand', { layout: 'layouts/app', group: 'app' })
    const html = await response.text()
    expect(response.headers.get('X-STX-Fragment')).toBe('true')
    expect(response.headers.get('X-STX-Layout')).toBe('layouts/app')
    expect(html).not.toContain('<!DOCTYPE html>')
    expect(html).toContain('Acme')
  })
})

describe('a router that does not say its layout', () => {
  it('gets a fragment as before, and decides for itself', async () => {
    const response = await routerRequest('/brand')
    await response.text()
    expect(response.headers.get('X-STX-Fragment')).toBe('true')
    expect(response.headers.get('X-STX-Layout-Group')).toBe('app')
  })
})
