import { describe, expect, it } from 'bun:test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'

describe.each([false, true])('shared component token styles (minify=%s)', (minify) => {
  it('keeps shared controls sized and shaped across appearance and computed-class updates', async () => {
    const root = createTempDir('stx-shared-token-styles-')
    mkdirSync(join(root, 'components'))
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    for (const [name, source] of Object.entries({ Button: 'button/Button', Card: 'card/Card', TextInput: 'input/TextInput', Select: 'select/Select' }))
      await Bun.write(join(root, 'components', `Shared${name}.stx`), Bun.file(join(import.meta.dir, '../../../components/src/ui', `${source}.stx`)))
    const file = join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
const compact = state(false)
const clear = state(false)
const override = state(false)
const theme = state(null)
window.probe = { compact, clear, override, theme }
</script><div :style="theme">
  <SharedButton id="button">Save</SharedButton>
  <SharedCard id="card">Details</SharedCard>
  <SharedTextInput label="Name" />
  <SharedSelect label="Choice"><option value="one">One</option></SharedSelect>
  <div testID="density" :class="clear ? '' : compact ? 'rounded-panel px-cell-x py-cell-head-y text-cell-head bg-panel' : 'rounded-control px-control-x py-control-y text-control bg-field'" :style="override ? { paddingLeft: 7 } : {}">Density</div>
  <div class="rounded-t-unsupported">Unsupported style is reported</div>
  <div style="--stx-radius-control:3px" class="rounded-control" testID="local-theme">Local</div>
</div>`)
    const result = await compileSharedScreenBundle(file, { root, minify })
    expect(result.diagnostics).toContainEqual({ level: 'warning', message: 'unknown-class: div: rounded-t-unsupported' })
    for (const name of ['rounded-control', 'rounded-panel', 'px-control-x', 'py-control-y', 'text-control'])
      expect(result.diagnostics.filter(d => d.message.startsWith('unknown-class:') && d.message.endsWith(`: ${name}`))).toEqual([])
    const errors: unknown[][] = []
    const phone = mountNativeScreen(result.code, 'Screen', { globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args) } } })
    await phone.settle()
    const density = () => phone.byTestID('density')!
    const field = () => phone.ofType('TextInput')[0]!
    const select = () => phone.ofType('Picker')[0]!
    const card = () => phone.all().find(node => node.props.id === 'card')!
    // The shared button, field and picker are the platform's controls on a
    // native host (Button.stx, TextInput.stx, Select.stx): iOS's sizes and
    // corners, not the web's control tokens. Everything else that names a
    // token reads it, below.
    const platformField = { height: 48, borderRadius: 10, paddingHorizontal: 16, fontSize: 17 }
    expect(phone.all().find(node => node.props.id === 'button')!.style.borderRadius).toBe(10)
    expect(card().style.borderRadius).toBe(8)
    const control = { borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8, fontSize: 16, lineHeight: 24 }
    expect(field().style).toMatchObject(platformField)
    expect(select().props.items).toEqual([{ value: '', label: 'Select an option' }])
    expect(density().style).toMatchObject(control)
    const lightBackground = field().style.backgroundColor
    expect(lightBackground).toBeTruthy()
    phone.appearance('dark')
    await phone.settle()
    expect(field().style.backgroundColor).not.toBe(lightBackground)
    expect(field().style).toMatchObject(platformField)
    expect(card().style.borderRadius).toBe(8)
    phone.context.probe.compact.set(true)
    await phone.settle()
    expect(density().style).toMatchObject({ borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12, fontSize: 12, lineHeight: 16 })
    phone.context.probe.override.set(true)
    await phone.settle()
    expect(density().style.paddingLeft).toBe(7)
    phone.appearance('light')
    await phone.settle()
    expect(field().style.backgroundColor).toBe(lightBackground)
    expect(density().style.paddingLeft).toBe(7)
    phone.context.probe.clear.set(true)
    phone.context.probe.override.set(false)
    await phone.settle()
    for (const key of ['borderRadius', 'paddingHorizontal', 'paddingVertical', 'fontSize', 'lineHeight', 'paddingLeft'])
      expect(density().style[key]).toBeNull()
    phone.context.probe.theme.set({ '--stx-field': '#123456', '--stx-radius-control': '12px', '--stx-radius-panel': '20px', '--stx-control-px': '10px', '--stx-control-py': '4px', '--stx-control-text': '14px', '--stx-control-leading': '18px' })
    await phone.settle()
    // The density box again, in its control shape, now read from the theme.
    phone.context.probe.compact.set(false)
    phone.context.probe.clear.set(false)
    await phone.settle()
    const themed = { backgroundColor: '#123456', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, fontSize: 14, lineHeight: 18 }
    expect(density().style).toMatchObject(themed)
    expect(field().style).toMatchObject(platformField)
    expect(card().style.borderRadius).toBe(20)
    expect(phone.byTestID('local-theme')!.style.borderRadius).toBe(3)
    phone.appearance('dark')
    await phone.settle()
    expect(density().style).toMatchObject(themed)
    phone.context.probe.theme.set(null)
    await phone.settle()
    expect(density().style).toMatchObject(control)
    expect(field().style).toMatchObject(platformField)
    expect(field().style.backgroundColor).not.toBe(lightBackground)
    expect(card().style.borderRadius).toBe(8)
    expect(phone.mutationErrors).toEqual([])
    expect(errors).toEqual([])
  }, 30_000)
})

it('applies inherited token values at compilation regardless of attribute ordering', async () => {
  const { root } = await translateHtmlToIR('<div style="--stx-field:#123456;--stx-radius-control:12px"><input class="bg-field rounded-control"/><input class="bg-field rounded-control" style="--stx-radius-control:4px"/></div>')
  const controls = root.children.filter(child => typeof child !== 'string')
  expect(controls[0].style).toMatchObject({ backgroundColor: '#123456', borderRadius: 12 })
  expect(controls[1].style).toMatchObject({ backgroundColor: '#123456', borderRadius: 4 })
})
