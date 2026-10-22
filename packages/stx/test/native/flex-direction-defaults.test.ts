import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it('uses CSS row defaults only for explicitly authored flex containers', async () => {
  const compile = async (attrs: string) => (await translateHtmlToIR(`<div ${attrs}><span>A</span><span>B</span></div>`)).root.style
  expect((await compile('class="flex"')).flexDirection).toBe('row')
  expect((await compile('class="inline-flex"')).flexDirection).toBe('row')
  expect((await compile('style="display:flex"')).flexDirection).toBe('row')
  expect(await compile('style="display:inline-flex"')).toMatchObject({ display: 'flex', flexDirection: 'row' })
  expect((await compile('class="flex-col" style="display:flex"')).flexDirection).toBe('column')
  expect((await compile('class="flex" style="flex-direction:column"')).flexDirection).toBe('column')
  expect((await compile('class="flex-col inline-flex"')).flexDirection).toBe('column')
  expect((await compile('')).flexDirection).toBeUndefined()
  expect((await compile('class="grid grid-cols-2"')).flexDirection).toBeUndefined()
})

describe.each([false, true])('native CSS flex defaults (minify=%s)', (minify) => {
  it('resolves direction after class, inline, reactive and appearance layers, including removal', async () => {
    const { code } = await compileNativeScreen(`<script client>
const styles = state({})
const classes = state('flex dark:flex-col')
const shown = state(true)
window.probe = { styles, classes, shown }
</script><div>
<div :if="shown" testID="layout" :class="classes" :style="styles"><span>A</span><span>B</span></div>
<View testID="native"><Text>A</Text><Text>B</Text></View>
</div>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const layout = () => phone.byTestID('layout')!
      expect(layout().style.flexDirection).toBe('row')
      expect(phone.byTestID('native')!.style.flexDirection).toBeUndefined()
      phone.appearance('dark')
      await phone.settle()
      expect(layout().style.flexDirection).toBe('column')
      phone.context.probe.styles.set({ display: 'flex' })
      await phone.settle()
      // A default must not override a direction supplied by a lower layer.
      expect(layout().style.flexDirection).toBe('column')
      phone.context.probe.styles.set({ display: 'inline-flex' })
      await phone.settle()
      expect(layout().style).toMatchObject({ display: 'flex', flexDirection: 'column' })
      phone.context.probe.styles.set({ flexDirection: 'row-reverse' })
      await phone.settle()
      expect(layout().style.flexDirection).toBe('row-reverse')
      phone.context.probe.styles.set({})
      phone.appearance('light')
      await phone.settle()
      expect(layout().style.flexDirection).toBe('row')
      phone.context.probe.classes.set('')
      await phone.settle()
      expect(layout().style.flexDirection).toBeNull()
      phone.context.probe.styles.set({ display: 'flex' })
      await phone.settle()
      expect(layout().style.flexDirection).toBe('row')
      phone.context.probe.shown.set(false)
      await phone.settle()
      phone.context.probe.shown.set(true)
      await phone.settle()
      expect(layout().style.flexDirection).toBe('row')
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)

  it('lays out actual shared Checkbox and Switch label/control containers horizontally', async () => {
    const checkbox = join(import.meta.dir, '../../../components/src/ui/checkbox/Checkbox.stx')
    const toggle = join(import.meta.dir, '../../../components/src/ui/switch/Switch.stx')
    const { code } = await compileNativeScreen(`@import('Checkbox', '${checkbox}')
@import('Switch', '${toggle}')
<div><Checkbox label="Consent" /><Switch label="Alerts" /></div>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      // The shared Switch is the platform switch natively, at the end of its row.
      const toggle = phone.ofType('Switch')[0]!
      const switchRow = phone.all().find(node => node.children.includes(toggle))!
      expect(switchRow.style.flexDirection).toBe('row')
      const control = phone.ofType('Checkbox')[0]!
      const inputWrapper = phone.all().find(node => node.children.includes(control))!
      const checkboxRow = phone.all().find(node => node.children.includes(inputWrapper))!
      expect(checkboxRow.style.flexDirection).toBe('row')
    }
    finally { phone.unmount() }
  }, 30_000)
})
