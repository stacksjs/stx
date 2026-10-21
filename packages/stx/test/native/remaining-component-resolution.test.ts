import { expect, it } from 'bun:test'
import { readdir, rm } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { defaultConfig, loadStxConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { compileScreenSource, nativePrimitivesDir } from '../../src/native/compiler/render-screen'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'
import { clearComponentCache } from '../../src/utils'

const components = join(import.meta.dir, '../../../components')
const remaining = [
  ['TextInput', 'input', 'value="Seed" placeholder="Name"'],
  ['Image', 'image', 'src="/photo.jpg" source="/photo.jpg" alt="Photo"'],
  ['Video', 'video', 'src="/movie.mp4" source="/movie.mp4" label="Movie"'],
] as const

it('inventories every shared/native name collision so new overlaps require a compatibility decision (#2091)', async () => {
  const primitives = (await readdir(nativePrimitivesDir())).filter(name => name.endsWith('.stx')).map(name => basename(name, '.stx'))
  const shared = new Set((await readdir(join(components, 'src'), { recursive: true })).filter(name => name.endsWith('.stx')).map(name => basename(name, '.stx')))
  expect(primitives.filter(name => shared.has(name)).sort()).toEqual(['Button', 'Checkbox', 'Image', 'Switch', 'TextInput', 'Video'])
})

it.each(remaining)('%s keeps its native contract until shared migration is verified', async (name, directory, attributes) => {
  const root = createTempDir('stx-remaining-resolution-')
  const file = join(root, 'Screen.stx')
  const source = `<div><${name} ${attributes} /></div>`
  const shared = join(components, 'src/ui', directory, `${name}.stx`)
  try {
    await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: [${JSON.stringify(join(components, 'stx-plugin.ts'))}] }`)
    await Bun.write(file, source)
    const native = await compileScreenSource(source, file, { root })
    expect(native.dependencies).toContain(join(nativePrimitivesDir(), `${name}.stx`))
    expect(native.dependencies).not.toContain(shared)
    const loaded = await loadStxConfig(root)
    const dependencies = new Set<string>()
    const html = await processDirectives(source, {}, file, { ...defaultConfig, ...loaded, root, cache: false }, dependencies)
    if (name === 'Image') {
      // Image is also a StxImage builtin alias, ahead of plugin resolution.
      // Do not mistake that third path for the shared file.
      expect(dependencies.has(shared)).toBe(false)
      expect(html).toContain('<img src="/photo.jpg"')
      expect(html).toContain('loading="lazy"')
      expect(html).not.toContain('<Image')
    }
    else expect(dependencies.has(shared)).toBe(true)
    const explicit = await compileScreenSource(`@import('${name}', '${shared}')\n${source}`, file, { root })
    expect(explicit.dependencies).toContain(shared)
    expect(explicit.dependencies).not.toContain(join(nativePrimitivesDir(), `${name}.stx`))
    const override = join(root, 'components', `${name}.stx`)
    await Bun.write(override, '<div data-source="screen-local">Local override</div>')
    clearComponentCache() // the watcher invalidates resolutions when files are added
    expect((await compileScreenSource(source, file, { root })).dependencies).toContain(override)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it.each([false, true])('retains legacy field/media updates and teardown with the shared plugin installed (minify=%s)', async (minify) => {
  const root = createTempDir('stx-legacy-media-')
  let phone: ReturnType<typeof mountNativeScreen> | undefined
  try {
    await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: [${JSON.stringify(join(components, 'stx-plugin.ts'))}] }`)
    const file = join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
const draft = state('Seed')
const source = state('/first.mp4')
const paused = state(false)
const shown = state(true)
window.probe = { draft, source, paused, shown, loads: 0, plays: 0 }
</script><View><View :if="shown">
<TextInput testID="field" :value="draft" @input="draft.set($event.text)" />
<Image testID="image" :source="source" resizeMode="contain" @load="window.probe.loads++" />
<Video testID="video" :source="source" :paused="paused" @play="window.probe.plays++" />
</View></View>`)
    const result = await compileSharedScreenBundle(file, { root, minify })
    for (const [name] of remaining)
      expect(result.dependencies).toContain(join(nativePrimitivesDir(), `${name}.stx`))
    phone = mountNativeScreen(result.code)
    await phone.settle()
    phone.type(phone.byTestID('field')!, 'Edited')
    phone.press(phone.byTestID('image')!, 'onLoad', {})
    phone.press(phone.byTestID('video')!, 'onPlay', {})
    await phone.settle()
    expect(phone.context.probe.draft()).toBe('Edited')
    expect(phone.context.probe.loads).toBe(1)
    expect(phone.context.probe.plays).toBe(1)
    phone.context.probe.source.set('/second.mp4')
    phone.context.probe.paused.set(true)
    await phone.settle()
    expect(phone.byTestID('image')!.props).toMatchObject({ source: '/second.mp4', resizeMode: 'contain' })
    expect(phone.byTestID('video')!.props).toMatchObject({ source: '/second.mp4', paused: true })
    const oldVideo = phone.byTestID('video')!
    phone.context.probe.shown.set(false)
    await phone.settle()
    expect(phone.byTestID('field')).toBeUndefined()
    expect(phone.byTestID('image')).toBeUndefined()
    expect(phone.byTestID('video')).toBeUndefined()
    phone.press(oldVideo, 'onPlay', {})
    expect(phone.context.probe.plays).toBe(1)
    phone.context.probe.shown.set(true)
    await phone.settle()
    expect(phone.byTestID('field')!.props.value).toBe('Edited')
    expect(phone.byTestID('video')!.props).toMatchObject({ source: '/second.mp4', paused: true })
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    phone.context.probe.source.set('/after-unmount.mp4')
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally {
    phone?.unmount()
    await rm(root, { recursive: true, force: true })
  }
}, 30_000)
