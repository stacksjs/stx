import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { extractContainerContent } from '../../src/app-shell'
import { processDirectives } from '../../src/process'
import { injectRouterScript } from '../../src/runtime-injection'

for (const debug of [true, false]) {
  it(`preserves ARIA booleans on initial and SPA renders (debug=${debug})`, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-aria-'))
    let view: WebView | undefined
    let server: ReturnType<typeof Bun.serve> | undefined
    try {
      view = new WebView({ headless: true })
      await Bun.write(join(dir, 'AriaControl.stx'), '<script client>const label = state("child")</script><button data-child x-text="label"></button>')
      const options = { componentsDir: dir, cache: false, debug, router: { cache: false, prefetch: false, viewTransitions: false } }
      server = Bun.serve({ port: 0, async fetch(request) {
        const url = new URL(request.url)
        if (!['/one', '/two'].includes(url.pathname)) return new Response(null, { status: 404 })
        const html = await injectRouterScript(await processDirectives(`<!doctype html><html><head><meta name="stx-layout" content="same"></head><body>
<script client>
const active = state(false)
const optional = state(null)
function toggle() { active.set(!active()) }
</script>
<main><span data-page="${url.pathname}"></span>
  <button data-toggle @click="toggle()">Toggle</button>
  <button data-aria :aria-pressed="active" x-bind:aria-expanded="active" :aria-selected="active" :aria-label="optional">State</button>
  <AriaControl :aria-pressed="active" />
  <button data-disabled :disabled="active">Disabled</button>
  <input data-checked type="checkbox" :checked="active">
  <a data-stx-link href="${url.pathname === '/one' ? '/two' : '/one'}">Next</a>
</main></body></html>`, {}, join(dir, 'page.stx'), options, new Set()), options)
          if (request.headers.get('X-STX-Router') === 'true') {
            return new Response(extractContainerContent(html), { headers: {
              'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Runtime': 'true',
              'X-STX-Layout': 'same', 'X-STX-Layout-Group': 'same',
            } })
          }
          return new Response(html, { headers: { 'Content-Type': 'text/html' } })
        } })
        const waitFor = async (expression: string) => {
          for (let i = 0; i < 100; i++) {
            if (await view!.evaluate(expression)) return
            await Bun.sleep(20)
          }
          throw new Error(`Browser did not reach: ${expression}`)
        }
        await view.navigate(`${server.url}one`)
        await view.evaluate('window.navigationMarker = 1')
        for (const page of ['/one', '/two', '/one']) {
          await waitFor(`document.querySelector('[data-page]')?.getAttribute('data-page') === '${page}' && !document.querySelector('[data-toggle]')?.hasAttribute('@click')`)
          for (const active of [false, true, false]) {
            expect(await view.evaluate(`['aria-pressed', 'aria-expanded', 'aria-selected'].map(name => document.querySelector('[data-aria]').getAttribute(name))`)).toEqual([String(active), String(active), String(active)])
            expect(await view.evaluate(`document.querySelector('[data-child]').closest('[data-stx-scope]').getAttribute('aria-pressed')`)).toBe(String(active))
            expect(await view.evaluate(`document.querySelector('[data-aria]').hasAttribute('aria-label')`)).toBe(false)
            expect(await view.evaluate(`document.querySelector('[data-disabled]').disabled`)).toBe(active)
            expect(await view.evaluate(`document.querySelector('[data-checked]').checked`)).toBe(active)
            await view.evaluate(`document.querySelector('[data-toggle]').click()`)
          }
          expect(await view.evaluate('window.navigationMarker')).toBe(1)
          await view.evaluate(`document.querySelector('[data-stx-link]').click()`)
        }
      }
      finally {
        view?.close()
        await server?.stop(true)
        rmSync(dir, { recursive: true, force: true })
      }
    }, 30_000)
  }
