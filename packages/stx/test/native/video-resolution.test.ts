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
const shared = join(components, 'src/ui/video/Video.stx')
const primitive = join(nativePrimitivesDir(), 'Video.stx')

async function fixture(source: string, withPlugin = true) {
  const root = createTempDir('stx-video-resolution-')
  const file = join(root, 'Screen.stx')
  await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: ${withPlugin ? `[${JSON.stringify(join(components, 'stx-plugin.ts'))}]` : '[]'} }`)
  await Bun.write(file, source)
  return { root, file }
}

it.each(['src="/movie.mp4"', ':src="url"', 'src=""', ':src="unset"'])('selects the same shared Video on web/native for src API: %s', async (attributes) => {
  const source = `<script client>const url = state('/movie.mp4'); const unset = state(undefined)</script><section><Video ${attributes} /></section>`
  const { root, file } = await fixture(source)
  try {
    const native = await compileScreenSource(source, file, { root })
    expect(native.dependencies).toContain(shared)
    expect(native.dependencies).not.toContain(primitive)
    const config = await loadStxConfig(root)
    const dependencies = new Set<string>()
    const html = await processDirectives(source, {}, file, { ...defaultConfig, ...config, root, cache: false }, dependencies)
    expect(dependencies.has(shared)).toBe(true)
    expect(html).toContain('<video-player')
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it.each([
  '', 'source="/movie.mp4"', ':source="url"', 'src="/shared.mp4" source="/legacy.mp4"', ':src="url" :source="unset"',
  ...['progress', 'end', 'load', 'playing', 'load-start', 'enterpictureinpicture'].map(event => `src="/movie.mp4" @${event}="void 0"`),
])('keeps native primitives for legacy, mixed or ambiguous calls: %s', async (attributes) => {
  const { root, file } = await fixture(`<script client>const url = state('/movie.mp4'); const unset = state(undefined)</script><Video ${attributes} />`)
  try {
    const result = await compileScreenSource(await Bun.file(file).text(), file, { root })
    expect(result.dependencies).toContain(primitive)
    expect(result.dependencies).not.toContain(shared)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it('preserves explicit imports and app overrides before usage-based resolution', async () => {
  const source = '<section><Video src="/movie.mp4" /></section>'
  const { root, file } = await fixture(source)
  try {
    const explicit = await compileScreenSource(`@import('Video', '${primitive}')${source}`, file, { root })
    expect(explicit.dependencies).toContain(primitive)
    expect(explicit.dependencies).not.toContain(shared)
    const override = join(root, 'components/Video.stx')
    await Bun.write(override, '<video data-native="Video" data-local="true"></video>')
    clearComponentCache()
    const local = await compileScreenSource(source, file, { root })
    expect(local.dependencies).toContain(override)
    expect(local.dependencies).not.toContain(shared)
    expect(local.dependencies).not.toContain(primitive)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it('keeps the primitive fallback without a shared library installed', async () => {
  const source = '<Video src="/movie.mp4" />'
  const { root, file } = await fixture(source, false)
  try {
    const result = await compileScreenSource(source, file, { root })
    expect(result.dependencies).toContain(primitive)
    expect(result.dependencies).not.toContain(shared)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 30_000)

it.each([
  { attributes: '', controls: true, enabled: false },
  { attributes: 'controls autoplay muted loop', controls: true, enabled: true },
  { attributes: 'controls="false" autoplay="false" muted="false" loop="false"', controls: false, enabled: false },
])('preserves default and literal playback flags: $attributes', async ({ attributes, controls, enabled }) => {
  const { root, file } = await fixture(`<section><Video src="/movie.mp4" testID="movie" ${attributes} /></section>`)
  let phone: ReturnType<typeof mountNativeScreen> | undefined
  try {
    const result = await compileSharedScreenBundle(file, { root })
    expect(result.dependencies).toContain(shared)
    phone = mountNativeScreen(result.code)
    await phone.settle()
    expect(phone.byTestID('movie')!.props).toMatchObject({ source: '/movie.mp4', controls, autoplay: enabled, muted: enabled, loop: enabled })
  }
  finally {
    phone?.unmount()
    await rm(root, { recursive: true, force: true })
  }
}, 30_000)

it.each([false, true])('runs shared src and legacy source players together without identity or event regressions (minify=%s)', async (minify) => {
  const { root, file } = await fixture(`<script client>
