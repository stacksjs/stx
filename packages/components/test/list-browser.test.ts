import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

it('bounds the web viewport, reveals the final row, and fills successive short pages', async () => {
  const root = join(import.meta.dir, '..')
  const html = await processDirectives(`@import('List', '${root}/src/ui/list/List.stx')
<!doctype html><html><head><style>
.flex-1 { flex:1 1 0%; } .min-h-0 { min-height:0; } .overflow-y-auto { overflow-y:auto; }
</style></head><body>
<script client>
const rows = state([1])
const loading = state(true)
const more = state(true)
const padding = state({ paddingBottom: 120 })
let requests = 0
async function next() {
  if (loading() || !more()) return
  loading.set(true)
  requests++
  await new Promise(resolve => setTimeout(resolve, 10))
  rows.set([...rows(), rows().length + 1])
  if (requests === 3) more.set(false)
  loading.set(false)
}
window.probe = { rows, loading, more, padding, requests: () => requests }
</script>
<section style="display:flex;flex-direction:column;height:260px">
<List :contentContainerStyle="padding" :loading="loading" :hasMore="more" @end-reached="next()">
  <div :for="row in rows" :key="row" style="height:40px;flex-shrink:0" :data-row="row">Row</div>
</List></section></body></html>`, {}, join(root, 'list-browser.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) })
  const view = new WebView({ headless: true })
  async function until(expression: string) {
    for (let i = 0; i < 100; i++) {
      if (await view.evaluate(expression)) return
      await Bun.sleep(25)
    }
    expect(await view.evaluate(expression)).toBe(true)
  }
  try {
    await view.navigate(server.url.href)
    await until('!!window.probe && !!document.querySelector("[data-stx-list]")')
    await view.evaluate('window.probe.loading.set(false)')
    await until('window.probe.requests() === 3 && !window.probe.loading()')
    expect(await view.evaluate('document.querySelectorAll("[data-row]").length')).toBe(4)
    await view.evaluate('window.probe.rows.set(Array.from({length:80}, (_, i) => i + 1))')
    await until('document.querySelectorAll("[data-row]").length === 80')
    const metrics = await view.evaluate(`(() => {
      const list = document.querySelector('[data-stx-list]');
      list.scrollTop = list.scrollHeight;
      return { height:list.clientHeight, scroll:list.scrollHeight, padding:getComputedStyle(list).paddingBottom, lastBottom:list.querySelector('[data-row="80"]').getBoundingClientRect().bottom, viewportBottom:list.getBoundingClientRect().bottom };
    })()`)
    expect(metrics.height).toBe(260)
    expect(metrics.scroll).toBeGreaterThan(3000)
    expect(metrics.padding).toBe('120px')
    expect(metrics.lastBottom).toBeLessThanOrEqual(metrics.viewportBottom - 119)
    await view.evaluate('window.probe.padding.set({paddingBottom:72})')
    await until('getComputedStyle(document.querySelector("[data-stx-list]")).paddingBottom === "72px"')
    expect(await view.evaluate('window.probe.requests()')).toBe(3)
  }
  finally { view.close(); server.stop(true) }
}, 30_000)


it('caps an unbounded page collection before its end sentinel loads all history', async () => {
  const root = join(import.meta.dir, '..')
  const html = await processDirectives(`@import('List', '${root}/src/ui/list/List.stx')
<!doctype html><html><head><style>.overflow-y-auto { overflow-y:auto; }</style></head><body>
<List :hasMore="false">
  @for(let row = 0; row < 80; row++)
    <div style="height:40px">Row {{ row }}</div>
  @endfor
</List></body></html>`, {}, join(root, 'list-page-browser.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) })
  const view = new WebView({ headless: true })
  try {
    await view.navigate(server.url.href)
    let bounded = false
    for (let i = 0; i < 100; i++) {
      bounded = await view.evaluate(`(() => { const list = document.querySelector('[data-stx-list]'); return !!list && list.scrollHeight > list.clientHeight && list.clientHeight <= innerHeight; })()`)
      if (bounded) break
      await Bun.sleep(25)
    }
    expect(bounded).toBe(true)
  }
  finally { view.close(); server.stop(true) }
}, 30_000)

it('scrolls horizontal cards at their authored widths without widening the page', async () => {
  const root = join(import.meta.dir, '..')
  const html = await processDirectives(`@import('List', '${root}/src/ui/list/List.stx')
<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>body{margin:0;width:360px}.cards{height:160px;gap:12px}.card{width:180px;flex-shrink:0}</style></head><body>
<List horizontal className="cards" :hasMore="false"><button :for="n in [1,2,3,4]" :key="n" class="card" :data-row="n">Card {{ n }}</button></List></body></html>`, {}, join(root, 'horizontal-list.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const server = Bun.serve({ port: 0, fetch: () => new Response(html, { headers: { 'content-type': 'text/html' } }) })
  const view = new WebView({ headless: true })
  try {
    await view.navigate(server.url.href)
    for (let i = 0; i < 100; i++) { if (await view.evaluate('document.querySelectorAll("[data-row]").length === 4')) break; await Bun.sleep(20) }
    const metrics = await view.evaluate(`(() => {const list=document.querySelector('[data-stx-list]');list.scrollLeft=10000;const last=list.querySelector('[data-row="4"]');return {width:list.clientWidth,height:list.clientHeight,scroll:list.scrollWidth,left:list.scrollLeft,card:last.getBoundingClientRect().width,lastRight:last.getBoundingClientRect().right,right:list.getBoundingClientRect().right,body:document.body.scrollWidth}})()`)
    expect(metrics.width).toBe(360)
    expect(metrics.height).toBe(160)
    expect(metrics.card).toBe(180)
    expect(metrics.scroll).toBeGreaterThan(700)
    expect(metrics.left).toBeGreaterThan(300)
    expect(metrics.lastRight).toBeLessThanOrEqual(metrics.right)
    expect(metrics.body).toBe(360)
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
