import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { injectRouterScript } from '../../src/runtime-injection'
import { createTempDir } from '../../src/temp-dir'

/**
 * A page's onMount finds the refs that live inside its component scopes
 * (stacksjs/stx#2142): a canvas projected into a layout shell, read from the
 * page's onMount, was null because the page mounted before that scope hydrated.
 */
for (const shell of ['script-client', 'plain']) {
  it(`gives onMount the ref of an element projected into a component (${shell} shell)`, async () => {
    const dir = createTempDir('stx-mount-ref-')
    let view: WebView | undefined
    let server: ReturnType<typeof Bun.serve> | undefined
    try {
      view = new WebView({ headless: true })
      await Bun.write(join(dir, 'Shell.stx'), shell === 'plain'
        ? '<section class="shell"><slot /></section>'
        : '<script client>const shellReady = state(true)</script><section class="shell" :data-ready="shellReady"><slot /></section>')
      const options = { componentsDir: dir, cache: false, router: { cache: false, prefetch: false, viewTransitions: false } }
      server = Bun.serve({ port: 0, async fetch() {
        const html = await injectRouterScript(await processDirectives(`<!doctype html><html><head><title>t</title></head><body>
<script client>
const canvas = useRef('demoMap')
onMount(() => { document.body.setAttribute('data-seen', canvas.current ? canvas.current.tagName : 'null') })
</script>
<main><Shell><canvas ref="demoMap" width="10" height="10"></canvas></Shell></main></body></html>`, {}, join(dir, 'page.stx'), options, new Set()), options)
        return new Response(html, { headers: { 'Content-Type': 'text/html' } })
      } })
      await view.navigate(`${server.url}`)
      let seen = ''
      for (let i = 0; i < 100 && !seen; i++) {
        seen = String(await view.evaluate(`document.body.getAttribute('data-seen') || ''`))
        if (!seen) await Bun.sleep(20)
      }
      expect(seen).toBe('CANVAS')
    }
    finally {
      view?.close()
      server?.stop(true)
      rmSync(dir, { recursive: true, force: true })
    }
  }, 30000)
}
