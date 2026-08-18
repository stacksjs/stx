import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * A component can see the request it is part of serving.
 *
 * `__stxServeContext` was filtered out on the way into a component, along with
 * every other `__`-prefixed key - a rule meant to stop internals leaking
 * downward, applied to the one key that is not an internal. So a component
 * asking which path it was rendering for got nothing, and `useRoute()` got
 * nothing either, since it reads the same key.
 *
 * The failure is quiet: reading `.path` off it yields '' rather than throwing,
 * so a component that builds a URL from the request builds a wrong one and
 * nothing reports anything. A repository browser deciding where a moved handle
 * should redirect to sent every deep link to the repository root, because the
 * only path it could see was the one it reconstructed from its own props.
 */

setDefaultTimeout(60_000)

const PORT = 43_900 + (process.pid % 200)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-serve-compreq-'))

  // Reports what it can see, so a regression names which half broke.
  await Bun.write(path.join(dir, 'components', 'WhereAmI.stx'), `<script server>
const ctx = typeof __stxServeContext === 'object' && __stxServeContext ? __stxServeContext : null
const route = useRoute()
const seen = [
  'ctx:' + (ctx ? String(ctx.path) : 'MISSING'),
  'route:' + String(route.path),
  'query:' + String(route.query.q ?? ''),
].join(' ')
</script>
<pre id="seen">{{ seen }}</pre>
`)

  // Nested one level down, because the filter runs on every component render
  // and a fix that only reached the first level would still lose it here.
  await Bun.write(path.join(dir, 'components', 'Outer.stx'), `<WhereAmI />`)

  await Bun.write(path.join(dir, 'views', 'deep', '[id].stx'), `<script server>
const pagePath = String(__stxServeContext?.path ?? 'MISSING')
</script>
<main>
  <pre id="page">page:{{ pagePath }}</pre>
  <WhereAmI />
</main>
`)

  await Bun.write(path.join(dir, 'views', 'nested.stx'), `<main><Outer /></main>`)

  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({
  patterns: ['views'],
  componentsDir: 'components',
  port: ${PORT},
})
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
        throw new Error('serve() never came up')
      await Bun.sleep(120)
    }
  }
})

afterAll(async () => {
  proc?.kill()
  await rm(dir, { recursive: true, force: true })
})

describe('a component and the request', () => {
  it('sees the same path the page around it sees', async () => {
    const body = await (await fetch(`${BASE}/deep/anything`)).text()

    expect(body).toContain('page:/deep/anything')
    expect(body).toContain('ctx:/deep/anything')
  })

  it('reaches it through useRoute() too, which reads the same key', async () => {
    const body = await (await fetch(`${BASE}/deep/anything?q=hello`)).text()

    expect(body).toContain('route:/deep/anything')
    expect(body).toContain('query:hello')
  })

  it('still has it one component deeper', async () => {
    const body = await (await fetch(`${BASE}/nested`)).text()

    expect(body).toContain('ctx:/nested')
    expect(body).not.toContain('ctx:MISSING')
  })
})
