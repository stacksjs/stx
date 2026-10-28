import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { createBrowserFixture } from '../../test-utils/browser-fixture'
import { defaultConfig } from '../../src/config'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'
import { processDirectives } from '../../src/process'

const root = join(import.meta.dir, '../../../components')
const textarea = join(root, 'src/ui/textarea/Textarea.stx')
const source = `@import('Textarea', '${textarea}')
<script client>
const disabled = state(false)
const readonly = state(false)
const initial = state(true)
const value = state('Seed')
const lazy = state('Saved')
const shown = state(true)
window.probe = { disabled, readonly, initial, value, lazy, shown, inputs: [], lazyInputs: [], legacyInputs: [], changes: [] }
</script><form><div :if="shown">
<Textarea id="field" name="field" :disabled="disabled" :readonly="readonly" v-model:value="value"
 @input="window.probe.inputs.push($event)" @change="window.probe.changes.push($event.type)" />
<Textarea id="lazy" :disabled="disabled" :readonly="readonly" v-model:value.lazy.trim="lazy"
 @input="window.probe.lazyInputs.push($event)" />
</div>
<Textarea id="legacy" value="Legacy" @input="window.probe.legacyInputs.push($event)" />
<Textarea id="default" value="Default" />
<Textarea id="falsy" disabled="false" readonly="false" value="False" />
<Textarea id="off" disabled="off" readonly="no" value="Off" />
<Textarea id="zero" disabled="0" readonly=" FaLsE " value="Zero" />
<Textarea id="disabled" disabled value="Disabled" />
<Textarea id="readonly" readonly value="Readonly" />
<Textarea id="initial" :disabled="initial" :readonly="initial" value="Initial" />
</form>`

it.each([false, true])('keeps native Textarea flags live without replacing the field (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(source, { minify })
  const phone = mountNativeScreen(code)
  const field = (id = 'field') => phone.find(node => node.type === 'TextInput' && node.props.id === id)!
  const probe = phone.context.probe
  try {
    await phone.settle()
    const original = field()
    expect(original).toBeDefined()
    for (const id of ['field', 'default', 'falsy', 'off', 'zero']) {
      expect(field(id).props.disabled).not.toBe(true)
      expect(field(id).props.editable).not.toBe(false)
    }
    expect(field('disabled').props.disabled).toBe(true)
    expect(field('readonly').props.editable).toBe(false)
    expect(field('readonly').props.disabled).not.toBe(true)
    expect(field('initial').props).toMatchObject({ disabled: true, editable: false })
    probe.initial.set(false)
    await phone.settle()
    expect(field('initial').props.disabled).toBe(false)
    expect(field('initial').props.editable).not.toBe(false)

    phone.type(field(), 'Edited')
    phone.type(field('lazy'), '  Draft  ')
    await phone.settle()
    expect(probe.value()).toBe('Edited')
    expect(probe.inputs).toEqual(['Edited'])
    expect(probe.lazy()).toBe('Saved')
    expect(probe.lazyInputs).toEqual([])

    for (const value of ['FALSE', '0', ' off ', 'no']) {
      probe.disabled.set(value)
      probe.readonly.set(value)
      await phone.settle()
      expect(field().props.disabled).not.toBe(true)
      expect(field().props.editable).not.toBe(false)
      expect(field().id).toBe(original.id)
    }
    probe.disabled.set(false)
    probe.readonly.set(false)

    for (const flag of ['disabled', 'readonly']) {
      probe[flag].set(true)
      await phone.settle()
      expect(field().id).toBe(original.id)
      expect(field().props.editable).toBe(false)
      expect(field().props.disabled === true).toBe(flag === 'disabled')
      expect(field().style.opacity === 0.5).toBe(flag === 'disabled')
      phone.type(field(), 'Rejected input')
      phone.press(field(), 'onValueChange', { text: 'Rejected change' })
      phone.type(field('lazy'), 'Rejected lazy input')
      phone.press(field('lazy'), 'onValueChange', { text: 'Rejected lazy change' })
      await phone.settle()
      expect(probe.value()).toBe('Edited')
      expect(field().props.value).toBe('Edited')
      expect(probe.inputs).toEqual(['Edited'])
      expect(probe.lazy()).toBe('Saved')
      expect(probe.lazyInputs).toEqual([])
      probe.value.set('Parent')
      await phone.settle()
      expect(field().props.value).toBe('Parent')
      probe[flag].set(undefined)
      await phone.settle()
      expect(field().props.disabled).not.toBe(true)
      expect(field().props.editable).not.toBe(false)
      expect(field().style.opacity).not.toBe(0.5)
      probe.value.set('Edited')
      await phone.settle()
    }

    phone.type(field('lazy'), '  Committed  ')
    phone.press(field('lazy'), 'onValueChange', { text: '  Committed  ' })
    phone.type(field('legacy'), 'Legacy edit')
    await phone.settle()
    expect(probe.lazy()).toBe('Committed')
    expect(probe.lazyInputs).toEqual(['Committed'])
    expect(probe.legacyInputs).toEqual(['Legacy edit'])
    expect(field().id).toBe(original.id)

    probe.shown.set(false)
    await phone.settle()
    expect(field()).toBeUndefined()
    phone.type(original, 'Stale input')
    expect(probe.value()).toBe('Edited')
    probe.disabled.set(true)
    probe.readonly.set(true)
    probe.value.set('Remounted')
    probe.shown.set(true)
    await phone.settle()
    const remounted = field()
    expect(remounted.props).toMatchObject({ value: 'Remounted', disabled: true, editable: false })
    phone.type(remounted, 'Rejected after remount')
    expect(probe.value()).toBe('Remounted')
    probe.disabled.set(false)
    await phone.settle()
    expect(field().props.disabled).toBe(false)
    expect(field().props.editable).toBe(false)
    probe.readonly.set(false)
    await phone.settle()
    expect(field().id).toBe(remounted.id)
    expect(field().props.editable).not.toBe(false)
    phone.type(field(), 'Unlocked')
    await phone.settle()
    expect(probe.value()).toBe('Unlocked')
    expect(probe.inputs).toEqual(['Edited', 'Unlocked'])
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const messages = phone.messages.length
    probe.disabled.set(true)
    probe.readonly.set(true)
    probe.value.set('Disposed')
    phone.type(original, 'Disposed callback')
    await phone.settle()
    expect(phone.messages).toHaveLength(messages)
  }
  finally { phone.unmount() }
}, 30_000)

