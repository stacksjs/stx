import { expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { defaultConfig, loadStxConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { compileScreenSource, nativePrimitivesDir } from '../../src/native/compiler/render-screen'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'
import { clearComponentCache } from '../../src/utils'

const components = join(import.meta.dir, '../../../components')
const shared = join(components, 'src/ui/input/TextInput.stx')
const primitive = join(nativePrimitivesDir(), 'TextInput.stx')

async function fixture(source: string, withPlugin = true) {
  const root = createTempDir('stx-field-resolution-')
  const file = join(root, 'Screen.stx')
  await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: ${withPlugin ? `[${JSON.stringify(join(components, 'stx-plugin.ts'))}]` : '[]'} }`)
  await Bun.write(file, source)
  return { root, file }
}

it.each(['v-model:value="value"', 'v-model:value.lazy.trim="value"', ':value="value" @update:value="value.set($event)"'])('selects the same shared TextInput for explicit model API: %s', async (attributes) => {
  const source = `<script client>const value = state('Seed')</script><section><TextInput ${attributes} /></section>`
  const { root, file } = await fixture(source)
  try {
    const native = await compileScreenSource(source, file, { root })
    expect(native.dependencies).toContain(shared)
    expect(native.dependencies).not.toContain(primitive)
    const config = await loadStxConfig(root)
    const dependencies = new Set<string>()
    await processDirectives(source, {}, file, { ...defaultConfig, ...config, root, cache: false }, dependencies)
    expect(dependencies.has(shared)).toBe(true)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it.each(['', 'value="Seed"', ':value="value" @input="value.set($event.text)"', 'v-model:value="value" @input.once="record($event.text)"', '@submit-editing="record($event.text)"'])('retains the primitive for legacy or ambiguous calls: %s', async (attributes) => {
  const { root, file } = await fixture(`<script client>const value = state('Seed'); function record(value) {}</script><TextInput ${attributes} />`)
  try {
    const source = await Bun.file(file).text()
    const native = await compileScreenSource(source, file, { root })
    expect(native.dependencies).toContain(primitive)
    expect(native.dependencies).not.toContain(shared)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it('keeps explicit imports and screen-local overrides ahead of usage-based selection', async () => {
  const source = '<script client>const value = state("Seed")</script><TextInput v-model:value="value" />'
  const { root, file } = await fixture(source)
  try {
    const explicit = await compileScreenSource(`@import('TextInput', '${primitive}')${source}`, file, { root })
    expect(explicit.dependencies).toContain(primitive)
    expect(explicit.dependencies).not.toContain(shared)
    const override = join(root, 'components/TextInput.stx')
    await Bun.write(override, '<input data-native="TextInput" data-local="true" />')
    clearComponentCache()
    const local = await compileScreenSource(source, file, { root })
    expect(local.dependencies).toContain(override)
    expect(local.dependencies).not.toContain(shared)
    expect(local.dependencies).not.toContain(primitive)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it('falls back to the native primitive when no shared library is installed', async () => {
  const source = '<script client>const value = state("Seed")</script><TextInput v-model:value="value" />'
  const { root, file } = await fixture(source, false)
  try {
    const result = await compileScreenSource(source, file, { root })
    expect(result.dependencies).toContain(primitive)
    expect(result.dependencies).not.toContain(shared)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it.each([false, true])('keeps shared model and legacy event fields independent on one screen (minify=%s)', async (minify) => {
  const { root, file } = await fixture(`<script client>
const model = state('Shared')
const legacy = state('Legacy')
const locked = state(false)
const shown = state(true)
window.probe = { model, legacy, locked, shown, legacyInputs: [], submits: [] }
</script><section><div :if="shown">
<TextInput testID="shared" :readonly="locked" v-model:value.lazy.trim="model" @submit="window.probe.submits.push($event.text)" />
<TextInput testID="legacy" :value="legacy" @input="legacy.set($event.text); window.probe.legacyInputs.push($event.text)" />
</div></section>`)
  let phone: ReturnType<typeof mountNativeScreen> | undefined
  try {
    const result = await compileSharedScreenBundle(file, { root, minify })
    expect(result.dependencies).toContain(shared)
    expect(result.dependencies).toContain(primitive)
    phone = mountNativeScreen(result.code)
    await phone.settle()
    const field = () => phone!.byTestID('shared')!
    const probe = phone.context.probe
    phone.type(field(), ' Draft ')
    expect(probe.model()).toBe('Shared')
    phone.press(field(), 'onEndEditing', { text: ' Draft ' })
    phone.type(phone.byTestID('legacy')!, 'Legacy edit')
    await phone.settle()
    expect(probe.model()).toBe('Draft')
    expect(probe.legacy()).toBe('Legacy edit')
    expect(probe.legacyInputs).toEqual(['Legacy edit'])
    phone.press(field(), 'onSubmitEditing', { text: 'Draft' })
    expect(probe.submits).toEqual(['Draft'])
    probe.locked.set(true)
    await phone.settle()
    expect(field().props.editable).toBe(false)
    phone.type(field(), 'Blocked')
    phone.press(field(), 'onEndEditing', { text: 'Blocked' })
    expect(probe.model()).toBe('Draft')
    const old = field()
    probe.shown.set(false)
    await phone.settle()
    phone.press(old, 'onSubmitEditing', { text: 'Stale' })
    probe.model.set('Remounted')
    probe.shown.set(true)
    await phone.settle()
    expect(field().props).toMatchObject({ value: 'Remounted', editable: false })
    expect(probe.submits).toEqual(['Draft'])
    expect(phone.byTestID('legacy')!.props.value).toBe('Legacy edit')
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.model.set('Disposed')
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone?.unmount(); await rm(root, { recursive: true, force: true }) }
}, 30_000)
