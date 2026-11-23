import { describe, expect, test } from 'bun:test'
import { getServeModuleBundle } from '../../src/caching'
import { deferScripts } from '../../src/build-defer-scripts'
import { LAZY_ISLAND_RUNTIME_LOADER, lazyIslandRuntime } from '../../src/lazy-island-runtime'
import { prepareLazyIslandRuntime } from '../../src/serve-page-assets'

const head = '<!DOCTYPE html><html><head><script data-stx-color-mode-boot>boot()</script><script data-stx-runtime src="/_stx/runtime.12345678.js"></script><script data-stx-scoped data-stx-run="always" data-stx-messages src="/_stx/modules.aaaaaaaaaaaaaaaa.js"></script><script data-stx-stores>window.stx.defineStore("a", function(){})</script></head>'
const island = '<div data-stx-scope="s1" data-stx-component-wrapper stx-hydrate="interaction"><button @click="toggle()" :aria-pressed="on" x-cloak>Theme</button><div><div :if="on">nested</div></div></div><script type="stx/island" data-stx-island="s1" data-stx-scoped data-stx-owner="s1" client>(function(id){ const { state } = window.stx; })("s1")</script>'
const tail = '<script type="application/ld+json">{"@type":"WebSite"}</script><script data-stx-router src="/_stx/router.87654321.js"></script></body></html>'
const page = (body: string) => `${head}<body><main><a href="/pricing" data-stx-link>Pricing</a>${body}</main>${tail}`

