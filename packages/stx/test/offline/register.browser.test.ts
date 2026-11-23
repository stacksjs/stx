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

it('recovers a failed first installation without a reload and keeps its cached progress', async () => {
  const script = generateOfflineRegisterScript({ registerOn: ['/app'] })
  const worker = `
    self.addEventListener('install', event => event.waitUntil((async () => {
      const cache = await caches.open('first-install');
      if (await cache.match('/saved')) return;
      await cache.put('/saved', new Response('kept on the first attempt'));
      await new Promise(resolve => setTimeout(resolve, 150));
      throw new Error('First installation interrupted');
    })()));
    self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
    self.addEventListener('fetch', event => {
      if (new URL(event.request.url).pathname === '/saved') event.respondWith(caches.match('/saved'));
    });
  `
  const fixture = createBrowserFixture({
    assertionTimeoutMs: 8_000,
    createServer: () => Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      fetch(request) {
        if (new URL(request.url).pathname === '/_stx/sw.js') {
          return new Response(worker, {
            headers: { 'Content-Type': 'application/javascript', 'Service-Worker-Allowed': '/', 'Cache-Control': 'no-store' },
          })
        }
        return new Response(`<!DOCTYPE html><html><head>${script}</head><body>App entry</body></html>`, {
          headers: { 'Content-Type': 'text/html' },
        })
      },
    }),
    createView: () => new WebView({ headless: true, backend: isolatedBrowserBackend() }),
  })
  try {
    await fixture.view.navigate(new URL('/app', fixture.url).href)
    await fixture.view.evaluate(`window.originalDocument = true`)
    expect(await fixture.waitFor(`Boolean(navigator.serviceWorker.controller)`, value => value === true)).toBe(true)
    expect(await fixture.view.evaluate('window.originalDocument')).toBe(true)
    expect(await fixture.view.evaluate(`fetch('/saved').then(response => response.text())`)).toBe('kept on the first attempt')
  }
  finally {
    fixture.close()
  }
}, 30_000)
