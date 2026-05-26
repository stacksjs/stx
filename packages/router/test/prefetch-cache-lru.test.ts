/**
 * Tests for the router prefetch cache LRU eviction (stacksjs/stx#1719).
 *
 * Pre-fix, `cache`, `layoutCache`, and `layoutGroupCache` were plain
 * objects with no eviction policy. Hover-prefetch on a long list of
 * internal links would retain every prefetched page's HTML
 * indefinitely — multi-MB memory bloat in long-running tabs.
 *
 * Fix: an LRU policy keyed on `o.prefetchCacheMax` (default 50). New
 * entries push onto an order list; once the list exceeds the cap, the
 * oldest entry is evicted from all three caches. Cache hits promote
 * their key to most-recently-used.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { getRouterScript } from '../src/client'

const originalGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  location: globalThis.location,
  history: globalThis.history,
  fetch: globalThis.fetch,
  CustomEvent: globalThis.CustomEvent,
  Event: globalThis.Event,
  DOMParser: globalThis.DOMParser,
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

// Mirrors the helper used in client-navigation.test.ts.
function installRouter(html: string, fetchImpl: typeof fetch, config: Record<string, unknown> = {}) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(html)
  // eslint-disable-next-line ts/no-explicit-any
  ;(window as any).stx = {}
  // eslint-disable-next-line ts/no-explicit-any
  ;(window as any).__stxRouterConfig = {
    cache: true,
    prefetch: true,
    progress: false,
    viewTransitions: false,
    ...config,
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    fetch: fetchImpl,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
  })

  new Function(getRouterScript())()

  // eslint-disable-next-line ts/no-explicit-any
  return window as Window & { stxRouter: any }
}

const fragmentHeaders = {
  'X-STX-Fragment': 'true',
  'X-STX-Layout': 'layouts/x.stx',
  'X-STX-Layout-Group': 'x',
}

function makeFetch(): typeof fetch {
  return async (url: string | URL | Request) => {
    return new Response(`<section>${String(url)}</section>`, {
      status: 200,
      headers: { 'Content-Type': 'text/html', ...fragmentHeaders },
    })
  }
}

async function flush() {
  await new Promise(r => setTimeout(r, 50))
}

describe('router prefetch cache LRU (#1719)', () => {
  let window: Window & { stxRouter: { cache: Record<string, string>, prefetch: (url: string) => void } }

  beforeEach(() => {
    // eslint-disable-next-line ts/no-explicit-any
    window = installRouter(
      `<html><head>
         <meta name="stx-layout" content="layouts/x.stx">
         <meta name="stx-layout-group" content="x">
       </head><body><main>Home</main></body></html>`,
      makeFetch(),
      { prefetchCacheMax: 3 },
    ) as any
  })

  it('evicts the oldest entry once the cache fills past the configured max', async () => {
    // Cache max is 3. Prefetch 4 distinct URLs in order /a, /b, /c, /d.
    // Expected: after the 4th, /a (the oldest) is evicted.
    window.stxRouter.prefetch('/a')
    window.stxRouter.prefetch('/b')
    window.stxRouter.prefetch('/c')
    window.stxRouter.prefetch('/d')
    await flush()

    expect(window.stxRouter.cache['/a']).toBeUndefined()
    expect(window.stxRouter.cache['/b']).toBeDefined()
    expect(window.stxRouter.cache['/c']).toBeDefined()
    expect(window.stxRouter.cache['/d']).toBeDefined()
  })

  it('keeps eviction stable across many inserts (cache size never exceeds max)', async () => {
    for (let i = 0; i < 12; i++)
      window.stxRouter.prefetch(`/page-${i}`)
    await flush()

    expect(Object.keys(window.stxRouter.cache).length).toBeLessThanOrEqual(3)
    // The last 3 inserts should be the survivors.
    expect(window.stxRouter.cache['/page-9']).toBeDefined()
    expect(window.stxRouter.cache['/page-10']).toBeDefined()
    expect(window.stxRouter.cache['/page-11']).toBeDefined()
  })

  it('promotes a key on cache-hit so it survives subsequent evictions', async () => {
    // Prefetch /a, /b, /c (fills cache).
    window.stxRouter.prefetch('/a')
    window.stxRouter.prefetch('/b')
    window.stxRouter.prefetch('/c')
    await flush()

    // Navigate to /a — cache hit, this should promote /a.
    // eslint-disable-next-line ts/no-explicit-any
    await (window.stxRouter as any).navigate('/a')
    await flush()

    // Now prefetch /d — cache is full → oldest (now /b, since /a was promoted)
    // is the one that should be evicted.
    window.stxRouter.prefetch('/d')
    await flush()

    expect(window.stxRouter.cache['/a']).toBeDefined() // promoted → survives
    expect(window.stxRouter.cache['/b']).toBeUndefined() // oldest after promotion → evicted
    expect(window.stxRouter.cache['/c']).toBeDefined()
    expect(window.stxRouter.cache['/d']).toBeDefined()
  })

  it('honors a custom prefetchCacheMax (default would otherwise be 50)', async () => {
    // Default test cap is 3 (from beforeEach). Confirm: insert 5, max stays at 3.
    for (let i = 0; i < 5; i++)
      window.stxRouter.prefetch(`/p${i}`)
    await flush()

    expect(Object.keys(window.stxRouter.cache).length).toBe(3)
  })
})
