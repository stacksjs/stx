import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const input = join(import.meta.dir, '../../../components/src/ui/input/TextInput.stx')

it.each([false, true])('commits shared lazy input on native end-editing without leaking raw input events (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`@import('TextInput', '${input}')
<script client>
const value = state('Seed')
const live = state('Live')
const shown = state(true)
const disabled = state(false)
const numeric = state(1)
const trimmed = state('Trim')
window.probe = { value, live, shown, disabled, numeric, trimmed, inputs: [], changes: [], numbers: [], numberChanges: [], liveInputs: [], liveChanges: [], trimmedInputs: [] }
</script><section><div :if="shown">
<TextInput testID="lazy" :disabled="disabled" v-model:value.lazy.trim="value"
 @input="window.probe.inputs.push(typeof $event === 'object' ? 'RAW_EVENT' : $event)" @change="window.probe.changes.push($event.target.value)"
 />
<TextInput testID="live" :value="live" @input="live.set($event); window.probe.liveInputs.push($event)"
 @change="window.probe.liveChanges.push($event.target.value)" />
<TextInput testID="numeric" clearable v-model:value.lazy.number="numeric" @input="window.probe.numbers.push($event)"
 @change="window.probe.numberChanges.push($event.type)" />
<TextInput testID="trimmed" v-model:value.trim="trimmed" @input="window.probe.trimmedInputs.push($event)" />
</div></section>`, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    const field = () => phone.byTestID('lazy')!
    const probe = phone.context.probe
    phone.press(field(), 'onFocus', { text: 'Seed' })
    phone.type(field(), ' Pending ')
    await phone.settle()
    expect(probe.value()).toBe('Seed')
    expect(probe.inputs).toEqual([])
    expect(field().props.value).toBe(' Pending ')
    // The final host payload can be newer than its last change-text callback.
    phone.press(field(), 'onEndEditing', { text: ' Final ' })
    await phone.settle()
    expect(probe.value()).toBe('Final')
    expect(probe.inputs).toEqual(['Final'])
    expect(probe.changes).toEqual(['Final'])
    phone.press(field(), 'onEndEditing', { text: ' Final ' })
    await phone.settle()
    expect(probe.inputs).toEqual(['Final'])
    expect(probe.changes).toHaveLength(1)
    const live = phone.byTestID('live')!
    phone.press(live, 'onFocus', { text: 'Live' })
    phone.type(live, 'Immediate')
    await phone.settle()
    expect(probe.live()).toBe('Immediate')
    expect(probe.liveInputs).toEqual(['Immediate'])
    phone.press(live, 'onEndEditing', { text: 'Immediate' })
    await phone.settle()
    expect(probe.liveInputs).toEqual(['Immediate'])
    expect(probe.liveChanges).toEqual(['Immediate'])
    const trimmed = phone.byTestID('trimmed')!
    phone.type(trimmed, ' Trimmed ')
    phone.press(trimmed, 'onEndEditing', { text: ' Trimmed ' })
    await phone.settle()
    expect(probe.trimmed()).toBe('Trimmed')
    expect(probe.trimmedInputs).toEqual(['Trimmed'])
    const number = phone.byTestID('numeric')!
    phone.type(number, '12')
    expect(probe.numeric()).toBe(1)
    phone.press(number, 'onEndEditing', { text: '12' })
    await phone.settle()
    expect(probe.numeric()).toBe(12)
    expect(probe.numbers).toEqual([12])
    // Existing synthetic change callers remain event-shaped on every commit.
    phone.press(number, 'onValueChange', { text: '13' })
    phone.press(number, 'onValueChange', { text: '14' })
    await phone.settle()
    expect(probe.numeric()).toBe(14)
    expect(probe.numbers).toEqual([12, 13, 14])
    expect(probe.numberChanges).toEqual(['change', 'change', 'change'])
    phone.press(phone.all().find(node => node.props.accessibilityLabel === 'Clear input')!)
    await phone.settle()
    expect(probe.numeric()).toBe('')
    expect(probe.numbers).toEqual([12, 13, 14, ''])
    probe.disabled.set(true)
    await phone.settle()
    phone.press(field(), 'onEndEditing', { text: 'Blocked' })
    expect(probe.value()).toBe('Final')
    const old = field()
    probe.shown.set(false)
    await phone.settle()
    phone.press(old, 'onEndEditing', { text: 'Stale' })
    probe.disabled.set(false)
    probe.value.set('Remount')
    probe.shown.set(true)
    await phone.settle()
    phone.press(field(), 'onFocus', { text: 'Remount' })
    phone.type(field(), 'Again')
    phone.press(field(), 'onEndEditing', { text: 'Again' })
    await phone.settle()
    expect(probe.inputs).toEqual(['Final', 'Again'])
    expect(probe.value()).toBe('Again')
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    phone.press(old, 'onEndEditing', { text: 'Disposed' })
    probe.value.set('After disposal')
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)

it.each([false, true])('preserves legacy primitive input/end/submit event objects (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`<script client>
const value = state('Legacy')
window.probe = { value, inputs: [], ends: [], submits: [] }
</script><section><TextInput testID="legacy" :value="value"
 @input="window.probe.inputs.push($event.text); value.set($event.text)"
 @end-editing="window.probe.ends.push($event.text)"
 @submit-editing="window.probe.submits.push($event.text)" /></section>`, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    const field = phone.byTestID('legacy')!
    phone.type(field, 'Legacy edit')
    phone.press(field, 'onEndEditing', { text: 'Legacy end' })
    phone.press(field, 'onSubmitEditing', { text: 'Legacy submit' })
    await phone.settle()
    expect(phone.context.probe.inputs).toEqual(['Legacy edit'])
    expect(phone.context.probe.ends).toEqual(['Legacy end'])
    expect(phone.context.probe.submits).toEqual(['Legacy submit'])
    expect(phone.context.probe.value()).toBe('Legacy edit')
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)
