import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it('keeps focus style layers separate and unsupported ring/modality classes diagnostic', async () => {
  const classes = 'border-2 focus:border-accent dark:focus:bg-black focus:dark:text-white focus:ring-2 focus:ring-offset-panel focus-visible:border-4 focus:truncate'
  const result = compileClassStyles(classes, undefined, { focus: true })
  expect(result.style).toEqual({ borderWidth: 2 })
  expect(result.focus?.style.borderColor).toBeTruthy()
  expect(result.focus?.dark).toMatchObject({ backgroundColor: '#000000', color: '#ffffff' })
  expect(result.unknown).toEqual(expect.arrayContaining(['focus:ring-2', 'focus:ring-offset-panel', 'focus-visible:border-4', 'focus:truncate']))
  expect(compileClassStyles('focus:border-4').unknown).toEqual(['focus:border-4'])
  for (const markup of ['<input class="focus:border-4">', '<textarea class="focus:border-4"></textarea>', '<div data-native="TextInput" class="focus:border-4"></div>'])
    expect((await translateHtmlToIR(markup)).diagnostics).toEqual([])
  for (const markup of ['<button class="focus:border-4">Button</button>', '<input type="checkbox" class="focus:border-4">', '<input type="hidden" class="focus:border-4">'])
    expect((await translateHtmlToIR(markup)).diagnostics.some(d => d.name === 'focus:border-4')).toBe(true)
})

describe.each([false, true])('native focus styling (minify=%s)', (minify) => {
  it('updates the actual shared TextInput, restores styles and preserves user listeners', async () => {
    const input = join(import.meta.dir, '../../../components/src/ui/input/TextInput.stx')
    const { code, diagnostics } = await compileNativeScreen(`@import('TextInput', '${input}')
<script client>
const classes = state('border-2 border-red-500 focus:border-blue-500 focus:bg-blue-100 dark:focus:border-green-500')
const styles = state({})
const shown = state(true)
const visible = state(true)
window.probe = { classes, styles, shown, visible, events: [] }
</script><section :if="shown" :show="visible">
<TextInput testID="field" label="Name" :class="classes" :style="styles"
  @focusin="window.probe.events.push('focus')" @focusout="window.probe.events.push('blur')" />
</section>`, { minify })
    expect(diagnostics.some(d => d.message.includes('focus:ring-2'))).toBe(true)
    const warnings: string[] = []
    const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, warn: (message: string) => warnings.push(message) } } })
    const field = () => phone.byTestID('field')!
    try {
      await phone.settle()
      const initial = { ...field().style }
      expect(initial.borderColor).toBe('#ef4444')
      expect(field().events.onFocus).toBeTruthy()
      phone.press(field(), 'onFocus', {})
      await phone.settle()
      expect(field().style).toMatchObject({ borderColor: '#3b82f6', backgroundColor: '#dbeafe' })
      expect(phone.context.probe.events).toEqual(['focus'])
      phone.appearance('dark')
      await phone.settle()
      expect(field().style.borderColor).toBe('#22c55e')
      phone.context.probe.styles.set({ borderColor: '#123456' })
      await phone.settle()
      expect(field().style.borderColor).toBe('#123456')
      phone.context.probe.styles.set({})
      phone.context.probe.classes.set('border-2 border-red-500 focus:border-yellow-500')
      await phone.settle()
      expect(field().style.borderColor).toBe('#eab308')
      phone.context.probe.classes.set('border-2 border-red-500')
      await phone.settle()
      expect(field().style.borderColor).toBe('#ef4444')
      phone.context.probe.classes.set('border-2 border-red-500 focus:border-blue-500')
      await phone.settle()
      expect(field().style.borderColor).toBe('#3b82f6')
      phone.press(field(), 'onBlur', {})
      await phone.settle()
      expect(field().style.borderColor).toBe('#ef4444')
      expect(phone.context.probe.events).toEqual(['focus', 'blur'])
      phone.press(field(), 'onFocus', {})
      await phone.settle()
      phone.context.probe.visible.set(false)
      await phone.settle()
      phone.context.probe.visible.set(true)
      await phone.settle()
      expect(field().style.borderColor).toBe('#ef4444')
      phone.press(field(), 'onFocus', {})
      await phone.settle()
      const old = field()
      phone.context.probe.shown.set(false)
      await phone.settle()
      phone.press(old, 'onFocus', {})
      phone.context.probe.shown.set(true)
      await phone.settle()
      expect(field().style.borderColor).toBe('#ef4444')
      phone.press(field(), 'onFocus', {})
      await phone.settle()
      expect(field().style.borderColor).toBe('#3b82f6')
      expect(warnings.filter(w => w.includes('focus:ring-2')).length).toBeGreaterThan(0)
      expect(warnings.some(w => w.includes('focus:border-'))).toBe(false)
      expect(phone.mutationErrors).toEqual([])
      phone.unmount()
      const count = phone.messages.length
      phone.context.probe.classes.set('focus:border-4')
      phone.press(old, 'onFocus', {})
      await phone.settle()
      expect(phone.messages).toHaveLength(count)
    }
    finally { phone.unmount() }
  }, 30_000)

  it('tracks focus before reactive classes arrive, clears removed fields and rejects disabled focus', async () => {
    const { code } = await compileNativeScreen(`<script client>
const classes = state('')
const disabled = state(false)
window.probe = { classes, disabled }
</script><div><input testID="late" :class="classes" :disabled="disabled" /></div>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const field = () => phone.byTestID('late')!
      expect(field().events.onFocus).toBeTruthy()
      phone.press(field(), 'onFocus', {})
      phone.context.probe.classes.set('focus:border-4 focus:translate-x-2 translate-y-1')
      await phone.settle()
      expect(field().style.borderWidth).toBe(4)
      expect(field().style.transform).toEqual([{ translateY: 4 }, { translateX: 8 }])
      phone.context.probe.classes.set('')
      await phone.settle()
      expect(field().style.borderWidth).toBeNull()
      phone.context.probe.classes.set('focus:border-4')
      phone.context.probe.disabled.set(true)
      await phone.settle()
      expect(field().style.borderWidth).toBeNull()
      phone.press(field(), 'onFocus', {})
      await phone.settle()
      expect(field().style.borderWidth).toBeNull()
      phone.context.probe.disabled.set(false)
      await phone.settle()
      expect(field().style.borderWidth).toBeNull()
      phone.press(field(), 'onFocus', {})
      await phone.settle()
      expect(field().style.borderWidth).toBe(4)
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)
})
