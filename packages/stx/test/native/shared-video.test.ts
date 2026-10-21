import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const video = join(import.meta.dir, '../../../components/src/ui/video/Video.stx')

it.each([false, true])('mounts the shared Video without browser globals and retains native playback/lifecycle (minify=%s)', async (minify) => {
  const { code, diagnostics } = await compileNativeScreen(`@import('Video', '${video}')
<script client>
const url = state('/first.mp4')
const paused = state(false)
const shown = state(true)
const shape = state('16/9')
const probe = { url, paused, shown, shape, plays: 0, pauses: 0, ends: 0, time: 0, error: '' }
window.probe = probe
</script><section><div :if="shown">
<Video testID="movie" :src="url" :paused="paused" :aspectRatio="shape" label="Movie" autoplay muted loop
  @play="probe.plays++" @pause="probe.pauses++" @ended="probe.ends++"
  @timeupdate="probe.time = $event.currentTime" @error="probe.error = $event.message" />
</div></section>`, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    expect(diagnostics.filter(item => /unmapped-tag|non-numeric-style/.test(item.message))).toEqual([])
    const movie = () => phone.byTestID('movie')!
    const probe = phone.context.probe
    expect(movie().type).toBe('Video')
    expect(phone.ofType('Video')).toHaveLength(1)
    expect(movie().children).toEqual([])
    expect(movie().props).toMatchObject({ source: '/first.mp4', paused: false, controls: true, autoplay: true, muted: true, loop: true })
    const id = movie().id
    phone.press(movie(), 'onPlay', {})
    phone.press(movie(), 'onPause', {})
    phone.press(movie(), 'onEnd', {})
    phone.press(movie(), 'onProgress', { currentTime: 12 })
    phone.press(movie(), 'onError', { message: 'Cannot play' })
    await phone.settle()
    expect(probe.plays).toBe(1)
    expect(probe.pauses).toBe(1)
    expect(probe.ends).toBe(1)
    expect(probe.time).toBe(12)
    expect(probe.error).toBe('Cannot play')
    expect(movie().style.aspectRatio).toBeCloseTo(16 / 9)
    probe.url.set('/second.mp4')
    probe.paused.set(true)
    probe.shape.set('9/16')
    await phone.settle()
    expect(movie().id).toBe(id)
    expect(movie().props).toMatchObject({ source: '/second.mp4', paused: true })
    expect(movie().props.src).toBeUndefined()
    expect(movie().style.aspectRatio).toBeCloseTo(9 / 16)
    for (const empty of ['', null]) {
      probe.url.set('/before-clear.mp4')
      await phone.settle()
      probe.url.set(empty)
      await phone.settle()
      expect(movie().props.source).toBeNull()
    }
    const old = movie()
    probe.shown.set(false)
    await phone.settle()
    expect(movie()).toBeUndefined()
    phone.press(old, 'onPlay', {})
    expect(probe.plays).toBe(1)
    probe.url.set('/remounted.mp4')
    probe.shown.set(true)
    await phone.settle()
    expect(movie().props).toMatchObject({ source: '/remounted.mp4', paused: true })
    phone.press(movie(), 'onPlay', {})
    await phone.settle()
    expect(probe.plays).toBe(2)
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.url.set('/disposed.mp4')
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)
