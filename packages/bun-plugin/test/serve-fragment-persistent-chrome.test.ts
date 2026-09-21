/**
 * A fragment leaves the layout chrome's component scripts out
 * (stacksjs/stx#1958), end-to-end against a real serve() subprocess.
 *
 * A fragment is only swapped in when the layout is unchanged, so the chrome it
 * leaves out is the chrome already on screen: the layout's components are
 * still set up and bound there. Carrying their scripts made the router set
 * each of them up a second time on every navigation, an instance the markup
 * never saw. The page's own components are inside the container and must
 * still arrive with it.
 *
 * serve.ts assembles its fragments itself rather than through stx's
 * extractContainerContent, so it carries its own copy of the test.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 45_600 + (process.pid % 600)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

async function fetchPage(pathname: string, spa: boolean): Promise<{ isFragment: string | null, body: string }> {
  const res = await fetch(`${BASE}${pathname}`, spa ? { headers: { 'X-STX-Router': 'true' } } : {})
  return { isFragment: res.headers.get('X-STX-Fragment'), body: await res.text() }
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-frag-chrome-'))

  // The layout's chrome: a component tag, an @include and a component with
  // no signals, each marking its script with a sentinel.
  await Bun.write(path.join(dir, 'components', 'Nav.stx'), `<script client>
const navOpen = state(false)
window.NAV_SETUP = true
</script>
<div class="nav">{{ navOpen() }}</div>
`)
  await Bun.write(path.join(dir, 'partials', 'sheet.stx'), `<script client>
const sheetOpen = state(false)
window.SHEET_SETUP = true
</script>
<div class="sheet">{{ sheetOpen() }}</div>
`)
  await Bun.write(path.join(dir, 'components', 'Plain.stx'), `<script client>
window.PLAIN_RUN = true
</script>
<div class="plain">plain</div>
`)
  // The page's own component.
  await Bun.write(path.join(dir, 'components', 'Card.stx'), `<script client>
const cardOpen = state(false)
window.CARD_SETUP = true
</script>
<div class="card">{{ cardOpen() }}</div>
`)
  await Bun.write(path.join(dir, 'layouts', 'default.stx'), `<!DOCTYPE html>
<html lang="en">
<head><title>Chrome</title></head>
<body>
  <nav><Nav />@include('sheet')<Plain /></nav>
  <main>
    @yield('content')
  </main>
</body>
</html>
`)
  await Bun.write(path.join(dir, 'views', 'one.stx'), `@extends('layouts/default')
@section('content')
<h1>One</h1>
<Card />
@endsection
`)
  // No container anywhere: every script counts as outside it, the page's
  // own component included, so nothing may be dropped.
  await Bun.write(path.join(dir, 'views', 'bare.stx'), `<div class="bare">
  <h1>Bare</h1>
  <Card />
</div>
`)

  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT} })
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

describe('fragments and the layout chrome (#1958)', () => {
  it('the whole document carries every component script', async () => {
    const { body } = await fetchPage('/one', false)
    for (const sentinel of ['NAV_SETUP', 'SHEET_SETUP', 'PLAIN_RUN', 'CARD_SETUP'])
      expect({ sentinel, present: body.includes(sentinel) }).toEqual({ sentinel, present: true })
  })

  it('a fragment leaves out the chrome\'s component scripts and keeps the page\'s', async () => {
    const { isFragment, body } = await fetchPage('/one', true)
    expect(isFragment).toBe('true')
    expect(body).toContain('<h1>One</h1>')
    expect({
      nav: body.includes('NAV_SETUP'),
      sheet: body.includes('SHEET_SETUP'),
      plain: body.includes('PLAIN_RUN'),
      card: body.includes('CARD_SETUP'),
    }).toEqual({ nav: false, sheet: false, plain: false, card: true })
  })

  it('a page with no container drops nothing', async () => {
    const { body } = await fetchPage('/bare', true)
    expect(body).toContain('CARD_SETUP')
  })
})
