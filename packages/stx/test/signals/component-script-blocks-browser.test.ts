import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { createBrowserFixture, isolatedBrowserBackend } from '../../test-utils/browser-fixture'

it('hydrates every script block of real compiled components cloned inside a conditional loop', async () => {
  const dir = createTempDir('stx-component-blocks-')
  let fixture: ReturnType<typeof createBrowserFixture> | undefined
  try {
    await Bun.write(join(dir, 'Card.stx'), `<script>
interface Props { card?: any }
const { card = null } = defineProps<Props>()
</script>
<script client>
const card = useReactiveProp('card', null)
const count = state(0)
</script>
<article :if="card" data-card><strong :text="card.title"></strong><button @click="count.update(n => n + 1)" :text="String(count())"></button></article>`)
    await Bun.write(join(dir, 'Cards.stx'), `<script>
interface Props { entries?: any[] }
const { entries = [] } = defineProps<Props>()
</script>
<script client>
const entries = useReactiveProp('entries', [])
</script>
<div><section :for="entry in entries" :key="entry.id"><Card :card="entry" /></section></div>`)
    const html = await processDirectives(`<html><body><script client>
const ready = state(false)
const rows = state([])
onMount(() => { rows.set([{ id: 1, title: 'Run' }, { id: 2, title: 'Strength' }]); ready.set(true) })
</script><main><div :if="ready"><Cards :entries="rows" /></div><button data-replace @click="rows.set([{ id: 2, title: 'Updated strength' }])">Replace</button></main></body></html>`, {}, join(dir, 'page.stx'), { componentsDir: dir, autoShell: false } as never, new Set())
    fixture = createBrowserFixture({
      createServer: () => Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) }),
      createView: () => new WebView({ headless: true, backend: isolatedBrowserBackend() }),
      overallTimeoutMs: 25_000,
    })
    await fixture.view.navigate(fixture.url)
    expect(await fixture.waitFor(`document.querySelectorAll('[data-card] strong').length === 2 && document.querySelector('[data-card] strong').textContent === 'Run'`, value => value === true)).toBe(true)
    expect(await fixture.view.evaluate(`[...document.querySelectorAll('[data-card] strong')].map(node => node.textContent)`)).toEqual(['Run', 'Strength'])
    await fixture.view.evaluate(`document.querySelectorAll('[data-card] button')[1].click()`)
    expect(await fixture.view.evaluate(`[...document.querySelectorAll('[data-card] button')].map(node => node.textContent)`)).toEqual(['0', '1'])
    await fixture.view.evaluate(`document.querySelector('[data-replace]').click()`)
    expect(await fixture.waitFor(`document.querySelectorAll('[data-card]').length === 1 && document.querySelector('[data-card] strong').textContent === 'Updated strength'`, value => value === true)).toBe(true)
    expect(await fixture.view.evaluate(`document.querySelector('[data-card] button').textContent`)).toBe('1')
  }
  finally { fixture?.close(); rmSync(dir, { recursive: true, force: true }) }
}, 30_000)
