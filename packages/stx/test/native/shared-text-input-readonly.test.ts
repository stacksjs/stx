import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const root = join(import.meta.dir, '../../../components')
const input = join(root, 'src/ui/input/TextInput.stx')
const source = `@import('TextInput', '${input}')
<script client>
const readonly = state(false)
const disabled = state(false)
const value = state('Seed')
const lazy = state('Saved')
const shown = state(true)
const initiallyReadonly = state(true)
window.probe = { readonly, disabled, value, lazy, shown, initiallyReadonly, inputs: [], lazyInputs: [], clears: 0 }
</script><form><div :if="shown">
<TextInput id="field" testID="field" name="field" clearable :readonly="readonly" :disabled="disabled"
 v-model:value="value" @input="window.probe.inputs.push($event)" @clear="window.probe.clears++" />
<TextInput id="lazy" testID="lazy" :readonly="readonly" v-model:value.lazy="lazy"
 @input="window.probe.lazyInputs.push($event)" />
</div><TextInput id="literal" testID="literal" readonly value="Literal" />
<TextInput id="initial" testID="initial" :readonly="initiallyReadonly" value="Initial" /></form>`

it.each([false, true])('reacts to shared native readonly without disabling parent writes (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(source, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    const field = () => phone.byTestID('field')!
    const lazy = () => phone.byTestID('lazy')!
    const probe = phone.context.probe
    const clear = () => phone.all().find(node => node.props.accessibilityLabel === 'Clear input')!
    const original = field()
    expect(phone.byTestID('literal')!.props.editable).toBe(false)
    phone.type(phone.byTestID('literal')!, 'Rejected literal')
    await phone.settle()
    expect(phone.byTestID('literal')!.props.value).toBe('Literal')
    expect(phone.byTestID('initial')!.props.editable).toBe(false)
    probe.initiallyReadonly.set(false)
    await phone.settle()
    expect(phone.byTestID('initial')!.props.editable).not.toBe(false)
    phone.type(phone.byTestID('initial')!, 'Initially unlocked')
    await phone.settle()
    expect(phone.byTestID('initial')!.props.value).toBe('Initially unlocked')
    phone.type(field(), 'Edited')
    phone.type(lazy(), 'Draft')
    await phone.settle()
    expect(probe.inputs).toEqual(['Edited'])
    expect(probe.lazy()).toBe('Saved')
    probe.readonly.set(true)
    await phone.settle()
    expect(field().id).toBe(original.id)
    expect(field().props.editable).toBe(false)
    expect(field().props.disabled).not.toBe(true)
    expect(clear().style.display).toBe('none')
    // Inject callbacks even though a conforming host won't edit a readonly field.
    phone.type(field(), 'Rejected input')
    phone.press(field(), 'onValueChange', { text: 'Rejected change' })
    phone.press(field(), 'onEndEditing', { text: 'Rejected commit' })
    phone.press(lazy(), 'onEndEditing', { text: 'Draft' })
    phone.press(clear())
    await phone.settle()
    expect(probe.value()).toBe('Edited')
    expect(field().props.value).toBe('Edited')
    expect(probe.lazy()).toBe('Saved')
    expect(lazy().props.value).toBe('Saved')
    expect(probe.inputs).toEqual(['Edited'])
    expect(probe.lazyInputs).toEqual([])
    expect(probe.clears).toBe(0)
    probe.value.set('Parent')
    await phone.settle()
    expect(field().props.value).toBe('Parent')
    probe.disabled.set(true)
    probe.readonly.set(false)
    await phone.settle()
    expect(field().props.editable).toBe(false)
    phone.type(field(), 'Still disabled')
    expect(probe.value()).toBe('Parent')
    probe.disabled.set(false)
    await phone.settle()
    expect(field().props.editable).not.toBe(false)
    expect(clear().style.display).not.toBe('none')
    phone.type(field(), 'Unlocked')
    phone.type(lazy(), 'Committed')
    phone.press(lazy(), 'onEndEditing', { text: 'Committed' })
    await phone.settle()
    expect(probe.value()).toBe('Unlocked')
    expect(probe.lazyInputs).toEqual(['Committed'])
    phone.press(clear())
    await phone.settle()
    expect(probe.value()).toBe('')
    expect(probe.clears).toBe(1)
    probe.shown.set(false)
    await phone.settle()
    phone.type(original, 'Stale')
    probe.readonly.set(true)
    probe.value.set('Remounted')
    probe.shown.set(true)
    await phone.settle()
    expect(field().props).toMatchObject({ value: 'Remounted', editable: false })
    phone.type(field(), 'Rejected after remount')
    expect(probe.value()).toBe('Remounted')
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.readonly.set(false)
    probe.value.set('Disposed')
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)

