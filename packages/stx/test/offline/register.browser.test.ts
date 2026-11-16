import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { generateOfflineRegisterScript } from '../../src/offline/app-service-worker'
import { createBrowserFixture, isolatedBrowserBackend } from '../../test-utils/browser-fixture'

it('installs the real worker on app entry while leaving marketing visits quiet', async () => {
  let requests = 0
  const script = generateOfflineRegisterScript({ registerOn: ['/app'] })
  const fixture = createBrowserFixture({
    createServer: () => Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      fetch(request) {
        if (new URL(request.url).pathname === '/_stx/sw.js') {
          requests++
          return new Response('self.addEventListener("install", event => event.waitUntil(self.skipWaiting()))', {
            headers: { 'Content-Type': 'application/javascript', 'Service-Worker-Allowed': '/' },
          })
        }
        return new Response(`<!DOCTYPE html><html><head>${script}</head><body>App beside marketing</body></html>`, {
          headers: { 'Content-Type': 'text/html' },
        })
      },
    }),
    createView: () => new WebView({ headless: true, backend: isolatedBrowserBackend() }),
  })
  const painted = `new Promise(resolve => requestAnimationFrame(() => setTimeout(() => resolve(true), 0)))`
  try {
    await fixture.view.navigate(fixture.url)
    expect(await fixture.view.evaluate(painted)).toBe(true)
    expect(requests).toBe(0)
    await fixture.view.evaluate(`(() => { history.pushState(null, '', '/application'); window.dispatchEvent(new Event('stx:load')); })()`)
    expect(await fixture.view.evaluate(painted)).toBe(true)
    expect(requests).toBe(0)
    await fixture.view.evaluate(`(() => { history.pushState(null, '', '/app/calendar'); window.dispatchEvent(new Event('stx:load')); })()`)
    expect(await fixture.waitFor(`navigator.serviceWorker.getRegistrations().then(rows => rows.length)`, value => value === 1)).toBe(1)
    await fixture.view.evaluate(`window.dispatchEvent(new Event('stx:load'))`)
    expect(await fixture.view.evaluate(painted)).toBe(true)
    expect(requests).toBe(1)
  }
  finally {
    fixture.close()
  }
}, 30_000)
