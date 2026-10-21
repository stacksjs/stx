import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'
import { createNativeHost } from '../../src/native/runtime/native-host'

describe.each([false, true])('focus-within shared components (minify=%s)', (minify) => {
  it('styles shared Card ancestors from shared fields, restores layers and disposes focus state', async () => {
    const base = join(import.meta.dir, '../../../components/src/ui')
    const { code, diagnostics } = await compileNativeScreen(`@import('Card', '${base}/card/Card.stx')
@import('TextInput', '${base}/input/TextInput.stx')
<script client>
const classes = state('border-red-500 dark:border-red-500 focus-within:border-blue-500 dark:focus-within:border-green-500')
const styles = state({})
const shown = state(true)
const visible = state(true)
const disabled = state(false)
window.probe = { classes, styles, shown, visible, disabled }
</script><div testID="outer" class="focus-within:opacity-50">
<Card testID="card" :class="classes" :style="styles">
<div :if="shown" :show="visible">
<TextInput testID="first" label="First" />
<TextInput testID="second" label="Second" />
<input testID="raw" :disabled="disabled" />
</div></Card></div>`, { minify })
    expect(diagnostics.some(d => d.message.includes('unknown-class') && d.message.includes('focus-within'))).toBe(false)
    const phone = mountNativeScreen(code)
    const card = () => phone.byTestID('card')!
    const outer = () => phone.byTestID('outer')!
    const field = (name = 'first') => phone.byTestID(name)!
    const focus = async (name = 'first') => { phone.press(field(name), 'onFocus', {}); await phone.settle() }
    try {
      await phone.settle()
      expect(card().style.borderColor).toBe('#ef4444')
      expect(outer().style.opacity).toBeUndefined()
      await focus()
      expect(card().style.borderColor).toBe('#3b82f6')
      expect(outer().style.opacity).toBe(0.5)
      phone.appearance('dark')
      await phone.settle()
      expect(card().style.borderColor).toBe('#22c55e')
      phone.context.probe.styles.set({ borderColor: '#123456' })
      await phone.settle()
      expect(card().style.borderColor).toBe('#123456')
      phone.context.probe.styles.set({})
      phone.context.probe.classes.set('border-red-500 dark:border-red-500 focus-within:border-yellow-500')
      await phone.settle()
      expect(card().style.borderColor).toBe('#eab308')
      phone.context.probe.classes.set('border-red-500 dark:border-red-500')
      await phone.settle()
      expect(card().style.borderColor).toBe('#ef4444')
      phone.context.probe.classes.set('border-red-500 dark:border-red-500 focus-within:border-blue-500')
      await phone.settle()
      expect(card().style.borderColor).toBe('#3b82f6')
      // Hosts may deliver the new focus before the preceding blur. One
      // descendant blurring must not clear another descendant's focus.
      await focus('second')
      phone.press(field(), 'onBlur', {})
      await phone.settle()
      expect(card().style.borderColor).toBe('#3b82f6')
      phone.press(field('second'), 'onBlur', {})
      await phone.settle()
      expect(card().style.borderColor).toBe('#ef4444')
      expect(outer().style.opacity).toBeNull()
      await focus('raw')
      phone.context.probe.disabled.set(true)
      await phone.settle()
      expect(card().style.borderColor).toBe('#ef4444')
      await focus()
      phone.context.probe.visible.set(false)
      await phone.settle()
      expect(card().style.borderColor).toBe('#ef4444')
      // A queued focus from before the hide must not re-focus hidden input.
      phone.press(field(), 'onFocus', {})
      await phone.settle()
      phone.context.probe.visible.set(true)
      await phone.settle()
      expect(card().style.borderColor).toBe('#ef4444')
      await focus()
      const removed = field()
      phone.context.probe.shown.set(false)
      await phone.settle()
      expect(card().style.borderColor).toBe('#ef4444')
      expect(outer().style.opacity).toBeNull()
      phone.press(removed, 'onFocus', {})
      await phone.settle()
      expect(card().style.borderColor).toBe('#ef4444')
      phone.context.probe.shown.set(true)
      await phone.settle()
      expect(card().style.borderColor).toBe('#ef4444')
      await focus()
      expect(card().style.borderColor).toBe('#3b82f6')
      expect(phone.mutationErrors).toEqual([])
      phone.unmount()
      const count = phone.messages.length
      phone.context.probe.classes.set('focus-within:border-4')
      await phone.settle()
      expect(phone.messages).toHaveLength(count)
    }
    finally { phone.unmount() }
  }, 30_000)
})

it('moves ancestor focus ownership with a live subtree without copying focus into clones', () => {
  const host = createNativeHost({ send() {}, schedule() {} })
  const root = host.adopt({ __stxId: 'root' }, 'View', null, { props: {}, style: {}, events: {}, children: [], _classes: 'focus-within:p-2' })
  const owner = (id: string) => host.adopt({ __stxId: id }, 'View', null, { props: {}, style: {}, events: {}, children: [], _classes: 'opacity-100 focus-within:opacity-50' })
  const left = owner('left')
  const right = owner('right')
  const field = host.adopt({ __stxId: 'field' }, 'TextInput')
  host.insert(root, left)
  host.insert(root, right)
  host.insert(left, field)
  host.dispatch(host.snapshot(field).events.onFocus)
  expect(host.snapshot(left).style.opacity).toBe(0.5)
  expect(host.snapshot(right).style.opacity).toBe(1)
  expect(host.snapshot(root).style.padding).toBe(8)
  host.insert(right, field)
  expect(host.snapshot(left).style.opacity).toBe(1)
  expect(host.snapshot(right).style.opacity).toBe(0.5)
  const copy = host.clone(field)
  host.insert(left, copy)
  expect(host.snapshot(left).style.opacity).toBe(1)
  const copiedFocus = host.snapshot(copy).events.onFocus
  expect(copiedFocus).not.toBe(host.snapshot(field).events.onFocus)
  host.dispatch(copiedFocus)
  host.dispatch(host.snapshot(field).events.onBlur)
  expect(host.snapshot(left).style.opacity).toBe(0.5)
  expect(host.snapshot(right).style.opacity).toBe(1)
  host.remove(copy)
  expect(host.snapshot(left).style.opacity).toBe(1)
  expect(host.snapshot(root).style.padding).toBeUndefined()
  host.dispatch(copiedFocus)
  expect(host.snapshot(root).style.padding).toBeUndefined()
  host.dispose()
})
