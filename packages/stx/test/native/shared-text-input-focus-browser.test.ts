import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

it('relays actual browser focus/blur once without inventing input submit events', async () => {
  const root = join(import.meta.dir, '../../../components')
  const input = join(root, 'src/ui/input/TextInput.stx')
  const source = `@import('TextInput', '${input}')
<script client>
const shown = state(true)
const readonly = state(false)
window.probe = { shown, readonly, focus: [], blur: [], focusins: 0, focusouts: 0, inputSubmits: 0, formSubmits: 0 }
</script><form @submit.prevent="window.probe.formSubmits++"><div :if="shown">
<TextInput id="field" value="Seed" :readonly="readonly"
 @focus="window.probe.focus.push([$event.type, $event.target.id, $event instanceof FocusEvent])"
 @blur="window.probe.blur.push([$event.type, $event.target.id, $event.relatedTarget?.id, $event instanceof FocusEvent])"
 @focusin="window.probe.focusins++" @focusout="window.probe.focusouts++"
 @submit="window.probe.inputSubmits++" />
</div><button id="outside" type="button">Outside</button></form>`
  const html = await processDirectives(`<!doctype html><html><head></head><body>${source}</body></html>`, {}, join(root, 'focus.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) })
  const view = new WebView({ headless: true })
  const waitFor = async (expression: string) => {
    for (let i = 0; i < 150; i++) {
      if (await view.evaluate(expression)) return
      await Bun.sleep(20)
    }
    throw new Error(`Browser condition not reached: ${expression}`)
  }
  const read = () => view.evaluate(`JSON.stringify({ focus: probe.focus, blur: probe.blur, focusins: probe.focusins, focusouts: probe.focusouts, inputSubmits: probe.inputSubmits, formSubmits: probe.formSubmits })`).then(JSON.parse)
  try {
    await view.navigate(server.url.href)
    await waitFor(`!!window.probe && document.getElementById('field')?.value === 'Seed'`)
    // Let the WebView gain window focus before measuring input focus events.
    await view.evaluate(`document.getElementById('outside').focus()`)
    await waitFor(`document.hasFocus() && document.activeElement.id === 'outside'`)
    await view.evaluate(`document.getElementById('field').focus()`)
    expect((await read()).focus).toEqual([['focus', 'field', true]])
    await view.evaluate(`document.getElementById('outside').focus()`)
    expect((await read()).blur).toEqual([['blur', 'field', 'outside', true]])
    expect(await read()).toMatchObject({ focusins: 1, focusouts: 1 })
    await view.evaluate(`probe.readonly.set(true)`)
    await waitFor(`document.getElementById('field').readOnly`)
    await view.evaluate(`(() => { document.getElementById('field').focus(); document.getElementById('outside').focus(); document.querySelector('form').requestSubmit(); })()`)
    expect(await read()).toMatchObject({ focusins: 2, focusouts: 2, formSubmits: 1, inputSubmits: 0 })
    expect((await read()).focus).toHaveLength(2)
    expect((await read()).blur).toHaveLength(2)
    await view.evaluate(`(() => { window.oldField = document.getElementById('field'); probe.shown.set(false); })()`)
    await waitFor(`!document.getElementById('field')`)
    await view.evaluate(`oldField.dispatchEvent(new FocusEvent('focus'))`)
    expect((await read()).focus).toHaveLength(2)
    await view.evaluate(`probe.shown.set(true)`)
    await waitFor(`!!document.getElementById('field')`)
    await view.evaluate(`(() => { document.getElementById('field').focus(); document.getElementById('outside').focus(); })()`)
    expect(await read()).toMatchObject({ focusins: 3, focusouts: 3 })
    expect((await read()).focus).toHaveLength(3)
    expect((await read()).blur).toHaveLength(3)
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
