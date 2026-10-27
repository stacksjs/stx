import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const video = join(import.meta.dir, '../../../components/src/ui/video/Video.stx')
const names = ['controls', 'autoplay', 'loop', 'muted'] as const
const cases = [
  { label: 'omitted', attributes: '', defaults: [true, false, false, false] },
  { label: 'enabled', attributes: 'controls autoplay loop muted', defaults: [true, true, true, true] },
  { label: 'disabled', attributes: 'controls="false" autoplay="false" loop="false" muted="false"', defaults: [false, false, false, false] },
  { label: 'false-like strings', attributes: 'controls="off" autoplay="0" loop="no" muted="FALSE"', defaults: [false, false, false, false] },
  { label: 'mixed', attributes: 'controls="off" autoplay="true" loop="no" muted="yes"', defaults: [false, true, false, true] },
]

describe.each([false, true])('shared Video boolean flags (minify=%s)', (minify) => {
  it.each(cases)('normalizes flags and restores $label defaults without replacing the native player', async ({ attributes, defaults }) => {
    const { code } = await compileNativeScreen(`@import('Video', '${video}')
<script client>
const controls = state(undefined)
const autoplay = state(undefined)
const loop = state(undefined)
const muted = state(undefined)
const shown = state(true)
const url = state('/movie.mp4')
window.probe = { controls, autoplay, loop, muted, shown, url, plays: 0 }
</script><section><div :if="shown">
<Video ${attributes} testID="movie" :controls="controls" :autoplay="autoplay" :loop="loop" :muted="muted" :src="url" label="Movie" @play="window.probe.plays++" />
</div></section>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const movie = () => phone.byTestID('movie')!
      const probe = phone.context.probe
      const id = movie().id
      const check = (values: boolean[], source = '/movie.mp4') => {
        expect(movie().id).toBe(id)
        expect(phone.ofType('Video')).toHaveLength(1)
        expect(movie().children).toEqual([])
        expect(movie().props).toMatchObject({ source, ...Object.fromEntries(names.map((name, index) => [name, values[index]])) })
        for (const name of names) expect(typeof movie().props[name]).toBe('boolean')
      }
      const set = async (value: unknown) => {
        for (const name of names) probe[name].set(value)
        await phone.settle()
      }
      check(defaults)
      for (const value of [false, 'false', 'off', 'no', '0', ' FALSE ', ' Off ', 0]) {
        await set(value)
        check([false, false, false, false])
      }
      for (const value of [true, 'true', 'on', 'yes', '1', '', 1, 'unknown']) {
        await set(value)
        check([true, true, true, true])
      }
      await set(null)
      check([true, false, false, false])
      await set(undefined)
      check(defaults)
      await set(false)
      for (const name of names) {
        probe[name].set(true)
        await phone.settle()
        check(names.map(flag => flag === name))
        probe[name].set('off')
        await phone.settle()
        check([false, false, false, false])
      }
      for (const value of [false, 'off', true, '', null, undefined]) {
        const old = movie()
        probe.shown.set(false)
        await phone.settle()
        expect(movie()).toBeUndefined()
        phone.press(old, 'onPlay', {})
        expect(probe.plays).toBe(0)
        await set(value)
        probe.shown.set(true)
        await phone.settle()
        check(value === undefined ? defaults : value === null ? [true, false, false, false] : Array(4).fill(value === true || value === ''))
      }
      await set('off')
      probe.url.set('/replacement.mp4')
      await phone.settle()
      check([false, false, false, false], '/replacement.mp4')
      phone.press(movie(), 'onPlay', {})
      await phone.settle()
      expect(probe.plays).toBe(1)
      expect(phone.mutationErrors).toEqual([])
      phone.unmount()
      const count = phone.messages.length
      await set(true)
      probe.url.set('/unmounted.mp4')
      await phone.settle()
      expect(phone.messages).toHaveLength(count)
    }
    finally { phone.unmount() }
  }, 60_000)
})
