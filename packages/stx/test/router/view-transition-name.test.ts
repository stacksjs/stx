/**
 * A routed navigation's View Transition names one element stx-content.
 *
 * The router's stylesheet named every `main`, `#app-content` and
 * `[data-stx-content]` stx-content. A View Transition whose old or new state
 * has two elements of one name is skipped with "Unexpected duplicate
 * view-transition-name: stx-content". HQ's public profile renders a <main>
 * inside its layout's <main>, so every navigation away from it, into the app
 * or anywhere else, lost its transition with that error. Only the routed
 * container carries the name now.
 *
 * Also covers the route announcer against the real runtime: it reads the
 * destination heading once the page has bound, never its template.
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

async function page(name: string, group: string, body: string, title = name): Promise<void> {
  const html = await processDirectives(`<!doctype html><html><head><title>${title}</title><meta name="stx-layout" content="${group}"><meta name="stx-layout-group" content="${group}"></head>
<body><nav>${group} nav</nav><main>${body}</main></body></html>`, {}, join(dir, `${name}.stx`), { cache: false, debug: false } as any, new Set())
  // Added after rendering: the router's own source names data-stx-runtime,
  // which would read as the page already shipping the signals runtime.
  pages[name] = {
    group,
    html: html.replace('</body>', `<script>window.__stxRouterConfig={container:'main',viewTransitions:true,progress:false,prefetch:false}</script><script>${getRouterScript()}</script></body>`),
  }
}

beforeAll(async () => {
  dir = createTempDir('stx-view-transition-name-')
  // A profile page that renders its own <main> inside the layout's.
  await page('pawel', 'marketing', `<script client>
const name = state('Pawel')
</script>
<div class="profile"><main id="profile-main"><h1>{{ name }}</h1></main></div>`)
  await page('pricing', 'marketing', `<script client>
const plan = state('Pricing')
</script>
<h1>{{ plan }}</h1>`)
  await page('coach', 'coach', `<script client>
const greeting = state('Good morning')
const firstName = state('Chris')
</script>
<h1 id="greet">{{ greeting }}, {{ firstName }}</h1>`, 'Coach home')
  server = Bun.serve({
    port: 0,
    fetch(request) {
      const entry = pages[new URL(request.url).pathname.slice(1)]
      if (!entry)
        return new Response('Not found', { status: 404 })
      if (!request.headers.get('X-STX-Router'))
        return new Response(entry.html, { headers: { 'Content-Type': 'text/html' } })
      const start = entry.html.indexOf('<main>') + 6
      const end = entry.html.lastIndexOf('</main>')
      const outside = entry.html.slice(0, start) + entry.html.slice(end)
      const scripts = outside.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) || []
      const setups = scripts.filter(script => script.includes('function __stx_setup_'))
      const fragment = `${entry.html.slice(start, end)}\n${setups.join('\n')}`
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

interface Transitions { supported: boolean, outcomes: string[], heard: string[] }

// Records how each View Transition the router starts ends, and every text the
// route announcer holds, then navigates.
async function navigate(path: string, until: string): Promise<Transitions> {
  await view.evaluate(`(function() {
    window.__vt = { supported: typeof document.startViewTransition === 'function', outcomes: [], heard: [] };
    if (window.__vt.supported && !window.__vtWrapped) {
      window.__vtWrapped = true;
      var start = document.startViewTransition.bind(document);
      document.startViewTransition = function(cb) {
        var t = start(cb);
        t.ready.then(function() { window.__vt.outcomes.push('ready') }, function(e) { window.__vt.outcomes.push('aborted: ' + (e && e.message)) });
        return t;
      };
    }
    var timer = setInterval(function() {
      var el = document.getElementById('stx-route-announcer');
      var text = el && el.textContent;
      if (text && window.__vt.heard[window.__vt.heard.length - 1] !== text) window.__vt.heard.push(text);
    }, 1);
    setTimeout(function() { clearInterval(timer) }, 3000);
    window.stxRouter.navigate('/${path}');
    return true;
  })()`)
  for (let i = 0; i < 150; i++) {
    if (await view.evaluate(`!!document.querySelector(${JSON.stringify(until)}) && window.__vt.outcomes.length > 0`))
      break
    await Bun.sleep(20)
  }
  await Bun.sleep(400)
  return JSON.parse(await view.evaluate(`JSON.stringify(window.__vt)`) as string)
}

async function named(): Promise<number> {
  return Number(await view.evaluate(`Array.from(document.querySelectorAll('*')).filter(function(el) { return getComputedStyle(el).viewTransitionName === 'stx-content' }).length`))
}

describe('view-transition-name on a routed navigation', () => {
  it('leaves a page with a nested <main> for another layout without a duplicate name', async () => {
    await load('pawel')
    const result = await navigate('coach', '#greet')
    if (!result.supported)
      return
    expect(result.outcomes).toEqual(['ready'])
    expect(await named()).toBeLessThanOrEqual(1)
  }, 30_000)

  it('leaves it for a page in the same layout without a duplicate name', async () => {
    await load('pawel')
    const result = await navigate('pricing', 'main > h1')
    if (!result.supported)
      return
    expect(result.outcomes).toEqual(['ready'])
  }, 30_000)

  it('arrives at a page with a nested <main> without a duplicate name', async () => {
    await load('pricing')
    const result = await navigate('pawel', '#profile-main')
    if (!result.supported)
      return
    expect(result.outcomes).toEqual(['ready'])
  }, 30_000)
})

describe('the route announcer with the real runtime', () => {
  it('announces the bound heading after a layout change, never its template', async () => {
    await load('pawel')
    const result = await navigate('coach', '#greet')
    expect(await view.evaluate(`document.getElementById('greet').textContent`)).toBe('Good morning, Chris')
    expect(result.heard).toEqual(['Good morning, Chris'])
  }, 30_000)

  it('announces the bound heading after a fragment swap', async () => {
    await load('pricing')
    const result = await navigate('pawel', '#profile-main')
    expect(result.heard).toEqual(['Pawel'])
  }, 30_000)
})