it('updates browser readonly, styles, clear visibility and form values without changing disabled semantics', async () => {
  const html = await processDirectives(`<!doctype html><html><head></head><body>${source}</body></html>`, {}, join(root, 'readonly.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) })
  const view = new WebView({ headless: true })
  const waitFor = async (expression: string) => {
    for (let i = 0; i < 150; i++) {
      if (await view.evaluate(expression)) return
      await Bun.sleep(20)
    }
    throw new Error(`Browser condition not reached: ${expression}`)
  }
  const read = () => view.evaluate(`JSON.stringify((() => {
    const f = document.getElementById('field');
    const clear = document.querySelector('[aria-label="Clear input"]');
    return { readonly: f.readOnly, disabled: f.disabled, value: f.value, model: probe.value(),
      surface: f.classList.contains('bg-surface'), field: f.classList.contains('bg-field'),
      clearHidden: getComputedStyle(clear.parentElement).display === 'none',
      posted: new FormData(document.querySelector('form')).get('field'), inputs: probe.inputs, clears: probe.clears };
  })())`).then(JSON.parse)
  try {
    await view.navigate(server.url.href)
    await waitFor(`!!window.probe && document.getElementById('field')?.value === 'Seed'`)
    expect(await view.evaluate(`document.getElementById('literal').readOnly`)).toBe(true)
    expect(await view.evaluate(`document.getElementById('initial').readOnly`)).toBe(true)
    await view.evaluate(`probe.initiallyReadonly.set(false)`)
    await waitFor(`!document.getElementById('initial').readOnly`)
    await view.evaluate(`probe.readonly.set(true)`)
    await waitFor(`document.getElementById('field').readOnly`)
    expect(await read()).toMatchObject({ readonly: true, disabled: false, surface: true, field: false, clearHidden: true, posted: 'Seed' })
    await view.evaluate(`(() => {
      const f = document.getElementById('field');
      f.value = 'Rejected'; f.dispatchEvent(new Event('input', { bubbles: true }));
      f.value = 'Rejected change'; f.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('[aria-label="Clear input"]').click();
    })()`)
    expect(await read()).toMatchObject({ model: 'Seed', value: 'Seed', inputs: [], clears: 0 })
    await view.evaluate(`probe.value.set('Parent')`)
    await waitFor(`document.getElementById('field').value === 'Parent'`)
    expect((await read()).posted).toBe('Parent')
    await view.evaluate(`(() => { probe.disabled.set(true); probe.readonly.set(false) })()`)
    await waitFor(`document.getElementById('field').disabled && !document.getElementById('field').readOnly`)
    expect(await read()).toMatchObject({ posted: null, clearHidden: true })
    await view.evaluate(`probe.disabled.set(false)`)
    await waitFor(`!document.getElementById('field').disabled`)
    expect(await read()).toMatchObject({ readonly: false, surface: false, field: true, clearHidden: false })
    await view.evaluate(`(() => { const f = document.getElementById('field'); f.value = 'Unlocked'; f.dispatchEvent(new Event('input', { bubbles: true })); })()`)
    expect(await read()).toMatchObject({ model: 'Unlocked', inputs: ['Unlocked'] })
    await view.evaluate(`document.querySelector('[aria-label="Clear input"]').click()`)
    expect(await read()).toMatchObject({ model: '', inputs: ['Unlocked', ''], clears: 1 })
    await view.evaluate(`probe.shown.set(false)`)
    await waitFor(`!document.getElementById('field')`)
    await view.evaluate(`(() => { probe.readonly.set(true); probe.value.set('Remounted'); probe.shown.set(true) })()`)
    await waitFor(`document.getElementById('field')?.readOnly && document.getElementById('field').value === 'Remounted'`)
    expect(await read()).toMatchObject({ clearHidden: true, posted: 'Remounted' })
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
