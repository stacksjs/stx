import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { processDirectives } from '../../src/process'

it('binds rendered default/named models, library components, and remounted instances in a real browser', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'stx-model-'))
  const view = new WebView({ headless: true })
  try {
    await Bun.write(join(dir, 'TextInput.stx'), Bun.file(resolve(import.meta.dir, '../../../components/src/ui/input/TextInput.stx')))
    await Bun.write(join(dir, 'Switch.stx'), Bun.file(resolve(import.meta.dir, '../../../components/src/ui/switch/Switch.stx')))
    await Bun.write(join(dir, 'Editor.stx'), `<script client>
const text = useModel({ default: '' })
const count = useModel('count', { default: 0 })
defineExpose({ text, count })
</script>
<div><input data-text :value="text()" @input="text.input($event.target.value)" @change="text.change($event.target.value)"><button data-count @click="count.update(n => n + 1)">Add</button></div>`)
    const html = await processDirectives(`<!doctype html><html><head></head><body>
<script client>
const text = state('initial')
const count = state(1)
const checked = state(false)
window.modelParent = { text, count, checked }
</script>
<Editor v-model.trim.lazy="text" v-model:count="count" />
<TextInput v-model:value.trim="text" />
<Switch v-model:checked="checked" />
</body></html>`, {}, join(dir, 'page.stx'), {
      componentsDir: dir,
      cache: false,
      debug: false,
    }, new Set())
    await Bun.write(join(dir, 'page.html'), html)
    await view.navigate(`file://${join(dir, 'page.html')}`)
    // Navigation can resolve before DOMContentLoaded; wait for actual bindings.
    for (let i = 0; i < 100; i++) {
      if (await view.evaluate(`!!window.modelParent && document.querySelector('[data-text]')?.value === 'initial'`)) break
      await Bun.sleep(20)
    }
    expect(await view.evaluate(`document.querySelector('[data-text]').value`)).toBe('initial')
    await view.evaluate(`(() => { var input = document.querySelector('[data-text]'); input.value = '  child  '; input.dispatchEvent(new Event('input', { bubbles: true })); })()`)
    expect(await view.evaluate('window.modelParent.text()')).toBe('initial')
    await view.evaluate(`document.querySelector('[data-text]').dispatchEvent(new Event('change', { bubbles: true }))`)
    expect(await view.evaluate('window.modelParent.text()')).toBe('child')
    await view.evaluate(`document.querySelector('[data-count]').click()`)
    expect(await view.evaluate('window.modelParent.count()')).toBe(2)
    await view.evaluate(`window.modelParent.text.set('parent')`)
    await Bun.sleep(30)
    expect(await view.evaluate(`document.querySelector('[data-text]').value`)).toBe('parent')
    await view.evaluate(`document.querySelector('[role=switch]').click()`)
    expect(await view.evaluate('window.modelParent.checked()')).toBe(true)
    await view.evaluate(`(() => { var libraryInput = document.querySelector('input:not([data-text])'); libraryInput.value = '  library  '; libraryInput.dispatchEvent(new Event('input', { bubbles: true })); })()`)
    expect(await view.evaluate('window.modelParent.text()')).toBe('library')
    // Keep a reference across teardown: the detached model must be inert.
    await view.evaluate(`(() => { var root = document.querySelector('[data-text]').closest('[data-stx-scope]'); window.oldModel = root.__stx_exposed.text; window.stx._cleanupContainer(root); root.remove(); oldModel.set('stale'); })()`)
    expect(await view.evaluate('window.modelParent.text()')).toBe('library')
    await view.navigate(`file://${join(dir, 'page.html')}?remount`)
    for (let i = 0; i < 100; i++) {
      if (await view.evaluate(`!!window.modelParent && document.querySelector('[data-text]')?.value === 'initial'`)) break
      await Bun.sleep(20)
    }
    expect(await view.evaluate(`document.querySelector('[data-text]').value`)).toBe('initial')
    await view.evaluate(`document.querySelector('[data-count]').click()`)
    expect(await view.evaluate('window.modelParent.count()')).toBe(2)
  }
  finally {
    view.close()
    rmSync(dir, { recursive: true, force: true })
  }
}, 30_000)
