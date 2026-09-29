/**
 * A fragment's page styles leave the styles inside scripts alone,
 * end-to-end against a real serve() subprocess.
 *
 * serve.ts collects a fragment's styles from the <head> and from the body
 * before the container with a regex, and the scripts were still in that HTML.
 * A web component whose shadow-DOM CSS is a string in its bundle (a video
 * player's controls: `:host {…} button { width: 40px; height: 40px }`) had
 * that CSS shipped as a page style, which the router puts in <head>: every
 * button in the document shrank to 40px, but only on pages reached by
 * navigation, since a full load parses the script correctly.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 46_200 + (process.pid % 600)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

const COMPONENT = 'customElements.define("x-player", class extends HTMLElement { connectedCallback() { this.attachShadow({ mode: "open" }).innerHTML = "<style>:host { display: flex } button { width: 40px; height: 40px }</style><button>Play</button>" } })'

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-frag-script-styles-'))
  await Bun.write(path.join(dir, 'layouts', 'default.stx'), `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Player</title>
  <style>.head-style { color: red }</style>
  <script type="module">${COMPONENT}</script>
</head>
<body>
  <style>.stacked-style { color: blue }</style>
  <script type="module">${COMPONENT.replace('x-player', 'x-other')}</script>
  <main>
    @yield('content')
  </main>
</body>
</html>
`)
  await Bun.write(path.join(dir, 'views', 'player.stx'), `@extends('layouts/default')
@section('content')
<h1>Player</h1>
<button>Save</button>
@endsection
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

/** The fragment's top-level <style> blocks: what the router will put in <head>. */
function pageStyles(html: string): string[] {
  const outside = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  return [...outside.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1])
}

describe('fragment styles and the styles inside scripts', () => {
  it('ships the page\'s own styles, from the head and before the container', async () => {
    const res = await fetch(`${BASE}/player`, { headers: { 'X-STX-Router': 'true' } })
    expect(res.headers.get('X-STX-Fragment')).toBe('true')
    const styles = pageStyles(await res.text())
    expect(styles.some(css => css.includes('.head-style'))).toBe(true)
    expect(styles.some(css => css.includes('.stacked-style'))).toBe(true)
  })

  it('does not ship a script\'s CSS as a page style', async () => {
    const res = await fetch(`${BASE}/player`, { headers: { 'X-STX-Router': 'true' } })
    const styles = pageStyles(await res.text())
    expect(styles.filter(css => css.includes(':host') || css.includes('40px'))).toEqual([])
  })
})