const url = state('/shared.mp4')
const legacy = state({ uri: '/legacy.mp4' })
const paused = state(false)
const controls = state(false)
const shape = state('16/9')
const shown = state(true)
window.probe = { url, legacy, paused, controls, shape, shown, plays: [], errors: [], progress: [], loads: [] }
</script><section><div :if="shown">
<Video testID="shared" :src="url" :paused="paused" :controls="controls" :aspectRatio="shape" label="Shared movie"
  @play="window.probe.plays.push('shared')" @error="window.probe.errors.push($event.message)" @timeupdate="window.probe.progress.push($event.currentTime)"
  @loadedmetadata="window.probe.loads.push($event.duration)" @loadstart="window.probe.loads.push('start')" />
<Video testID="legacy" :source="legacy" :paused="paused" resizeMode="contain"
  @play="window.probe.plays.push('legacy')" @error="window.probe.errors.push($event.message)" @progress="window.probe.progress.push($event.currentTime)" />
<Video testID="alias" src="/legacy-alias.mp4" @progress="window.probe.progress.push($event.currentTime)" />
</div></section>`)
  let phone: ReturnType<typeof mountNativeScreen> | undefined
  try {
    const result = await compileSharedScreenBundle(file, { root, minify })
    expect(result.dependencies).toContain(shared)
    expect(result.dependencies).toContain(primitive)
    phone = mountNativeScreen(result.code)
    await phone.settle()
    const current = (name: string) => phone!.byTestID(name)!
    const probe = phone.context.probe
    expect(phone.ofType('Video')).toHaveLength(3)
    expect(current('shared').props).toMatchObject({ source: '/shared.mp4', paused: false, controls: false })
    expect(current('legacy').props).toMatchObject({ source: { uri: '/legacy.mp4' }, paused: false, resizeMode: 'contain' })
    const ids = [current('shared').id, current('legacy').id]
    for (const name of ['shared', 'legacy']) {
      phone.press(current(name), 'onPlay', {})
      phone.press(current(name), 'onError', { message: name })
      phone.press(current(name), 'onProgress', { currentTime: 7 })
    }
    await phone.settle()
    expect(probe.plays).toEqual(['shared', 'legacy'])
    expect(probe.errors).toEqual(['shared', 'legacy'])
    expect(probe.progress).toEqual([7, 7])
    phone.press(current('alias'), 'onProgress', { currentTime: 9 })
    phone.press(current('shared'), 'onLoad', { duration: 12 })
    phone.press(current('shared'), 'onLoadStart', {})
    expect(probe.progress).toEqual([7, 7, 9])
    expect(probe.loads).toEqual([12, 'start'])
    probe.url.set('/changed.mp4')
    probe.legacy.set({ uri: '/changed-legacy.mp4' })
    probe.paused.set(true)
    probe.controls.set(true)
    probe.shape.set('9/16')
    await phone.settle()
    expect([current('shared').id, current('legacy').id]).toEqual(ids)
    expect(current('shared').props).toMatchObject({ source: '/changed.mp4', paused: true, controls: true })
    expect(current('shared').style.aspectRatio).toBeCloseTo(9 / 16)
    expect(current('legacy').props).toMatchObject({ source: { uri: '/changed-legacy.mp4' }, paused: true })
    for (const empty of ['', null]) {
      probe.url.set('/before-clear.mp4')
      await phone.settle()
      probe.url.set(empty)
      await phone.settle()
      expect(current('shared').props.source).toBeNull()
    }
    const old = [current('shared'), current('legacy')]
    probe.shown.set(false)
    await phone.settle()
    expect(phone.ofType('Video')).toHaveLength(0)
    for (const node of old)
      phone.press(node, 'onPlay', {})
    expect(probe.plays).toEqual(['shared', 'legacy'])
    probe.url.set('/remounted.mp4')
    probe.shown.set(true)
    await phone.settle()
    expect(phone.ofType('Video')).toHaveLength(3)
    // Native :if detaches and reinserts retained nodes; hiding must not
    // replace a player or lose its stable host identity.
    expect(current('shared').id).toBe(ids[0])
    expect(current('shared').props).toMatchObject({ source: '/remounted.mp4', paused: true })
    phone.press(current('shared'), 'onPlay', {})
    phone.press(current('legacy'), 'onPlay', {})
    expect(probe.plays).toEqual(['shared', 'legacy', 'shared', 'legacy'])
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.url.set('/disposed.mp4')
    probe.legacy.set({ uri: '/disposed.mp4' })
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally {
    phone?.unmount()
    await rm(root, { recursive: true, force: true })
  }
}, 30_000)
