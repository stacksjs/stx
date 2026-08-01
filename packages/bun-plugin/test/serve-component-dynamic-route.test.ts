/**
 * A component's `<script server>` doing async work, across route kinds.
 *
 * Three shapes that look interchangeable and are easy to assume are:
 *
 *   static route  + component + await
 *   dynamic route + view      + await
 *   dynamic route + component + await
 *
 * All three work. They are pinned because when one of them silently stops
 * working the symptom is not an error: a component whose data never arrives
 * renders its own empty-state branch, so the page looks like a correct answer
 * rather than a failure, and nothing is logged.
 */

import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 43_100 + (process.pid % 700)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

function parseProbe(html: string): Record<string, unknown> {
  const m = html.match(/PROBE::(.*?)::END/s)
  if (!m)
    throw new Error(`no probe marker in response:\n${html.slice(0, 500)}`)
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-comp-dyn-'))

  // A component that does async work and reports what it got back. Bun.sleep
  // stands in for the database round trip that first showed this.
  await Bun.write(path.join(dir, 'components', 'AsyncProbe.stx'), `<script server>
const label = String(who)
await Bun.sleep(1)
const loaded = await Promise.resolve('loaded-' + label)
const probeJson = JSON.stringify({ label, loaded })
</script>
<div>PROBE::{{ probeJson }}::END</div>
`)

  // Static route rendering that component.
  await Bun.write(path.join(dir, 'views', 'static-host.stx'), `<AsyncProbe who="alpha" />
`)

  // Dynamic route rendering the same component.
  await Bun.write(path.join(dir, 'views', 'dyn', '[slug].stx'), `<AsyncProbe who="{{ params.slug }}" />
`)

  // Dynamic route doing the same async work in the view itself, as the control.
  await Bun.write(path.join(dir, 'views', 'inline', '[slug].stx'), `<script server>
const label = String(params.slug)
await Bun.sleep(1)
const loaded = await Promise.resolve('loaded-' + label)
const probeJson = JSON.stringify({ label, loaded })
</script>
<div>PROBE::{{ probeJson }}::END</div>
`)

  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT} })
`)

  proc = Bun.spawn(['bun', path.join(dir, 'driver.ts')], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })

  for (let i = 0; i < 100; i++) {
    try {
      await fetch(`${BASE}/static-host`)
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

describe('component <script server> across route kinds', () => {
  it('resolves async work in a component on a static route', async () => {
    const probe = parseProbe(await (await fetch(`${BASE}/static-host`)).text())

    expect(probe.label).toBe('alpha')
    expect(probe.loaded).toBe('loaded-alpha')
  })

  it('resolves async work in the view of a dynamic route', async () => {
    const probe = parseProbe(await (await fetch(`${BASE}/inline/bravo`)).text())

    expect(probe.label).toBe('bravo')
    expect(probe.loaded).toBe('loaded-bravo')
  })

  /**
   * The combination most likely to be missed: a component, on a dynamic route,
   * whose value comes from behind an await. Both the prop binding and the
   * resolved value have to survive.
   */
  it('resolves async work in a component on a dynamic route', async () => {
    const probe = parseProbe(await (await fetch(`${BASE}/dyn/charlie`)).text())

    expect(probe.label).toBe('charlie')
    expect(probe.loaded).toBe('loaded-charlie')
  })
})
