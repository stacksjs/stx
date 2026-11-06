import { afterEach, expect, test } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from './spa-harness'

afterEach(closeBrowser)

const watcher = `export function startWatch(name, publish) {
  window.__live.started.push(name)
  publish('ready ' + name)
  return { stop() { window.__live.stopped.push(name) } }
}`

for (const serve of ['fragment', 'document'] as const) {
  for (const imported of [false, true]) {
    test(`plain x-init helpers keep component state, props and teardown (${serve}, imported=${imported})`, async () => {
      const app = await renderApp({
        'layouts/app.stx': layout(''),
        'watcher.ts': watcher,
        'components/LiveProbe.stx': `<div x-data="{ summary: '', handle: null }" x-init="handle = followRun($props.name, (line) => { summary = line })" x-destroy="handle?.stop()"><span x-text="summary"></span></div>
<script client>
${imported ? "import { startWatch } from '../watcher'" : watcher.replace('export ', '')}
function followRun(name, publish) { return startWatch(name, publish) }
</script>`,
        'a.stx': page('app', '<LiveProbe name="first" /><LiveProbe name="second" />'),
        'b.stx': page('app', '<p>Next page</p>'),
      }, { '/a': 'a.stx', '/b': 'b.stx' })
      try {
        const live = { started: [] as string[], stopped: [] as string[] }
        const browser = await boot(app, '/a', { serve, globals: { __live: live } })
        await settle()
        const summaries = () => [...browser.document.querySelectorAll('span')].map((node: any) => node.textContent)
        expect(live.started).toEqual(['first', 'second'])
        expect(summaries()).toEqual(['ready first', 'ready second'])
        expect(browser.document.querySelectorAll('script[data-stx-runtime]').length).toBe(1)
        expect(browser.errors).toEqual([])
        await browser.navigate('/b')
        expect(live.stopped).toEqual(['first', 'second'])
        await browser.navigate('/a')
        expect(live.started).toEqual(['first', 'second', 'first', 'second'])
        expect(summaries()).toEqual(['ready first', 'ready second'])
        expect(browser.errors).toEqual([])
        await browser.navigate('/b')
        expect(live.stopped).toEqual(['first', 'second', 'first', 'second'])
      }
      finally { await app.dispose() }
    })
  }
}
