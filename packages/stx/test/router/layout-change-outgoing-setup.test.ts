/**
 * A navigation that changes layout does not run the page it is leaving.
 *
 * The runtime binds a routed page with `window.stx._latestSetup`, which each
 * page's setup script assigns. A destination whose client script defines no
 * setup function (one that only calls useHead, say) never replaced it, so the
 * full-document swap left the OUTGOING page's setup in place and stx:load ran
 * it again on the new page: its effects and its onMount, against the new URL.
 * HQ's coach calendar wrote ?athlete_id into /relax this way. Fragment swaps
 * were spared only because the server prepends a clear to every fragment.
 */
import { WebView } from 'bun'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { getRouterScript } from '../../../router/src/client'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

let dir: string
let view: WebView
let server: ReturnType<typeof Bun.serve>
const pages: Record<string, string> = {}

async function page(name: string, group: string, body: string): Promise<void> {
  const html = await processDirectives(`<!doctype html><html><head><meta name="stx-layout" content="${group}"><meta name="stx-layout-group" content="${group}"></head>
<body><nav>${group} nav</nav><main>${body}</main></body></html>`, {}, join(dir, `${name}.stx`), { cache: false, debug: false } as any, new Set())
  // Added after rendering: the router's own source names data-stx-runtime,
  // which would read as the page already shipping the signals runtime.
  const bodyEnd = html.lastIndexOf('</body>')
  expect(bodyEnd).toBeGreaterThan(-1)
  pages[name] = `${html.slice(0, bodyEnd)}<script>window.__stxRouterConfig={container:'main',viewTransitions:false,progress:false,prefetch:false}</script><script>${getRouterScript()}</script>${html.slice(bodyEnd)}`
}

beforeAll(async () => {
  dir = createTempDir('stx-layout-change-setup-')
  await page('calendar', 'coach', `<script client>
window.__calendarRuns = (window.__calendarRuns || 0) + 1
const athlete = state('3057')
onMount(() => { window.__calendarMounts = (window.__calendarMounts || 0) + 1 })
</script>
<p id="calendar">{{ athlete }}</p>`)
  await page('relax', 'app', `<script client>
useHead({ title: 'Relax' })
</script>
<p id="relax">Breathe</p>`)
  server = Bun.serve({
    port: 0,
    fetch(request) {
      const html = pages[new URL(request.url).pathname.slice(1)]
      return html
        ? new Response(html, { headers: { 'Content-Type': 'text/html' } })
        : new Response('Not found', { status: 404 })
    },
  })
  view = new WebView({ headless: true })
})

afterAll(() => {
  view?.close()
  server?.stop(true)
  rmSync(dir, { recursive: true, force: true })
})

describe('a navigation that changes layout', () => {
  it('does not run the outgoing page again on the new one', async () => {
    await view.navigate(`http://localhost:${server.port}/calendar`)
    for (let i = 0; i < 100; i++) {
      if (await view.evaluate(`!!(window.stxRouter && window.__calendarMounts)`))
        break
      await Bun.sleep(20)
    }
    expect(await view.evaluate(`document.querySelector('#calendar').textContent`)).toBe('3057')
    expect(await view.evaluate(`[window.__calendarRuns, window.__calendarMounts]`)).toEqual([1, 1])

    await view.evaluate(`(function() { window.stxRouter.navigate('/relax'); return true })()`)
    for (let i = 0; i < 100; i++) {
      if (await view.evaluate(`!!document.querySelector('#relax')`))
        break
      await Bun.sleep(20)
    }
    await Bun.sleep(150)

    expect(await view.evaluate(`document.querySelector('nav').textContent`)).toBe('app nav')
    expect(await view.evaluate(`[window.__calendarRuns, window.__calendarMounts]`)).toEqual([1, 1])
  }, 30_000)
})
