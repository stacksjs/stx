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
] as const

/**
 * Names shared with a component that is not a migration of the primitive at
 * all. The shared Slider is the Mac one a Settings window draws, on a real
 * `<input type="range">`; a native screen keeps the platform's own, and
 * nothing is planned to change that.
 */
const separate = [
  ['Slider', 'slider', 'value="1"'],
] as const

/**
 * Video's media URL migrated (#2091). The shared component accepts the
 * primitive's `source` name, as a string or a `{ uri }` payload, and honours
 * an explicit box instead of imposing its own.
 *
 * The box was the real blocker, not the props. The shared component wrapped
 * its media in a `w-full` container with an aspect ratio and dropped the
 * caller's style, so a legacy call asking for 64x32 rendered full width and
 * pushed the next control off the screen; the iOS gate caught that twice,
 * including once after resizeMode had been added, which is how it was
 * established that no missing prop explained it.
 *
 * Native-only EVENT aliases did NOT migrate, for a reason of their own: a host
 * collapses `@progress` onto the same event as `@timeupdate`, while on the web
 * `progress` reports buffering and `timeupdate` playback position, so
 * converging it would hand a web caller something different without saying so.
 */
const videoSelections = [
  ['source only', 'source="/movie.mp4" label="Movie"', 'shared'],
  ['mixed src and source', 'src="/movie.mp4" source="/legacy.mp4" label="Movie"', 'shared'],
  ['src only', 'src="/movie.mp4" label="Movie"', 'shared'],
  ['a native-only event alias', 'src="/movie.mp4" @progress="onProgress" label="Movie"', 'primitive'],
] as const

it('inventories every shared/native name collision so new overlaps require a compatibility decision (#2091)', async () => {
  const primitives = (await readdir(nativePrimitivesDir())).filter(name => name.endsWith('.stx')).map(name => basename(name, '.stx'))
  const shared = new Set((await readdir(join(components, 'src'), { recursive: true })).filter(name => name.endsWith('.stx')).map(name => basename(name, '.stx')))
  expect(primitives.filter(name => shared.has(name)).sort()).toEqual(['Button', 'Checkbox', 'Image', 'Slider', 'Switch', 'TextInput', 'Video'])
})

it.each([...remaining, ...separate])('%s keeps its native contract until shared migration is verified', async (name, directory, attributes) => {
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

it.each(videoSelections)('Video with %s compiles the %s implementation', async (_label, attributes, expected) => {
  const root = createTempDir('stx-video-selection-')
  try {
    const file = join(root, 'Screen.stx')
    const source = `<div><Video ${attributes} /></div>`
    await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: [${JSON.stringify(join(components, 'stx-plugin.ts'))}] }`)
    await Bun.write(file, source)

    const shared = join(components, 'src/ui/video/Video.stx')
    const primitive = join(nativePrimitivesDir(), 'Video.stx')
    const compiled = await compileScreenSource(source, file, { root })

    expect(compiled.dependencies).toContain(expected === 'shared' ? shared : primitive)
    expect(compiled.dependencies).not.toContain(expected === 'shared' ? primitive : shared)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it('lets a caller size a shared Video instead of imposing a full-width box', async () => {
  // The blocker the gate found: the explicit box has to reach the markup and
  // the component's own w-full has to stand down, or the video grows and
  // pushes whatever follows it off the screen.
  const root = createTempDir('stx-video-box-')
  try {
    const file = join(root, 'Screen.stx')
    const source = '<div><Video source="/movie.mp4" style="width:64;height:32" label="Movie" /></div>'
    await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: [${JSON.stringify(join(components, 'stx-plugin.ts'))}] }`)
    await Bun.write(file, source)

    const html = await processDirectives(source, {}, file, { ...defaultConfig, ...(await loadStxConfig(root)), root, cache: false }, new Set())
    const figure = html.match(/<figure[^>]*>/)?.[0] ?? ''

    expect(figure).toContain('width:64;height:32')
    expect(figure).not.toContain('w-full')
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
