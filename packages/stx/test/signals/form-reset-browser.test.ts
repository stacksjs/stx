import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

for (const debug of [true, false]) {
  it(`resets bound values and models without firing canceled or disposed callbacks (debug=${debug})`, async () => {
    const dir = createTempDir('stx-form-reset-')
    const view = new WebView({ headless: true })
    try {
      const html = await processDirectives(`<!doctype html><html><head></head><body>
<script client>
const name = state('Ada')
const checked = state(false)
const model = state('initial')
window.fields = { name, checked, model }
</script>
<form>
  <input id="name" :value="name" @input="name.set($event.target.value)">
  <input id="checked" type="checkbox" :checked="checked" @change="checked.set($event.target.checked)">
  <input id="model" x-model="model">
</form>
</body></html>`, {}, join(dir, 'page.stx'), { cache: false, debug }, new Set())
      await Bun.write(join(dir, 'page.html'), html)
      await view.navigate(`file://${join(dir, 'page.html')}`)
      for (let i = 0; i < 100; i++) {
        if (await view.evaluate(`document.querySelector('#model')?.value === 'initial'`)) break
        await Bun.sleep(20)
      }
      expect(await view.evaluate(`document.querySelector('#name').value`)).toBe('Ada')
      await view.evaluate(`(() => { fields.name.set('Grace'); fields.checked.set(true); fields.model.set('changed'); })()`)
      await view.evaluate(`document.querySelector('form').addEventListener('reset', event => event.preventDefault(), { once: true })`)
      await view.evaluate(`document.querySelector('form').reset()`)
      await Bun.sleep(10)
      expect(await view.evaluate(`[fields.name(), fields.checked(), fields.model()]`)).toEqual(['Grace', true, 'changed'])
      await view.evaluate(`document.querySelector('form').reset()`)
      await Bun.sleep(10)
      expect(await view.evaluate(`[fields.name(), fields.checked(), fields.model()]`)).toEqual(['Ada', false, 'initial'])
      expect(await view.evaluate(`[document.querySelector('#name').value, document.querySelector('#checked').checked, document.querySelector('#model').value]`)).toEqual(['Ada', false, 'initial'])
      // Teardown must remove the document listener, including a queued reset.
      await view.evaluate(`(() => { fields.name.set('keep'); const form = document.querySelector('form'); form.reset(); window.stx._cleanupContainer(form); })()`)
      await Bun.sleep(10)
      expect(await view.evaluate(`fields.name()`)).toBe('keep')
    }
    finally {
      view.close()
      rmSync(dir, { recursive: true, force: true })
    }
  }, 30_000)
}
