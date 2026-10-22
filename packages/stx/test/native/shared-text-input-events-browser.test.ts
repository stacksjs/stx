import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

it('preserves shared browser value events, lazy modifiers and DOM-shaped change events', async () => {
  const root = join(import.meta.dir, '../../../components')
  const input = join(root, 'src/ui/input/TextInput.stx')
  const source = `@import('TextInput', '${input}')
<script client>
const value = state('Seed')
const live = state('Live')
const number = state(1)
window.probe = { value, live, number, inputs: [], changes: [], liveInputs: [], numbers: [], clears: 0 }
</script><section>
<TextInput id="lazy" clearable v-model:value.lazy.trim="value"
 @input="window.probe.inputs.push(typeof $event === 'object' ? 'RAW_EVENT' : $event)"
 @change="window.probe.changes.push({ value: $event.target.value, type: $event.type })"
 @clear="window.probe.clears++" />
<TextInput id="live" v-model:value="live" @input="window.probe.liveInputs.push($event)" />
<TextInput id="number" v-model:value.lazy.number="number" @input="window.probe.numbers.push($event)" />
</section>`
  const html = await processDirectives(`<!doctype html><html><head></head><body>${source}</body></html>`, {}, join(root, 'events.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) })
  const view = new WebView({ headless: true })
  const snapshot = () => view.evaluate(`JSON.stringify({ value: probe.value(), live: probe.live(), number: probe.number(), inputs: probe.inputs, changes: probe.changes, liveInputs: probe.liveInputs, numbers: probe.numbers, clears: probe.clears })`).then(JSON.parse)
  const edit = async (id: string, value: string, event: string) => {
    await view.evaluate(`(() => { const field = document.getElementById(${JSON.stringify(id)}); field.value = ${JSON.stringify(value)}; field.dispatchEvent(new Event(${JSON.stringify(event)}, { bubbles: true })); })()`)
  }
  try {
    await view.navigate(server.url.href)
    for (let i = 0; i < 150; i++) {
      if (await view.evaluate(`!!window.probe && document.getElementById('lazy')?.value === 'Seed'`)) break
      await Bun.sleep(20)
    }
    expect((await snapshot()).value).toBe('Seed')
    await edit('lazy', ' Draft ', 'input')
    expect(await snapshot()).toMatchObject({ value: 'Seed', inputs: [], changes: [] })
    await edit('lazy', ' Final ', 'change')
    expect(await snapshot()).toMatchObject({ value: 'Final', inputs: ['Final'], changes: [{ type: 'change' }] })
    await edit('lazy', ' Next ', 'input')
    await edit('lazy', ' Next ', 'change')
    const committed = await snapshot()
    expect(committed.value).toBe('Next')
    expect(committed.inputs).toEqual(['Final', 'Next'])
    expect(committed.changes).toHaveLength(2)
    await edit('live', 'Immediate', 'input')
    await edit('live', 'Immediate', 'change')
    expect(await snapshot()).toMatchObject({ live: 'Immediate', liveInputs: ['Immediate'] })
    await edit('number', '42', 'input')
    expect((await snapshot()).number).toBe(1)
    await edit('number', '42', 'change')
    expect(await snapshot()).toMatchObject({ number: 42, numbers: [42] })
    await view.evaluate(`document.querySelector('[aria-label="Clear input"]').click()`)
    expect(await snapshot()).toMatchObject({ value: '', inputs: ['Final', 'Next', ''], clears: 1 })
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