describe('the runtime waits for the first island', () => {
  test('an island-only document loads no runtime until a trigger fires', () => {
    const result = lazyIslandRuntime(page(island))
    expect(result.applied).toBe(true)
    // Nothing the browser would run reaches the runtime any more.
    expect(result.html).not.toMatch(/<script data-stx-runtime/)
    expect(result.html).toContain('<script type="stx/lazy" data-stx-lazy-src="/_stx/runtime.12345678.js" data-stx-runtime></script>')
    expect(result.html).toContain('<script type="stx/lazy" data-stx-lazy-src="/_stx/modules.aaaaaaaaaaaaaaaa.js" data-stx-scoped data-stx-run="always" data-stx-messages></script>')
    // The inline bundle is fetched by URL too, in its written place.
    expect(result.assets).toHaveLength(1)
    expect(result.assets[0]!.contents).toContain('defineStore("a"')
    expect(result.html).toContain(`<script type="stx/lazy" data-stx-lazy-src="/_stx/${result.assets[0]!.filename}" data-stx-stores></script>`)
    const order = ['data-stx-runtime', 'data-stx-messages', 'data-stx-stores'].map(name => result.html.indexOf(name))
    expect(order).toEqual([...order].sort((a, b) => a - b))
    // The document's own scripts and the island stay as they were.
    expect(result.html).toContain('<script data-stx-color-mode-boot>boot()</script>')
    expect(result.html).toContain('<script data-stx-router src="/_stx/router.87654321.js"></script>')
    expect(result.html).toContain('<script type="stx/island" data-stx-island="s1"')
    expect(result.html).toContain('<script type="application/ld+json">')
    // One loader, before the body closes, and running the pass again changes nothing.
    expect(result.html.match(/data-stx-lazy-runtime/g)).toHaveLength(1)
    expect(result.html.indexOf('data-stx-lazy-runtime')).toBeLessThan(result.html.indexOf('</body>'))
    expect(result.html.indexOf('data-stx-lazy-runtime')).toBeGreaterThan(result.html.indexOf('data-stx-router'))
    expect(lazyIslandRuntime(result.html).html).toBe(result.html)
  })

  test('the loader never names the runtime object, so nothing injects the runtime for it', () => {
    expect(LAZY_ISLAND_RUNTIME_LOADER).not.toMatch(/window\.stx\b|w\.stx\./)
    expect(() => new Function(LAZY_ISLAND_RUNTIME_LOADER)).not.toThrow()
  })

  test.each([
    ['an eager component script', `${island}<div data-stx-scope="s2">x</div><script data-stx-scoped data-stx-run="always" data-stx-owner="s2" client>(function(id){ const { state } = window.stx; })("s2")</script>`],
    ['a page script that mounts through the runtime', `${island}<script data-stx-scoped>window.stx.mount(function(){})</script>`],
    ['a reactive attribute outside every island', `${island}<p :text="greeting">Hello</p>`],
    ['an event handler outside every island', `${island}<button @click="go()">Go</button>`],
    ['a cloaked element outside every island', `${island}<p x-cloak>Later</p>`],
    ['a loop template outside every island', `${island}<template :for="row in rows"><li>row</li></template>`],
    ['a reactive element after the island closes', `<section>${island}</section><span :class="tone">after</span>`],
  ])('%s keeps the runtime in the head', (_name, body) => {
    const html = page(body)
    const result = lazyIslandRuntime(html)
    expect(result.applied).toBe(false)
    expect(result.html).toBe(html)
  })

  test('a document without islands, or without a runtime, is left alone', () => {
    const plain = `${head}<body><main><h1>Static</h1></main>${tail}`
    expect(lazyIslandRuntime(plain).html).toBe(plain)
    const noRuntime = `<!DOCTYPE html><html><head></head><body>${island}</body></html>`
    expect(lazyIslandRuntime(noRuntime).html).toBe(noRuntime)
  })

  test('attribute values and inert templates do not count as reactive markup', () => {
    const quiet = `${island}<img alt="Split :pace=fast @home" class="sm:flex [&>*]:p-2" src="/a.png"><template><script data-stx-owner="t">window.stx.mount()</script></template>`
    expect(lazyIslandRuntime(page(quiet)).applied).toBe(true)
  })

  test('nested same-name elements inside an island do not end it early', () => {
    const nested = '<div data-stx-scope="s1" stx-hydrate="visible"><div><div></div></div><p :text="label">x</p></div><script type="stx/island" data-stx-island="s1" data-stx-scoped>(function(){ window.stx._scopes = {} })()</script>'
    expect(lazyIslandRuntime(page(nested)).applied).toBe(true)
  })

  test('a component nested in an island waits with it, in its written place', () => {
    const nested = '<div data-stx-scope="s1" stx-hydrate="interaction"><span data-stx-scope="tip">?</span><script data-stx-scoped data-stx-run="always" data-stx-owner="tip" client>(function(id){ const { state } = window.stx; })("tip")</script><button @click="go()">Go</button></div><script type="stx/island" data-stx-island="s1" data-stx-scoped>(function(){ const { state } = window.stx; })()</script>'
    const result = lazyIslandRuntime(page(nested))
    expect(result.applied).toBe(true)
    expect(result.html).not.toMatch(/<script data-stx-scoped data-stx-run="always" data-stx-owner="tip"/)
    expect(result.html).toMatch(/<script type="stx\/lazy" data-stx-lazy-src="\/_stx\/modules\.[a-f0-9]{16}\.js" data-stx-scoped data-stx-run="always" data-stx-owner="tip" client><\/script>/)
    expect(result.assets.some(asset => asset.contents.includes('("tip")'))).toBe(true)
  })

  test('the served document registers its inline bundle and still defers cleanly', () => {
    const served = prepareLazyIslandRuntime(page(island))
    const url = /data-stx-lazy-src="\/_stx\/modules\.([a-f0-9]{16})\.js" data-stx-stores/.exec(served)
    expect(url).not.toBeNull()
    expect(getServeModuleBundle(url![1]!)).toContain('defineStore("a"')
    // The island's own setup is fetched on its trigger too.
    const chunk = /data-stx-island="s1" data-stx-src="\/_stx\/modules\.([a-f0-9]{16})\.js"/.exec(served)
    expect(chunk).not.toBeNull()
    expect(getServeModuleBundle(chunk![1]!)).toContain('window.stx')
    expect(served).not.toContain('const { state } = window.stx')
    // deferScripts leaves the inert tags alone and defers only what still runs.
    const deferred = deferScripts(served).html
    expect(deferred).toContain('type="stx/lazy" data-stx-lazy-src="/_stx/runtime.12345678.js"')
    expect(deferred).toContain('src="/_stx/router.87654321.js" defer')
  })
})
