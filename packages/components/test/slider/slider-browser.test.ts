/**
 * <Slider> in a real browser: how big the track and the knob are, where the
 * knob and the tick marks sit, and what a key, a drag and a bound value do.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { EVENTS, openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

const HELPERS = `
  ${EVENTS}
  const slider = id => document.getElementById(id)
  const part = (id, name) => slider(id).querySelector('.stx-slider-' + name)
  const box = el => { const r = el.getBoundingClientRect(); return { left: Math.round(r.left * 100) / 100, top: Math.round(r.top * 100) / 100, width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100 } }
  const knobAt = id => Math.round((part(id, 'knob').getBoundingClientRect().left - part(id, 'body').getBoundingClientRect().left) * 100) / 100
  const later = (read, wait) => new Promise(done => setTimeout(() => done(read()), wait || 60))
  const drag = (id, value, settle) => { const input = part(id, 'input'); input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true })); if (settle) input.dispatchEvent(new Event('change', { bubbles: true })) }
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'slider-browser',
    width: 700,
    height: 600,
    ready: `document.querySelectorAll('#ticked .stx-slider-tick').length === 3`,
    body: `
<script client>
const level = state(1)
const volume = state(40)
const heard = { input: [], change: [], native: 0 }
window.probe = { level, volume, heard }
</script>
<div id="box" style="width: 340px; padding: 20px" @input="heard.native++">
  <Slider id="ticked" v-model:value="level" min="0" max="2" step="1" ticks label="Transparency" @input="heard.input.push($event)" @change="heard.change.push($event)" />
</div>
<div style="width: 340px; padding: 20px">
  <Slider id="plain" v-model:value="volume" tint="accent" />
  <Slider id="five" value="0.5" min="0" max="1" step="0.25" ticks="5" />
  <Slider id="off" value="30" disabled label="Unavailable" />
  <Slider id="sized" value="10" width="120px" />
</div>
<div class="dark" style="width: 340px; padding: 20px; background: #1e1e1e">
  <Slider id="dark" value="50" />
</div>
<div data-stx-window-active="false" style="width: 340px; padding: 20px">
  <Slider id="inactive" value="50" tint="accent" />
</div>`,
  })
}, 60_000)

afterAll(() => page?.close())

describe('what is drawn', () => {
  it('raises no script errors', async () => {
    expect(await page.errors()).toEqual([])
  })

  it('draws a 4 point track and a 20 by 16 pill for a knob', async () => {
    const drawn = await page.json(on(`
      const style = getComputedStyle(part('ticked', 'track')), knob = getComputedStyle(part('ticked', 'knob'))
      return { body: box(part('ticked', 'body')), track: box(part('ticked', 'track')), knob: box(part('ticked', 'knob')), trackRadius: style.borderRadius, knobRadius: knob.borderRadius, knobFill: knob.backgroundColor }
    `))

    expect(drawn.body.width).toBe(300)
    expect(drawn.track.width).toBe(300)
    expect(drawn.track.height).toBe(4)
    expect(drawn.trackRadius).toBe('2px')
    expect(drawn.knob.width).toBe(20)
    expect(drawn.knob.height).toBe(16)
    expect(drawn.knobRadius).toBe('8px')
    expect(drawn.knobFill).toBe('rgb(255, 255, 255)')
    // The track runs through the middle of the knob.
    expect(drawn.track.top + 2).toBe(drawn.knob.top + 8)
  })

  it('puts the knob flush with each end and the filled part under its middle', async () => {
    const drawn = await page.json(on(`
      const read = id => ({ knob: knobAt(id), fill: box(part(id, 'fill')).width })
      return { middle: read('ticked'), plain: read('plain'), sized: box(slider('sized')).width }
    `))

    // Half way along 300: the knob's middle is at 150.
    expect(drawn.middle).toEqual({ knob: 140, fill: 150 })
    // 40 of 100: 0.4 of the 280 the knob travels.
    expect(drawn.plain).toEqual({ knob: 112, fill: 122 })
    expect(drawn.sized).toBe(120)
  })

  it('draws the tick marks under the track, where the middle of the knob stops', async () => {
    const drawn = await page.json(on(`
      const from = id => part(id, 'body').getBoundingClientRect().left
      const marks = id => Array.from(slider(id).querySelectorAll('.stx-slider-tick')).map(t => { const r = t.getBoundingClientRect(); return Math.round((r.left + r.width / 2 - from(id)) * 100) / 100 })
      const first = slider('ticked').querySelector('.stx-slider-tick')
      return { ticked: marks('ticked'), five: marks('five'), none: marks('plain'), size: box(first), below: first.getBoundingClientRect().top - part('ticked', 'track').getBoundingClientRect().bottom }
    `))

    expect(drawn.ticked).toEqual([10, 150, 290])
    expect(drawn.five).toEqual([10, 80, 150, 220, 290])
    expect(drawn.none).toEqual([])
    expect(drawn.size.width).toBe(2)
    expect(drawn.size.height).toBe(2)
    expect(drawn.below).toBe(4)
  })

  it('fills with the accent when asked, grey otherwise, and grey in a window that is not key', async () => {
    const fills = await page.json(on(`
      const fill = id => getComputedStyle(part(id, 'fill')).backgroundColor
      const swatch = document.createElement('i'); swatch.style.background = 'var(--stx-mac-accent)'; document.body.append(swatch)
      const accentColour = getComputedStyle(swatch).backgroundColor; swatch.remove()
      return { accentColour, neutral: fill('ticked'), accent: fill('plain'), inactive: fill('inactive'), dark: fill('dark'), darkTrack: getComputedStyle(part('dark', 'track')).backgroundColor, track: getComputedStyle(part('ticked', 'track')).backgroundColor }
    `))

    expect(fills.neutral).toBe('rgba(0, 0, 0, 0.26)')
    expect(fills.accent).toBe(fills.accentColour)
    expect(fills.accent).not.toBe(fills.neutral)
    expect(fills.inactive).toBe('rgba(0, 0, 0, 0.26)')
    expect(fills.track).toBe('rgba(0, 0, 0, 0.07)')
    expect(fills.dark).toBe('rgba(255, 255, 255, 0.25)')
    expect(fills.darkTrack).toBe('rgba(255, 255, 255, 0.1)')
  })

  it('is a real range input, named and bounded', async () => {
    const info = await page.json(on(`
      const read = id => { const i = part(id, 'input'); return { type: i.type, min: i.min, max: i.max, step: i.step, value: i.value, label: i.getAttribute('aria-label'), disabled: i.disabled } }
      return { ticked: read('ticked'), five: read('five'), off: read('off'), plain: read('plain'), covers: box(part('ticked', 'input')).width, dimmed: getComputedStyle(slider('off')).opacity }
    `))

    expect(info.ticked).toEqual({ type: 'range', min: '0', max: '2', step: '1', value: '1', label: 'Transparency', disabled: false })
    expect(info.five).toEqual({ type: 'range', min: '0', max: '1', step: '0.25', value: '0.5', label: null, disabled: false })
    expect(info.off.disabled).toBe(true)
    expect(info.off.label).toBe('Unavailable')
    expect(info.plain.label).toBeNull()
    expect(info.covers).toBe(300)
    expect(Number(info.dimmed)).toBeLessThan(1)
  })
})

describe('moving it', () => {
  it('follows the arrow keys, Home and End, and says so once each', async () => {
    const result = await page.json(on(`
      const input = part('ticked', 'input'), out = {}
      const handled = !press(input, 'ArrowRight')
      out.right = { value: probe.level(), knob: knobAt('ticked'), input: input.value }
      press(input, 'ArrowRight'); out.stays = probe.level()
      press(input, 'Home'); out.home = { value: probe.level(), knob: knobAt('ticked') }
      press(input, 'End'); out.end = probe.level()
      press(input, 'ArrowLeft'); out.left = probe.level()
      out.handled = handled; out.ignored = press(input, 'a')
      out.heard = { input: probe.heard.input.slice(), change: probe.heard.change.slice() }
      return out
    `))

    expect(result.right).toEqual({ value: 2, knob: 280, input: '2' })
    expect(result.stays).toBe(2)
    expect(result.home).toEqual({ value: 0, knob: 0 })
    expect(result.end).toBe(2)
    expect(result.left).toBe(1)
    expect(result.handled).toBe(true)
    expect(result.ignored).toBe(true)
    // Four keys moved it; the one against the end said nothing.
    expect(result.heard.input).toEqual([2, 0, 2, 1])
    expect(result.heard.change).toEqual([2, 0, 2, 1])
  })

  it('emits input while it is dragged and change when it is let go', async () => {
    const result = await page.json(on(`
      probe.heard.input.length = 0; probe.heard.change.length = 0; probe.heard.native = 0
      drag('ticked', 2)
      const during = { input: probe.heard.input.slice(), change: probe.heard.change.slice(), value: probe.level() }
      drag('ticked', 0, true)
      return { during, after: { input: probe.heard.input.slice(), change: probe.heard.change.slice(), value: probe.level() }, knob: knobAt('ticked'), native: probe.heard.native }
    `))

    expect(result.during).toEqual({ input: [2], change: [], value: 2 })
    expect(result.after).toEqual({ input: [2, 0], change: [0], value: 0 })
    expect(result.knob).toBe(0)
    // The page hears the component's event and not the input's own as well.
    expect(result.native).toBe(2)
  })

  it('takes a new value from the page', async () => {
    const result = await page.json(on(`
      probe.level.set(2); probe.volume.set(75)
      return later(() => ({ ticked: knobAt('ticked'), input: part('ticked', 'input').value, plain: knobAt('plain'), fill: box(part('plain', 'fill')).width }))
    `))

    expect(result).toEqual({ ticked: 280, input: '2', plain: 210, fill: 220 })
  })

  it('does nothing while disabled', async () => {
    const result = await page.json(on(`
      const input = part('off', 'input')
      press(input, 'ArrowRight')
      return { value: input.value, knob: knobAt('off') }
    `))

    expect(result).toEqual({ value: '30', knob: 84 })
  })

  it('exposes its value to the page', async () => {
    const result = await page.json(on(`
      const api = slider('five').closest('[data-stx-scope]').__stx_exposed
      api.setValue(0.8)
      return later(() => ({ value: api.value(), knob: knobAt('five') }))
    `))

    expect(result).toEqual({ value: 0.75, knob: 210 })
  })
})
