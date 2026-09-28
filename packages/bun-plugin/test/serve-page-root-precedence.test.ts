/**
 * An earlier page root overrides a later one, dynamic routes included.
 *
 * Stacks serves `['resources/views', '<framework>/defaults/resources/views']`
 * so an app can replace any framework page by writing the same path. Static
 * pages worked. Dynamic ones did not: `getRoute` ranked dynamic candidates by
 * `routeSpecificity` of the WHOLE file path, where each directory of the root
 * counts as a static segment, so the framework's
 * `password/reset/[token].stx`, sitting five directories deeper, beat the
 * app's file at the same route. The app page was listed in the generated
 * route manifest and never rendered.
 *
 * Page middleware had the same flaw from another direction: only pages that
 * declared middleware were indexed, from reads that completed in any order, so
 * a default's middleware could land on the app page that replaced it.
 */

import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { orderDynamicRouteFiles, pageRootOf } from '../src/serve'

setDefaultTimeout(60_000)

const APP = 'resources/views'
const DEFAULTS = 'vendor/framework/defaults/resources/views'

describe('orderDynamicRouteFiles', () => {
  it('ranks on the path relative to the page root', () => {
    expect(pageRootOf(`${DEFAULTS}/password/reset/[token].stx`, [APP, DEFAULTS]))
      .toEqual({ relative: 'password/reset/[token].stx', root: 1 })
  })

  it('puts the earlier root first when the routes are equally specific', () => {
    const files = [`${DEFAULTS}/password/reset/[token].stx`, `${APP}/password/reset/[token].stx`]
    expect(orderDynamicRouteFiles(files, [APP, DEFAULTS])[0]).toBe(`${APP}/password/reset/[token].stx`)
  })

  it('still prefers a more specific route from a later root', () => {
    const files = [`${APP}/[...all].stx`, `${DEFAULTS}/orders/[id].stx`]
    expect(orderDynamicRouteFiles(files, [APP, DEFAULTS])[0]).toBe(`${DEFAULTS}/orders/[id].stx`)
  })
})

const PORT = 43_800 + (process.pid % 700)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

const DENY = `<script server>
definePageMeta({ middleware: ['deny'] })
</script>
`

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-page-roots-'))
  const page = (root: string, file: string, body: string) => Bun.write(path.join(dir, root, file), body)

  await page(APP, 'password/reset/[token].stx', '<p>APP-RESET</p>\n')
  await page(DEFAULTS, 'password/reset/[token].stx', '<p>DEFAULT-RESET</p>\n')

  // A default the app does not override is still served.
  await page(DEFAULTS, 'orders/[id].stx', '<p>DEFAULT-ORDER</p>\n')

  // The default guards its page; the app's replacement does not.
  await page(APP, 'account/[id].stx', '<p>APP-ACCOUNT</p>\n')
  await page(DEFAULTS, 'account/[id].stx', `${DENY}<p>DEFAULT-ACCOUNT</p>\n`)
  await page(APP, 'settings.stx', '<p>APP-SETTINGS</p>\n')
  await page(DEFAULTS, 'settings.stx', `${DENY}<p>DEFAULT-SETTINGS</p>\n`)

  // And the other way round: the app's own guard holds.
  await page(APP, 'private/[id].stx', `${DENY}<p>APP-PRIVATE</p>\n`)
  await page(DEFAULTS, 'private/[id].stx', '<p>DEFAULT-PRIVATE</p>\n')

  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({
  patterns: [${JSON.stringify(APP)}, ${JSON.stringify(DEFAULTS)}],
  port: ${PORT},
  quiet: true,
  middleware: { deny: () => new Response('denied', { status: 403 }) },
})
`)

  proc = Bun.spawn(['bun', path.join(dir, 'driver.ts')], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })

  for (let i = 0; i < 100; i++) {
    try {
      await fetch(`${BASE}/settings`)
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

async function get(pathname: string): Promise<{ status: number, body: string }> {
  const res = await fetch(`${BASE}${pathname}`, { redirect: 'manual' })
  return { status: res.status, body: await res.text() }
}

describe('serve with an app root ahead of a deeper defaults root', () => {
  it('renders the app page at a dynamic path both roots define', async () => {
    const { status, body } = await get('/password/reset/abc123')
    expect(status).toBe(200)
    expect(body).toContain('APP-RESET')
    expect(body).not.toContain('DEFAULT-RESET')
  })

  it('still serves a default nobody overrode', async () => {
    expect((await get('/orders/7')).body).toContain('DEFAULT-ORDER')
  })

  it('runs the overriding page\'s middleware, not the default\'s', async () => {
    const dynamic = await get('/account/1')
    expect(dynamic.status).toBe(200)
    expect(dynamic.body).toContain('APP-ACCOUNT')

    const fixed = await get('/settings')
    expect(fixed.status).toBe(200)
    expect(fixed.body).toContain('APP-SETTINGS')

    expect((await get('/private/1')).status).toBe(403)
  })
})
