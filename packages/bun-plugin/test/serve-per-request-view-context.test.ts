/**
 * What a per-request view's template actually receives from its `<script server>`.
 *
 * Two reports, both against the served dev path rather than `stx build`, and
 * both invisible from the outside: the page renders its whole layout, returns
 * 200, and only some values are missing, which reads as a data problem.
 *
 *   - stacksjs/stacks#2390: values a top-level `await` produced, and values
 *     returned by a function imported from the app, arrived empty on a view
 *     that renders per request (a dynamic route, or a static one that reads
 *     `query`). The same code on a render-once view was fine, which is what
 *     made it slow to find.
 *
 *   - stacksjs/stacks#2392: a view-model property named `slug` specifically
 *     rendered empty, including through a partial, while every sibling
 *     property on the same object rendered.
 *
 * Neither reproduces now. These pin the behaviour across all four shapes the
 * reports name so it cannot regress back into silence: the failure mode has no
 * error, no warning and no log line to notice.
 */

import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 43_900 + (process.pid % 90)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

function parseProbe(html: string): Record<string, unknown> {
  const marker = html.match(/PROBE::(.*?)::END/s)
  if (!marker)
    throw new Error(`no probe marker in response:\n${html.slice(0, 500)}`)
  const json = marker[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')

  try {
    return JSON.parse(json)
  }
  catch {
    // An empty payload is the failure under test: the script ran, the marker
    // rendered, and the value it should have carried is gone. Say that rather
    // than reporting a JSON parse error.
    throw new Error(`probe payload did not parse, which is the bug: ${JSON.stringify(json.slice(0, 400))}`)
  }
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-per-request-'))

  // The app module. `slug` is a property here, not a bare binding — #2392's
  // reading was that the dev path resolved the NAME rather than the member
  // access, so a `slug` property has to be checked against a sibling that
  // cannot be confused with anything ambient.
  await Bun.write(path.join(dir, 'lib', 'places.ts'), `export interface Place { slug: string, name: string, cuisine: string }

export async function placeBySlug(slug: string): Promise<Place> {
  await Bun.sleep(1)
  return { slug, name: 'Place ' + slug, cuisine: 'Italian' }
}

export function viewModel(place: Place): Place & { label: string } {
  return { ...place, label: place.name + ' (' + place.slug + ')' }
}
`)

  const probeScript = (slugExpr: string, libPath = '../lib/places'): string => `<script server>
import { placeBySlug, viewModel } from '${libPath}'

const probeSync = 'sync:' + ${slugExpr}
const probeAwait = await Promise.resolve('await:' + ${slugExpr})
const vm = viewModel(await placeBySlug(${slugExpr}))
const probeJson = JSON.stringify({ probeSync, probeAwait, name: vm.name, cuisine: vm.cuisine, slug: vm.slug, label: vm.label })
</script>
`

  // Render-once: the control, and the shape that always worked.
  await Bun.write(
    path.join(dir, 'views', 'once.stx'),
    `${probeScript(`'nonna-pia'`)}<div>PROBE::{{ probeJson }}::END</div>\n`,
  )

  // Dynamic route: the per-request path #2390 reported against.
  await Bun.write(
    path.join(dir, 'views', 'places', '[slug].stx'),
    `${probeScript('params.slug', '../../lib/places')}<div>PROBE::{{ probeJson }}::END</div>\n`,
  )

  // Static view reading `query`, which #2390 says is enough to move it onto
  // the per-request path.
  await Bun.write(
    path.join(dir, 'views', 'searched.stx'),
    `<script server>
import { placeBySlug, viewModel } from '../lib/places'

const asked = query.business || 'nonna-pia'
const probeAwait = await Promise.resolve('await:' + asked)
const vm = viewModel(await placeBySlug(asked))
const probeJson = JSON.stringify({ asked, probeAwait, name: vm.name, slug: vm.slug })
</script>
<div>PROBE::{{ probeJson }}::END</div>
`,
  )

  // Through a partial, where #2392 was first seen: the view model is built in
  // the view and every reference to it lives in the included file.
  await Bun.write(
    path.join(dir, 'partials', 'place-body.stx'),
    `<div>PROBE::{{ probeJson }}::END</div>\n<a href="/order?business={{ vm.slug }}">Order</a>\n<div data-place="{{ vm.slug }}"></div>\n`,
  )
  await Bun.write(
    path.join(dir, 'views', 'via-partial.stx'),
    `${probeScript(`'nonna-pia'`)}@include('place-body')\n`,
  )

  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT}, partialsDir: 'partials' })
`)

  proc = Bun.spawn(['bun', path.join(dir, 'driver.ts')], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })

  for (let i = 0; i < 100; i++) {
    try {
      await fetch(`${BASE}/once`)
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

describe('per-request view context (stacksjs/stacks#2390, #2392)', () => {
  it('gives a render-once view its awaited and imported values', async () => {
    const probe = parseProbe(await (await fetch(`${BASE}/once`)).text())

    expect(probe.probeAwait).toBe('await:nonna-pia')
    expect(probe.name).toBe('Place nonna-pia')
    expect(probe.slug).toBe('nonna-pia')
  })

  it('gives a dynamic route the same values, not empties', async () => {
    const probe = parseProbe(await (await fetch(`${BASE}/places/marisol-cocina`)).text())

    expect(probe.probeSync).toBe('sync:marisol-cocina')
    // The one that arrived empty: a value produced by a top-level await.
    expect(probe.probeAwait).toBe('await:marisol-cocina')
    // …and a whole const computed by an imported function, which vanished
    // rather than holding a wrong value.
    expect(probe.name).toBe('Place marisol-cocina')
    expect(probe.label).toBe('Place marisol-cocina (marisol-cocina)')
  })

  it('renders a property named `slug` like any other property', async () => {
    const probe = parseProbe(await (await fetch(`${BASE}/places/marisol-cocina`)).text())

    expect(probe.cuisine).toBe('Italian')
    expect(probe.slug).toBe('marisol-cocina')
  })

  it('gives a static view that reads `query` its awaited values', async () => {
    const probe = parseProbe(await (await fetch(`${BASE}/searched?business=osteria`)).text())

    expect(probe.asked).toBe('osteria')
    expect(probe.probeAwait).toBe('await:osteria')
    expect(probe.slug).toBe('osteria')
  })

  it('renders `slug` through a partial, in text and in attributes', async () => {
    const html = await (await fetch(`${BASE}/via-partial`)).text()
    const probe = parseProbe(html)

    expect(probe.slug).toBe('nonna-pia')
    expect(html).toContain('href="/order?business=nonna-pia"')
    expect(html).toContain('data-place="nonna-pia"')
  })
})
