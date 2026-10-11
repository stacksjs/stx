/**
 * A library component inside a client loop row hydrates however the page was
 * reached, and whenever its rows arrive.
 *
 * `<tr :for> > <td> > <Avatar>` puts the component's root and its scoped setup
 * script inside the loop's source. bindFor clones that source per row and runs
 * the setup once per clone, from the script it finds in the clone.
 *
 * On a routed visit the router ran that setup in place instead: it left a
 * loop's setup alone only when the component root was itself the :for
 * element. It registered a scope for markup bindFor throws away, and replaced
 * the script with an executed copy that no longer carried data-stx-scoped, so
 * every cloned row had no setup to run. The row roots got their props and
 * nothing else: Avatar's `<img :if :src>` stayed raw and the initials kept the
 * server's fallback. A routed visit is also when a store already holds the
 * rows, which made it look like a bind-order race.
 */
import { WebView } from 'bun'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { getRouterScript } from '../../../router/src/client'
import { processDirectives } from '../../src/process'

const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
const ROWS = `[{ id: 1, name: 'Ada Lovelace', avatar_url: '${GIF}' }, { id: 2, name: 'Grace Hopper', avatar_url: '' }]`
const HYDRATED = [
  { img: GIF, initials: null, raw: false },
  { img: null, initials: 'GH', raw: false },
]

let dir: string
let view: WebView
let server: ReturnType<typeof Bun.serve>
const pages: Record<string, { html: string, group: string }> = {}

function table(setup: string): string {
  return `<script client>
window.__roster = window.__roster || state([])
const roster = window.__roster
${setup}
const filtered = derived(() => roster().filter(a => !!a))
</script>
<div :if="filtered.length"><table><tbody>
  <tr :for="a in filtered" :key="a.id">
    <td><div class="flex"><Avatar :src="a.avatar_url || ''" :alt="a.name" size="sm" className="app-avatar" /></div></td>
    <td>{{ a.name }}</td>
  </tr>
</tbody></table></div>`
}

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

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'stx-routed-loop-component-'))
  await Bun.write(join(dir, 'Avatar.stx'), Bun.file(resolve(import.meta.dir, '../../../components/src/ui/avatar/Avatar.stx')))
  await page('home', 'app', `<script client>
window.__roster = window.__roster || state([])
const greeting = state('Home')
</script>
<p>{{ greeting }}</p>`)
  await page('present', 'app', table(`if (!roster().length) roster.set(${ROWS})`))
  await page('later', 'app', table(`setTimeout(() => roster.set(${ROWS}), 40)`))
  await page('elsewhere', 'other', table(''))
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

async function rows(): Promise<Array<{ img: string | null, initials: string | null, raw: boolean }>> {
  return JSON.parse(await view.evaluate(`JSON.stringify(Array.from(document.querySelectorAll('main tbody tr')).map(function(tr) {
    var root = tr.querySelector('[data-stx-scope]');
    var img = root && root.querySelector('img');
    var initials = root && root.querySelector('span');
    return {
      img: img ? img.getAttribute('src') : null,
      initials: initials ? initials.textContent : null,
      raw: !root || /:(?:if|src|alt|text)=/.test(root.innerHTML),
    };
  }))`) as string)
}

async function settle(): Promise<void> {
  for (let i = 0; i < 100; i++) {
    if (await view.evaluate(`document.querySelectorAll('main tbody tr').length === 2`))
      break
    await Bun.sleep(20)
  }
  await Bun.sleep(80)
}

async function load(path: string): Promise<void> {
  await view.navigate(`http://localhost:${server.port}/${path}`)
  for (let i = 0; i < 100; i++) {
    if (await view.evaluate(`!!(window.stx && window.stxRouter)`))
      break
    await Bun.sleep(20)
  }
}

async function route(path: string, roster: string): Promise<void> {
  await view.evaluate(`(function() { window.__roster.set(${roster}); window.stxRouter.navigate('/${path}'); return true })()`)
  await settle()
}

describe('a library component in a loop row', () => {
  it('hydrates on a full load with the rows present when the page binds', async () => {
    await load('present')
    await settle()
    expect(await rows()).toEqual(HYDRATED)
  }, 30_000)

  it('hydrates on a full load with the rows arriving later', async () => {
    await load('later')
    await settle()
    expect(await rows()).toEqual(HYDRATED)
  }, 30_000)

  it('hydrates on a routed visit with the rows already in the store', async () => {
    await load('home')
    await route('present', ROWS)
    expect(await rows()).toEqual(HYDRATED)
  }, 30_000)

  it('hydrates on a routed visit with the rows arriving later', async () => {
    await load('home')
    await route('later', '[]')
    expect(await rows()).toEqual(HYDRATED)
  }, 30_000)

  it('hydrates on a routed visit that changes layout', async () => {
    await load('home')
    await route('elsewhere', ROWS)
    expect(await rows()).toEqual(HYDRATED)
  }, 30_000)
})
