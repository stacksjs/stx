import { describe, expect, it } from 'bun:test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

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
window.probe = { compact, clear, override }
</script><div>
  <SharedButton id="button">Save</SharedButton>
  <SharedCard id="card">Details</SharedCard>
  <SharedTextInput label="Name" />
  <SharedSelect label="Choice"><option value="one">One</option></SharedSelect>
  <div testID="density" :class="clear ? '' : compact ? 'rounded-panel px-cell-x py-cell-head-y text-cell-head bg-panel' : 'rounded-control px-control-x py-control-y text-control bg-field'" :style="override ? { paddingLeft: 7 } : {}">Density</div>
  <div class="rounded-t-unsupported">Unsupported style is reported</div>
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
    expect(phone.all().find(node => node.props.id === 'button')!.style.borderRadius).toBe(6)
    expect(card().style.borderRadius).toBe(8)
    const control = { borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8, fontSize: 16, lineHeight: 24 }
    expect(field().style).toMatchObject(control)
    expect(select().style).toMatchObject(control)
    expect(density().style).toMatchObject(control)
    const lightBackground = field().style.backgroundColor
    expect(lightBackground).toBeTruthy()
    phone.appearance('dark')
    await phone.settle()
    expect(field().style.backgroundColor).not.toBe(lightBackground)
    expect(field().style).toMatchObject(control)
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
    expect(errors).toEqual([])
  }, 30_000)
})
