import { expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { hasContainerRegion } from '../../src/app-shell'
import { buildForProduction } from '../../src/production-builder'
import { startProductionServer } from '../../src/production-server'
import { createTempDir } from '../../src/temp-dir'

/**
 * A page with no router container is not answered with a fragment
 * (stacksjs/stx#2143): its "fragment" was the whole body, and the router put
 * that page's header and footer inside the container of the page it came from,
 * stacking two headers.
 */
test('hasContainerRegion tells a page with a container from one without', () => {
  expect(hasContainerRegion('<html><body><header>h</header><main>m</main></body></html>')).toBe(true)
  expect(hasContainerRegion('<html><body><header>h</header><section>m</section></body></html>')).toBe(false)
  expect(hasContainerRegion('<html><body><div id="app">m</div></body></html>', '#app')).toBe(true)
})

test('production answers a router request with a fragment only for pages that have the container', async () => {
  const root = createTempDir('stx-no-container-')
  let server: Awaited<ReturnType<typeof startProductionServer>> | undefined
  try {
    await Bun.write(path.join(root, 'pages/index.stx'), '<html><head><title>Home</title></head><body><header>Site header</header><main>Home content</main><footer>Site footer</footer></body></html>')
    await Bun.write(path.join(root, 'pages/login.stx'), '<html><head><title>Login</title></head><body><header>Site header</header><section>Login card</section><footer>Site footer</footer></body></html>')
    await Bun.write(path.join(root, 'pages/item/[id].stx'), `<script server>const title = 'Item ' + (params.id || 'build')</script>
<html><head><title>{{ title }}</title></head><body><header>Site header</header><section>{{ title }}</section><footer>Site footer</footer></body></html>`)
    const built = await buildForProduction({ root })
    server = await startProductionServer({ outputDir: built.outputDir, port: 0 })
    const ask = (route: string) => fetch(`http://localhost:${server!.port}${route}`, { headers: { 'X-STX-Router': 'true' } })

    const home = await ask('/')
    expect(home.headers.get('X-STX-Fragment')).toBe('true')
    const homeBody = await home.text()
    expect(homeBody).toContain('Home content')
    expect(homeBody).not.toContain('Site header')

    for (const route of ['/login', '/item/7']) {
      const response = await ask(route)
      expect(response.status).toBe(200)
      expect(response.headers.get('X-STX-Fragment')).toBeNull()
      const body = await response.text()
      // A whole document the router loads in full, with its own chrome.
      expect(body).toContain('<html')
      expect(body).toContain('Site header')
    }
  }
  finally {
    server?.stop()
    await rm(root, { recursive: true, force: true })
  }
}, 30_000)
