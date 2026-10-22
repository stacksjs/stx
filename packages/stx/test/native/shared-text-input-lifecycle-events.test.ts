import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const input = join(import.meta.dir, '../../../components/src/ui/input/TextInput.stx')

it.each([false, true])('delivers shared TextInput focus/blur/submit once and keeps lazy commits separate (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`@import('TextInput', '${input}')
<script client>
const value = state('Seed')
const shown = state(true)
const disabled = state(false)
const readonly = state(false)
window.probe = { value, shown, disabled, readonly, focus: [], blur: [], submits: [], aliases: [], inputs: [], focusins: 0, focusouts: 0 }
</script><section><div :if="shown">
<TextInput testID="field" :disabled="disabled" :readonly="readonly" v-model:value.lazy="value"
 @focus="window.probe.focus.push([$event.text, $event.target.value])"
 @blur="window.probe.blur.push([$event.text, $event.target.value])"
 @focusin="window.probe.focusins++" @focusout="window.probe.focusouts++"
 @submit-editing="window.probe.submits.push([$event.text, $event.target.value])"
 @submit="window.probe.aliases.push($event.text)" @input="window.probe.inputs.push($event)" />
</div></section>`, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    const field = () => phone.byTestID('field')!
    const probe = phone.context.probe
    phone.press(field(), 'onFocus', { text: 'Seed' })
    expect(probe.focus).toEqual([['Seed', 'Seed']])
    expect(probe.focusins).toBe(1)
    phone.type(field(), 'Draft')
    phone.press(field(), 'onSubmitEditing', { text: 'Draft' })
    expect(probe.submits).toEqual([['Draft', 'Draft']])
    expect(probe.aliases).toEqual(['Draft'])
    expect(probe.value()).toBe('Seed')
    expect(probe.inputs).toEqual([])
    phone.press(field(), 'onBlur', { text: 'Draft' })
    expect(probe.blur).toEqual([['Draft', 'Draft']])
    expect(probe.focusouts).toBe(1)
    phone.press(field(), 'onEndEditing', { text: 'Draft' })
    await phone.settle()
    expect(probe.value()).toBe('Draft')
    expect(probe.inputs).toEqual(['Draft'])
    // Readonly still permits focus and blur; it is not disabled.
    probe.readonly.set(true)
    await phone.settle()
    phone.press(field(), 'onFocus', { text: 'Draft' })
    phone.press(field(), 'onBlur', { text: 'Draft' })
    expect(probe.focus).toHaveLength(2)
    expect(probe.blur).toHaveLength(2)
    probe.disabled.set(true)
    await phone.settle()
    phone.press(field(), 'onFocus', { text: 'Blocked' })
    phone.press(field(), 'onSubmitEditing', { text: 'Blocked' })
    expect(probe.focus).toHaveLength(2)
    expect(probe.submits).toHaveLength(1)
    const old = field()
    probe.shown.set(false)
    await phone.settle()
    phone.press(old, 'onFocus', { text: 'Stale' })
    phone.press(old, 'onBlur', { text: 'Stale' })
    phone.press(old, 'onSubmitEditing', { text: 'Stale' })
    expect(probe.focus).toHaveLength(2)
    expect(probe.blur).toHaveLength(2)
    expect(probe.submits).toHaveLength(1)
    probe.disabled.set(false)
    probe.readonly.set(false)
    probe.value.set('Remount')
    probe.shown.set(true)
    await phone.settle()
    phone.press(field(), 'onFocus', { text: 'Remount' })
    phone.press(field(), 'onSubmitEditing', { text: 'Remount' })
    phone.press(field(), 'onBlur', { text: 'Remount' })
    expect(probe.focus).toHaveLength(3)
    expect(probe.blur).toHaveLength(3)
    expect(probe.submits).toEqual([['Draft', 'Draft'], ['Remount', 'Remount']])
    expect(probe.aliases).toEqual(['Draft', 'Remount'])
    expect(probe.focusins).toBe(3)
    expect(probe.focusouts).toBe(3)
    expect(phone.mutationErrors).toEqual([])
    const removed = field()
    phone.unmount()
    const count = phone.messages.length
    phone.press(removed, 'onFocus', { text: 'Disposed' })
    phone.press(removed, 'onSubmitEditing', { text: 'Disposed' })
    await phone.settle()
    expect(probe.focus).toHaveLength(3)
    expect(probe.submits).toHaveLength(2)
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)

it.each([false, true])('preserves legacy primitive lifecycle event payloads (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`<script client>
window.events = []
</script><section><TextInput testID="legacy" value="Legacy"
 @focus="window.events.push(['focus', $event.text, $event.marker])"
 @blur="window.events.push(['blur', $event.text, $event.marker])"
 @submit-editing="window.events.push(['submit-editing', $event.text, $event.marker])"
 @submit="window.events.push(['submit', $event.text, $event.marker])" /></section>`, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    const field = phone.byTestID('legacy')!
    phone.press(field, 'onFocus', { text: 'Legacy', marker: 1 })
    phone.press(field, 'onSubmitEditing', { text: 'Legacy', marker: 2 })
    phone.press(field, 'onBlur', { text: 'Legacy', marker: 3 })
    expect(phone.context.events).toEqual([
      ['focus', 'Legacy', 1], ['submit-editing', 'Legacy', 2], ['submit', 'Legacy', 2], ['blur', 'Legacy', 3],
    ])
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)
