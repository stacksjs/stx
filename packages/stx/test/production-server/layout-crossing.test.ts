import { expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { buildForProduction } from '../../src/production-builder'
import { startProductionServer } from '../../src/production-server'
import { RouteResponseCache } from '../../src/route-response-cache'
import { createTempDir } from '../../src/temp-dir'

/**
 * A router request from another layout is answered with the document.
 *
 * The router used to take a fragment, see in its headers that the page was on
 * another layout, and ask again for the whole document: two renders for one
 * click. It now says which layout its page is on, and the production server
 * answers a page on another layout with the document at once, static and
 * dynamic pages alike, still naming the layout in the headers.
 */
const page = (layout: string, group: string, body: string) => `<html><head><title>${body}</title>`
  + `<meta name="stx-layout" content="${layout}"><meta name="stx-layout-group" content="${group}"></head>`
  + `<body><nav>${group} nav</nav><main>${body}</main></body></html>`

const FROM_MARKETING = { 'X-STX-Have-Layout': 'layouts/marketing', 'X-STX-Have-Layout-Group': 'marketing' }
const FROM_APP = { 'X-STX-Have-Layout': 'layouts/app', 'X-STX-Have-Layout-Group': 'app' }

test('production answers a router from another layout with the document, and one from the same layout with a fragment', async () => {
  const root = createTempDir('stx-prod-layout-crossing-')
  let server: Awaited<ReturnType<typeof startProductionServer>> | undefined
  try {
    await Bun.write(path.join(root, 'pages/about.stx'), page('layouts/app', 'app', 'About static'))
    await Bun.write(path.join(root, 'pages/brand/[slug].stx'), `<script server>const name = 'Brand ' + (params.slug || 'build')</script>
${page('layouts/app', 'app', '{{ name }}')}`)
    const built = await buildForProduction({ root })
    server = await startProductionServer({ outputDir: built.outputDir, port: 0 })
    const ask = (route: string, have?: Record<string, string>) => fetch(`http://localhost:${server!.port}${route}`, { headers: { 'X-STX-Router': 'true', ...have } })

    for (const route of ['/about', '/brand/acme']) {
      const across = await ask(route, FROM_MARKETING)
      expect(across.status).toBe(200)
      expect(across.headers.get('X-STX-Fragment')).toBeNull()
      expect(across.headers.get('X-STX-Layout')).toBe('layouts/app')
      expect(across.headers.get('X-STX-Layout-Group')).toBe('app')
      const document = await across.text()
      expect(document).toContain('<html')
      expect(document).toContain('app nav')

      const within = await ask(route, FROM_APP)
      expect(within.headers.get('X-STX-Fragment')).toBe('true')
      const fragment = await within.text()
      expect(fragment).not.toContain('app nav')

      // A router that does not say keeps the old answer, and decides itself.
      const silent = await ask(route)
      expect(silent.headers.get('X-STX-Fragment')).toBe('true')
      await silent.text()

      expect(across.headers.get('Vary')).toContain('X-STX-Have-Layout-Group')
    }
  }
  finally {
    server?.stop()
    await rm(root, { recursive: true, force: true })
  }
}, 60_000)

test('the response cache keeps one answer per layout a router comes from', async () => {
  const cache = new RouteResponseCache()
  let renders = 0
  const render = async (): Promise<Response> => new Response(String(++renders), { headers: { Vary: 'X-STX-Router, X-STX-Have-Layout, X-STX-Have-Layout-Group' } })
  const get = async (headers: Record<string, string>): Promise<string> =>
    (await cache.respond(new Request('http://localhost/page', { headers }), { public: true, maxAge: 60, swr: 0 }, render)).text()

  expect(await get({ 'X-STX-Router': 'true', ...FROM_MARKETING })).toBe('1')
  expect(await get({ 'X-STX-Router': 'true', ...FROM_MARKETING })).toBe('1')
  // Another layout is another stored answer, not the first one replayed.
  expect(await get({ 'X-STX-Router': 'true', ...FROM_APP })).toBe('2')
  expect(await get({})).toBe('3')
  expect(await get({ 'X-STX-Router': 'true', ...FROM_APP })).toBe('2')
})