it.each([false, true])('keeps browser Textarea flags, forms and legacy models live (minify=%s)', async (minify) => {
  const html = await processDirectives(`<!doctype html><html><head></head><body>${source}</body></html>`, {}, join(root, 'textarea-flags.stx'), { ...defaultConfig, root, cache: false, debug: !minify }, new Set())
  const fixture = createBrowserFixture({
    createServer: () => Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) }),
    createView: () => new WebView({ headless: true, backend: { type: 'chrome', url: false } }),
  })
  const { view } = fixture
  const wait = async (expression: string) => expect(await fixture.waitFor(expression, Boolean)).toBe(true)
  const read = () => view.evaluate(`(() => {
    const field = document.getElementById('field');
    return { disabled: field.disabled, readonly: field.readOnly, value: field.value, model: probe.value(),
      opacity: field.classList.contains('opacity-50'), surface: field.classList.contains('bg-surface'),
      background: field.classList.contains('bg-field'), cursor: field.classList.contains('cursor-default'),
      identical: field === window.original, posted: new FormData(document.querySelector('form')).get('field'),
      inputs: probe.inputs, lazy: probe.lazy(), lazyInputs: probe.lazyInputs, legacyInputs: probe.legacyInputs };
  })()`)
  const edit = (id: string, text: string, event: string) => view.evaluate(`(() => {
    const field = document.getElementById(${JSON.stringify(id)}); field.value = ${JSON.stringify(text)};
    field.dispatchEvent(new Event(${JSON.stringify(event)}, { bubbles: true }));
  })()`)
  try {
    await view.navigate(fixture.url)
    await wait(`!!window.probe && document.getElementById('field')?.value === 'Seed'`)
    await view.evaluate(`window.original = document.getElementById('field')`)
    expect(await view.evaluate(`['default', 'falsy', 'off', 'zero', 'disabled', 'readonly', 'initial'].map(id => {
      const field = document.getElementById(id); return [field.disabled, field.readOnly];
    })`)).toEqual([[false, false], [false, false], [false, false], [false, false], [true, false], [false, true], [true, true]])
    await view.evaluate(`probe.initial.set(false)`)
    await wait(`!document.getElementById('initial').disabled && !document.getElementById('initial').readOnly`)
    await edit('field', 'Edited', 'input')
    await edit('lazy', '  Draft  ', 'input')
    expect(await read()).toMatchObject({ model: 'Edited', inputs: ['Edited'], lazy: 'Saved', lazyInputs: [] })

    for (const value of ['FALSE', '0', ' off ', 'no']) {
      await view.evaluate(`(() => { probe.disabled.set(${JSON.stringify(value)}); probe.readonly.set(${JSON.stringify(value)}) })()`)
      await wait(`!document.getElementById('field').disabled && !document.getElementById('field').readOnly`)
      expect(await read()).toMatchObject({ identical: true, background: true })
    }
    await view.evaluate(`(() => { probe.disabled.set(false); probe.readonly.set(false) })()`)

    for (const flag of ['disabled', 'readonly']) {
      await view.evaluate(`probe.${flag}.set(true)`)
      await wait(`document.getElementById('field').${flag === 'readonly' ? 'readOnly' : 'disabled'}`)
      expect(await read()).toMatchObject({ disabled: flag === 'disabled', readonly: flag === 'readonly',
        opacity: flag === 'disabled', cursor: flag === 'readonly', surface: true, background: false,
        identical: true, posted: flag === 'disabled' ? null : 'Edited' })
      await edit('field', 'Rejected input', 'input')
      await edit('field', 'Rejected change', 'change')
      await edit('lazy', 'Rejected lazy input', 'input')
      await edit('lazy', 'Rejected lazy change', 'change')
      expect(await read()).toMatchObject({ model: 'Edited', value: 'Edited', inputs: ['Edited'], lazy: 'Saved', lazyInputs: [] })
      await view.evaluate(`probe.value.set('Parent')`)
      await wait(`document.getElementById('field').value === 'Parent'`)
      expect(await read()).toMatchObject({ posted: flag === 'disabled' ? null : 'Parent', identical: true })
      await view.evaluate(`probe.${flag}.set(undefined)`)
      await wait(`!document.getElementById('field').disabled && !document.getElementById('field').readOnly`)
      expect(await read()).toMatchObject({ surface: false, background: true, opacity: false, cursor: false })
      await view.evaluate(`probe.value.set('Edited')`)
      await wait(`document.getElementById('field').value === 'Edited'`)
    }

    await edit('lazy', '  Committed  ', 'input')
    await edit('lazy', '  Committed  ', 'change')
    await edit('legacy', 'Legacy edit', 'input')
    await edit('field', 'Edited', 'change')
    expect(await read()).toMatchObject({ lazy: 'Committed', lazyInputs: ['Committed'], legacyInputs: ['Legacy edit'] })
    expect(await view.evaluate(`probe.changes.every(type => type === 'change') && probe.changes.length > 0`)).toBe(true)
    await view.evaluate(`probe.shown.set(false)`)
    await wait(`!document.getElementById('field')`)
    await view.evaluate(`(() => { original.value = 'Stale'; original.dispatchEvent(new Event('input', { bubbles: true })) })()`)
    expect(await view.evaluate(`probe.value()`)).toBe('Edited')
    await view.evaluate(`(() => { probe.disabled.set(true); probe.readonly.set(true); probe.value.set('Remounted'); probe.shown.set(true) })()`)
    await wait(`document.getElementById('field')?.disabled && document.getElementById('field').readOnly && document.getElementById('field').value === 'Remounted'`)
    await edit('field', 'Rejected after remount', 'input')
    expect(await read()).toMatchObject({ model: 'Remounted', value: 'Remounted', inputs: ['Edited'], posted: null })
    await view.evaluate(`(() => { window.original = document.getElementById('field'); probe.disabled.set(false) })()`)
    await wait(`!document.getElementById('field').disabled && document.getElementById('field').readOnly`)
    expect(await read()).toMatchObject({ identical: true, posted: 'Remounted' })
    await view.evaluate(`probe.readonly.set(false)`)
    await wait(`!document.getElementById('field').readOnly`)
    await edit('field', 'Unlocked', 'input')
    expect(await read()).toMatchObject({ identical: true, model: 'Unlocked', inputs: ['Edited', 'Unlocked'], posted: 'Unlocked' })
  }
  finally { fixture.close() }
}, 30_000)
