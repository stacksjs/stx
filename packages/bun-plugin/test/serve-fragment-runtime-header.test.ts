/**
 * Fragment responses declare whether the page needs the signals runtime
 * (stacksjs/stx#1827), end-to-end against a real serve() subprocess.
 *
 * The SPA router hands a navigation to a full page load when the current page
 * has no runtime and the incoming fragment needs one — otherwise the fragment
 * lands in a page that can never hydrate it. It used to decide that by hunting
 * for markers in the fragment markup, and every one of those markers comes from
 * a client script. A page whose reactivity is `:if` / `x-model` / `:disabled`
 * with no script anywhere emits none of them, so a real `<script server>`-only
 * login form was swapped in dead: the `x-cloak` the server stamped on it stayed,
 * and only the runtime removes that.
 *
 * The server is the one that decided to ship a runtime, so it says so. These
 * tests pin the header on the page shapes that motivated it — a runtime-less
 * content page must still say 'false', or the router full-reloads everywhere.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 43_000 + (process.pid % 1000)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

/** Fetch as the SPA router does, and report the fragment headers. */
async function fetchFragment(pathname: string) {
  const res = await fetch(`${BASE}${pathname}`, { headers: { 'X-STX-Router': 'true' } })
  return {
    isFragment: res.headers.get('X-STX-Fragment'),
    runtime: res.headers.get('X-STX-Runtime'),
    body: await res.text(),
  }
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-frag-runtime-'))

  // The reproducing shape: reactive bindings, no client script anywhere. The
  // server ships this page the runtime; the fragment carries no marker at all.
  await Bun.write(path.join(dir, 'views', 'login.stx'), `<script server>
const error = 'Invalid credentials'
const isLoading = false
</script>
<main>
  <form class="auth">
    <input type="email" x-model="email" placeholder="Email">
    <p :if="error">{{ error }}</p>
    <button type="submit" :disabled="isLoading">Sign in</button>
  </form>
</main>
`)

  // Ordinary prose. Must NOT claim to need a runtime — a false positive here
  // turns every navigation through a content site into a full page load.
  await Bun.write(path.join(dir, 'views', 'about.stx'), `<main>
  <h1>About</h1>
  <p>Plain content, no reactivity at all.</p>
</main>
`)

  // Documentation quoting directive syntax as literal content. Same rule.
  await Bun.write(path.join(dir, 'views', 'docs.stx'), `<main>
  <h1>The :if directive</h1>
  <pre><code>&lt;div :if="open"&gt;&lt;/div&gt;</code></pre>
  <p>Mail us at <a href="mailto:hi@stacks.test">hi@stacks.test</a>.</p>
</main>
`)

  // A page with a real client script — the shape the old marker sniff caught.
  await Bun.write(path.join(dir, 'views', 'counter.stx'), `<script client>
const count = state(0)
</script>
<main>
  <button @click="count.set(count() + 1)">inc</button>
  <span :text="count"></span>
</main>
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

describe('X-STX-Runtime on fragment responses', () => {
  it('declares true for a scriptless page whose reactivity is : and x- bindings', async () => {
    const { isFragment, runtime, body } = await fetchFragment('/login')

    expect(isFragment).toBe('true')
    expect(runtime).toBe('true')

    // The point of the header: none of the markers the router used to hunt for
    // are in this fragment, so it could not have worked this out on its own.
    for (const marker of ['__stx_setup_', 'data-stx-scope=', 'data-stx-reactive'])
      expect(body).not.toContain(marker)
  })

  it('agrees with the full page it was reduced from', async () => {
    // The header must describe the DESTINATION, and the runtime script lives in
    // <head> — which the fragment excludes by construction. Reading it off the
    // fragment would always say false.
    const full = await fetch(`${BASE}/login`).then(r => r.text())
    const { runtime } = await fetchFragment('/login')

    expect(full).toContain('data-stx-runtime')
    expect(runtime).toBe('true')
  })

  it('declares false for a page with no reactivity', async () => {
    const { runtime } = await fetchFragment('/about')
    expect(runtime).toBe('false')

    const full = await fetch(`${BASE}/about`).then(r => r.text())
    expect(full).not.toContain('data-stx-runtime')
  })

  it('declares true for a page with a client script', async () => {
    expect((await fetchFragment('/counter')).runtime).toBe('true')
  })

  it('sends the header on every fragment response, so absence means an old server', async () => {
    // The router falls back to its markup sniff when the header is missing.
    // That fallback only stays unreached if the header is unconditional.
    for (const route of ['/login', '/about', '/docs', '/counter'])
      expect((await fetchFragment(route)).runtime).toMatch(/^(?:true|false)$/)
  })

  it('reports what the page actually ships, including where that is too much', async () => {
    // The header is a report, not a judgement. /docs quotes `:if=` inside an
    // escaped <pre><code> sample and hasSignalsSyntax matches it, so the server
    // ships that page the full runtime it does not need — and the header says
    // so, because the router's question is "will a full load get me a runtime",
    // not "should this page have one".
    //
    // The cost is bounded: window.stx survives for the rest of the SPA session
    // once any runtime-shipping page has loaded, so at most one hand-off
    // follows. The over-shipping itself is upstream of this header and worth
    // fixing separately — a docs page paying ~159KB for a code sample.
    for (const route of ['/login', '/about', '/docs', '/counter']) {
      const full = await fetch(`${BASE}${route}`).then(r => r.text())
      expect((await fetchFragment(route)).runtime)
        .toBe(full.includes('data-stx-runtime') ? 'true' : 'false')
    }
  })
})
