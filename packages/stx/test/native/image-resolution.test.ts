import { expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { defaultConfig, loadStxConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { compileScreenSource, nativePrimitivesDir } from '../../src/native/compiler/render-screen'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'
import { clearComponentCache } from '../../src/utils'

const components = join(import.meta.dir, '../../../components')
const shared = join(components, 'src/ui/image/Image.stx')
const primitive = join(nativePrimitivesDir(), 'Image.stx')
async function fixture(source: string, plugin = true) {
  const root = createTempDir('stx-image-resolution-')
  const file = join(root, 'Screen.stx')
  await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: ${plugin ? `[${JSON.stringify(join(components, 'stx-plugin.ts'))}]` : '[]'} }`)
  await Bun.write(file, source)
  return { root, file }
}

it.each([
  ['src="/photo.png"', 'alt="Photo"'], [':src="url"', 'alt="Photo"'],
  ['src=""', 'alt="Photo"'], [':src="unset"', 'alt="Photo"'],
  ['src="/photo.png"', 'decorative'], ['src="/photo.png"', 'decorative="true"'],
  ['src="/photo.png"', 'alt="SSR caption" :alt="label"'],
])('selects the same shared file for authored Image presentation: %s %s', async (src, accessibility) => {
  const source = `<script client>const url = state('/photo.png'); const unset = state(undefined); const label=state('Updated caption')</script><section><Image ${src} ${accessibility} fit="scale-down" position="top right" /></section>`
  const { root, file } = await fixture(source)
  try {
    const result = await compileScreenSource(source, file, { root })
    expect(result.dependencies).toContain(shared)
    expect(result.dependencies).not.toContain(primitive)
    const config = await loadStxConfig(root)
    const dependencies = new Set<string>()
    const html = await processDirectives(source, {}, file, { ...defaultConfig, ...config, root, cache: false }, dependencies)
    expect(dependencies.has(shared)).toBe(true)
    expect(html).toContain('<picture')
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it.each([
  '', 'src="/plain.png" alt="Plain"', 'source="/legacy.png"', ':source="url"',
  'src="/photo.png" alt="" fit="contain"',
  'src="/photo.png" :alt="label" fit="contain"',
  'src="/photo.png" :decorative="decorative" fit="contain"',
  'src="/photo.png" decorative="false" fit="contain"',
  'src="/photo.png" alt="Photo" fit="contain" resizeMode="center"',
  'src="/photo.png" alt="Photo" fit="contain" :source="unset"',
  'src="/photo.png" alt="Photo" fit="contain" @load-start="void 0"',
  'src="/photo.png" alt="Photo" fit="contain" provider="cloudinary"',
  'src="/photo.png" alt="Photo" fit="contain" preload',
])('preserves primitive/builtin compatibility for ambiguous or legacy Image calls: %s', async (attributes) => {
  const source = `<script client>const url=state({uri:'/legacy.png'}); const unset=state(undefined); const label=state('Photo'); const decorative=state(true)</script><section><Image ${attributes} /></section>`
  const { root, file } = await fixture(source)
  try {
    const result = await compileScreenSource(source, file, { root })
    expect(result.dependencies).toContain(primitive)
    expect(result.dependencies).not.toContain(shared)
    const config = await loadStxConfig(root)
    const dependencies = new Set<string>()
    const html = await processDirectives(source, {}, file, { ...defaultConfig, ...config, root, cache: false }, dependencies)
    expect(dependencies.has(shared)).toBe(false)
    expect(html).toContain('<img')
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it('preserves explicit imports, screen-local overrides, StxImage and missing-plugin fallbacks', async () => {
  const source = '<Image src="/photo.png" alt="Photo" fit="scale-down" />'
  const { root, file } = await fixture(source)
  try {
    const explicit = await compileScreenSource(`@import('Image', '${primitive}')${source}`, file, { root })
    expect(explicit.dependencies).toContain(primitive)
    expect(explicit.dependencies).not.toContain(shared)
    const override = join(root, 'components/Image.stx')
    await Bun.write(override, '<img src="/override.png" data-local="true">')
    clearComponentCache()
    expect((await compileScreenSource(source, file, { root })).dependencies).toContain(override)
    const config = await loadStxConfig(root)
    const deps = new Set<string>()
    const html = await processDirectives('<StxImage src="/photo.png" alt="Photo" fit="contain" />', {}, file, { ...defaultConfig, ...config, root, cache: false }, deps)
    expect(deps.has(shared)).toBe(false)
    expect(html).not.toContain('<picture')
  }
  finally { await rm(root, { recursive: true, force: true }) }
  const fallback = await fixture(source, false)
  try {
    expect((await compileScreenSource(source, fallback.file, fallback)).dependencies).toContain(primitive)
  }
  finally { await rm(fallback.root, { recursive: true, force: true }) }
}, 30_000)

it.each([['ios', false], ['ios', true], ['android', false], ['android', true]] as const)('retains shared and legacy images through updates, events and remounts (%s, minify=%s)', async (platform, minify) => {
  const source = `<script client>
const src=state('/photo.png'); const legacy=state({uri:'/legacy.png'})
const fit=state('scale-down'); const position=state('25% 75%'); const shown=state(true)
window.probe={src,legacy,fit,position,shown,loads:[],errors:[]}
</script><section><div :if="shown">
<Image testID="shared" :src="src" alt="Photo" :objectFit="fit" :position="position" @load="window.probe.loads.push($event.width)" @error="window.probe.errors.push($event.message)" />
<Image testID="legacy" :source="legacy" resizeMode="contain" @load="window.probe.loads.push($event.width)" />
</div></section>`
  const { root, file } = await fixture(source)
  let phone: ReturnType<typeof mountNativeScreen> | undefined
  try {
    const result = await compileSharedScreenBundle(file, { root, minify })
    expect(result.dependencies).toContain(shared)
    expect(result.dependencies).toContain(primitive)
    phone = mountNativeScreen(result.code, 'Screen', { platform })
    await phone.settle()
    const first = phone.byTestID('shared')!
    const oldLegacy = phone.byTestID('legacy')!
    const probe = phone.context.probe
    expect(first.style).toMatchObject({ objectFit: 'scale-down', objectPosition: '25% 75%' })
    phone.press(first, 'onLoad', { width: 32 }); phone.press(oldLegacy, 'onLoad', { width: 64 })
    phone.press(first, 'onError', { message: 'missing' })
    expect(probe.loads).toEqual([32, 64]); expect(probe.errors).toEqual(['missing'])
    const start = phone.operations().length
    probe.fit.set('cover'); probe.position.set('right top')
    await phone.settle()
    expect(phone.byTestID('shared')).toBe(first)
    expect(first.style).toMatchObject({ objectFit: 'cover', objectPosition: 'right top' })
    expect(phone.operations().slice(start).some(op => op.op === 'updateNode' && op.patch.props?.source !== undefined)).toBe(false)
    probe.src.set('/replacement.png'); probe.legacy.set({uri:'/second-legacy.png'})
    await phone.settle()
    expect(phone.byTestID('shared')).toBe(first)
    expect(phone.byTestID('legacy')).toBe(oldLegacy)
    expect(first.props.source).toBe('/replacement.png')
    expect(oldLegacy.props).toMatchObject({ source: {uri:'/second-legacy.png'}, resizeMode: 'contain' })
    probe.fit.set(null); probe.position.set(null)
    await phone.settle()
    expect(first.style).toMatchObject({ objectFit: 'cover', objectPosition: 'center' })
    probe.shown.set(false); await phone.settle()
    expect(phone.byTestID('shared')).toBeUndefined()
    phone.press(first, 'onLoad', { width: 99 })
    expect(probe.loads).toEqual([32, 64])
    probe.fit.set('none'); probe.position.set('bottom'); probe.shown.set(true)
    await phone.settle()
    expect(phone.byTestID('shared')!.style).toMatchObject({ objectFit: 'none', objectPosition: 'bottom' })
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.fit.set('fill'); await phone.settle()
    expect(phone.messages).toHaveLength(count)
    const fresh = mountNativeScreen(result.code, 'Screen', { platform })
    try {
      await fresh.settle()
      expect(fresh.byTestID('shared')!.props.source).toBe('/photo.png')
      expect(fresh.byTestID('shared')!.style).toMatchObject({ objectFit: 'scale-down', objectPosition: '25% 75%' })
      expect(fresh.byTestID('legacy')!.props).toMatchObject({ source: { uri: '/legacy.png' }, resizeMode: 'contain' })
      expect(fresh.mutationErrors).toEqual([])
    }
    finally { fresh.unmount() }
  }
  finally { phone?.unmount(); await rm(root, { recursive: true, force: true }) }
}, 30_000)
