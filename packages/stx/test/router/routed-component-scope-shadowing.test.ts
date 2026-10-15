/**
 * A component's local names do not replace the page's on a routed visit.
 *
 * A routed visit binds the page in _handleStxLoad, which merged the locals of
 * every component on the page into the page scope before binding the page
 * itself. A component that happened to declare a name the page also declares
 * took it over for the whole page. HQ's coach dashboard aliases two store
 * signals as `loading` and `roster`, and the <HealthData> card further down
 * declares its own `loading = state(true)` and `roster = useStore(...)`:
 * reached by the router, the page's `:if="loading && !roster.length"` read the
 * card's, so the spinner never left and the athlete picker never appeared. A
 * full load binds the page before any component and was fine, as were
 * interpolations reading names the card does not declare.
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
const pages: Record<string, { html: string, group: string }> = {}

async function page(name: string, group: string, body: string): Promise<void> {
  const html = await processDirectives(`<!doctype html><html><head><meta name="stx-layout" content="${group}"><meta name="stx-layout-group" content="${group}"></head>
<body><nav>${group} nav</nav><main>${body}</main></body></html>`, {}, join(dir, `${name}.stx`), { componentsDir: dir, cache: false, debug: false } as any, new Set())
  // Added after rendering: the router's own source names data-stx-runtime,
  // which would read as the page already shipping the signals runtime.
  pages[name] = {
    group,
    html: html.replace('</body>', `<script>window.__stxRouterConfig={container:'main',viewTransitions:false,progress:false,prefetch:false}</script><script>${getRouterScript()}</script></body>`),
  }
}

// The store is defined by whichever page loads first, as an app's shared
// store bundle would be, and both pages alias its signals.
const STORE = `if (!window.__boardStoreDefined) {
  window.__boardStoreDefined = true
  defineStore('board', () => {
    const loading = state(true)
    const athletes = state([])
    async function fetchAthletes() {
      loading.set(true)
      await new Promise(r => setTimeout(r, 40))
      athletes.set([{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }])
      loading.set(false)
    }
    return { loading, athletes, fetchAthletes }
  })
}`

beforeAll(async () => {
  dir = createTempDir('stx-routed-scope-shadowing-')
  // Declares the same names as the page, with different meanings.
  await Bun.write(join(dir, 'Gauge.stx'), `<script client>
const loading = state(true)
const roster = { owner: 'gauge' }
const error = state('gauge error')
</script>
<div class="gauge">{{ loading ? 'gauge loading' : 'gauge ready' }}</div>`)
  await page('home', 'coach', `<script client>
${STORE}
const greeting = state('Home')
</script>
<p id="home">{{ greeting }}</p>`)
  await page('board', 'coach', `<script client>
${STORE}
const coach = useStore('board')
const loading = coach.loading
const roster = coach.athletes
const error = state('')
onMount(async () => { await coach.fetchAthletes() })
</script>
<h1>{{ roster.length }} athletes</h1>
<div id="picker" :if="roster.length"><select><option :for="a in roster" :key="a.id" :value="a.id" :text="a.name"></option></select></div>
<div id="spinner" :if="loading && !roster.length">Loading board</div>
<div id="failed" :if="!loading && error">{{ error }}</div>
<section :if="roster.length"><Gauge /></section>`)
  server = Bun.serve({
    port: 0,
    fetch(request) {
      const entry = pages[new URL(request.url).pathname.slice(1)]
      if (!entry)
        return new Response('Not found', { status: 404 })
      if (!request.headers.get('X-STX-Router'))
        return new Response(entry.html, { headers: { 'Content-Type': 'text/html' } })
      // The dev server's fragment: the container's markup with its scripts in
      // place, behind any factory prelude and ahead of the page setup.
      const start = entry.html.indexOf('<main>') + 6
      const end = entry.html.lastIndexOf('</main>')
      const outside = entry.html.slice(0, start) + entry.html.slice(end)
      const scripts = outside.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) || []
      const factories = scripts.filter(script => script.includes('data-stx-component-factories'))
      const setups = scripts.filter(script => script.includes('function __stx_setup_'))
      const fragment = `${factories.join('\n')}\n${entry.html.slice(start, end)}\n${setups.join('\n')}`
      return new Response(fragment, {
        headers: {
          'Content-Type': 'text/html',
          'X-STX-Fragment': 'true',
          'X-STX-Layout': entry.group,
          'X-STX-Layout-Group': entry.group,
          'X-STX-Runtime': 'true',
        },
      })
    },
  })
  view = new WebView({ headless: true })
})

afterAll(() => {
  view?.close()
  server?.stop(true)
  rmSync(dir, { recursive: true, force: true })
})

async function load(path: string): Promise<void> {
  await view.navigate(`http://localhost:${server.port}/${path}`)
  for (let i = 0; i < 100; i++) {
    if (await view.evaluate(`!!(window.stx && window.stxRouter)`))
      break
    await Bun.sleep(20)
  }
}

async function board(): Promise<{ picker: boolean, options: number, spinner: boolean, failed: boolean, heading: string, gauge: string }> {
  for (let i = 0; i < 100; i++) {
    if (await view.evaluate(`!!document.querySelector('main .gauge')`))
      break
    await Bun.sleep(20)
  }
  await Bun.sleep(80)
  return JSON.parse(await view.evaluate(`JSON.stringify({
    picker: !!document.querySelector('#picker'),
    options: document.querySelectorAll('#picker option').length,
    spinner: !!document.querySelector('#spinner'),
    failed: !!document.querySelector('#failed'),
    heading: (document.querySelector('main h1') || {}).textContent || '',
    gauge: ((document.querySelector('main .gauge') || {}).textContent || '').trim(),
  })`) as string)
}

const LOADED = { picker: true, options: 2, spinner: false, failed: false, heading: '2 athletes', gauge: 'gauge loading' }

describe('a page that shares names with a component on it', () => {
  it('binds its own names on a full load', async () => {
    await load('board')
    expect(await board()).toEqual(LOADED)
  }, 30_000)

  it('binds its own names on a routed visit', async () => {
    await load('home')
    await view.evaluate(`(function() { window.stxRouter.navigate('/board'); return true })()`)
    expect(await board()).toEqual(LOADED)
  }, 30_000)
})
