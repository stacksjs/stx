/**
 * <ColorSwatches> in a real browser: the size of a dot and the gap between
 * two, the ring and the name on the chosen one, and the radio group it is to
 * a keyboard.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { EVENTS, openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

const HELPERS = `
  ${EVENTS}
  const group = id => document.getElementById(id)
  const dots = id => Array.from(group(id).querySelectorAll('[role="radio"]'))
  const dot = (id, value) => dots(id).find(d => d.getAttribute('data-value') === value)
  const checked = id => dots(id).filter(d => d.getAttribute('aria-checked') === 'true').map(d => d.getAttribute('data-value'))
  const stops = id => dots(id).filter(d => d.tabIndex === 0).map(d => d.getAttribute('data-value'))
  const later = (read, wait) => new Promise(done => setTimeout(() => done(read()), wait || 60))
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'color-swatches-browser',
    width: 700,
    height: 500,
    ready: `document.querySelectorAll('#accent [role="radio"]').length === 4 && document.querySelectorAll('#plain [role="radio"]').length === 3`,
    body: `
<script client>
const accent = state('blue')
const palette = state([
  { value: 'multi', label: 'Multicolor', color: 'conic-gradient(red, orange, yellow, green, blue, purple, red)' },
  { value: 'blue', label: 'Blue', color: 'rgb(52, 120, 246)' },
  { value: 'purple', label: 'Purple', color: 'rgb(140, 61, 154)' },
  { value: 'green', label: 'Green', color: 'rgb(118, 182, 86)' },
])
const heard = []
window.probe = { accent, palette, heard }
</script>
<div style="padding: 30px">
  <ColorSwatches id="accent" v-model:value="accent" :options="palette()" label="Accent colour" @change="heard.push($event)" />
</div>
<div style="padding: 30px">
  <ColorSwatches id="plain" value="#00ff00" :options="['#ff0000', '#00ff00', '#0000ff']" caption="false" />
</div>
<div style="padding: 30px">
  <ColorSwatches id="some" value="b" :options="[{ value: 'a', color: 'red' }, { value: 'b', color: 'green', disabled: true }, { value: 'c', color: 'blue' }]" />
  <ColorSwatches id="off" value="a" disabled :options="[{ value: 'a', color: 'red' }, { value: 'c', color: 'blue' }]" />
</div>`,
  })
}, 60_000)

afterAll(() => page?.close())

describe('what is drawn', () => {
  it('raises no script errors', async () => {
    expect(await page.errors()).toEqual([])
  })

  it('draws 24 point circles, 12 apart', async () => {
    const drawn = await page.json(on(`
      const rects = dots('accent').map(d => d.getBoundingClientRect())
      return { sizes: rects.map(r => [r.width, r.height]), gaps: rects.slice(1).map((r, i) => r.left - rects[i].right), radius: getComputedStyle(dots('accent')[1].querySelector('.stx-color-swatch-dot')).borderRadius }
    `))

    expect(drawn.sizes).toEqual([[24, 24], [24, 24], [24, 24], [24, 24]])
    expect(drawn.gaps).toEqual([12, 12, 12])
    expect(drawn.radius).toBe('50%')
  })

  it('paints each dot with its colour, a gradient included', async () => {
    const drawn = await page.json(on(`
      const paint = d => { const s = getComputedStyle(d.querySelector('.stx-color-swatch-dot')); return { colour: s.backgroundColor, image: s.backgroundImage.slice(0, 14) } }
      return { multi: paint(dot('accent', 'multi')), blue: paint(dot('accent', 'blue')), plain: dots('plain').map(d => paint(d).colour) }
    `))

    expect(drawn.multi.image).toBe('conic-gradient')
    expect(drawn.blue).toEqual({ colour: 'rgb(52, 120, 246)', image: 'none' })
    expect(drawn.plain).toEqual(['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'])
  })

  it('rings the chosen dot, 2 thick and 2 away, and no other', async () => {
    const drawn = await page.json(on(`
      const ring = d => { const s = getComputedStyle(d, '::before'); return { width: s.borderTopWidth, colour: s.borderTopColor, top: s.top, left: s.left, size: s.width, radius: s.borderTopLeftRadius } }
      const swatch = document.createElement('i'); swatch.style.background = 'var(--stx-mac-accent)'; document.body.append(swatch)
      const accentColour = getComputedStyle(swatch).backgroundColor; swatch.remove()
      return { accentColour, on: ring(dot('accent', 'blue')), off: ring(dot('accent', 'purple')) }
    `))

    expect(drawn.on.width).toBe('2px')
    expect(drawn.on.colour).toBe(drawn.accentColour)
    expect(drawn.on.top).toBe('-4px')
    expect(drawn.on.left).toBe('-4px')
    expect(drawn.on.size).toBe('32px')
    expect(drawn.on.radius).toBe('50%')
    expect(drawn.off.colour).toBe('rgba(0, 0, 0, 0)')
  })

  it('writes the name of the chosen dot under it, small and secondary, and reserves the room', async () => {
    const drawn = await page.json(on(`
      const caption = d => d.querySelector('.stx-color-swatch-caption')
      const shown = id => dots(id).filter(d => getComputedStyle(caption(d)).display !== 'none').map(d => caption(d).textContent)
      const on = dot('accent', 'blue'), text = caption(on), style = getComputedStyle(text)
      const dotBox = on.getBoundingClientRect(), textBox = text.getBoundingClientRect()
      return { shown: shown('accent'), plain: shown('plain'), size: style.fontSize, colour: style.color, below: textBox.top - dotBox.bottom, centred: Math.abs((textBox.left + textBox.width / 2) - (dotBox.left + dotBox.width / 2)) < 0.6, height: group('accent').getBoundingClientRect().height, plainHeight: group('plain').getBoundingClientRect().height, hidden: text.getAttribute('aria-hidden') }
    `))

    expect(drawn.shown).toEqual(['Blue'])
    expect(drawn.plain).toEqual([])
    expect(drawn.size).toBe('11px')
    expect(drawn.colour).toBe('rgba(0, 0, 0, 0.5)')
    expect(drawn.below).toBe(4)
    expect(drawn.centred).toBe(true)
    expect(drawn.height).toBe(41)
    expect(drawn.plainHeight).toBe(24)
    expect(drawn.hidden).toBe('true')
  })
})

describe('a radio group', () => {
  it('names the group and every dot, and checks one', async () => {
    const info = await page.json(on(`
      return { role: group('accent').getAttribute('role'), label: group('accent').getAttribute('aria-label'), unnamed: group('plain').getAttribute('aria-label'), names: dots('accent').map(d => d.getAttribute('aria-label')), plainNames: dots('plain').map(d => d.getAttribute('aria-label')), checked: checked('accent'), plain: checked('plain'), types: dots('accent').map(d => d.type) }
    `))

    expect(info.role).toBe('radiogroup')
    expect(info.label).toBe('Accent colour')
    expect(info.unnamed).toBeNull()
    expect(info.names).toEqual(['Multicolor', 'Blue', 'Purple', 'Green'])
    expect(info.plainNames).toEqual(['#ff0000', '#00ff00', '#0000ff'])
    expect(info.checked).toEqual(['blue'])
    expect(info.plain).toEqual(['#00ff00'])
    expect(info.types).toEqual(['button', 'button', 'button', 'button'])
  })

  it('has one tab stop, on the chosen dot', async () => {
    const result = await page.json(on(`return { accent: stops('accent'), plain: stops('plain'), some: stops('some'), off: stops('off') }`))

    expect(result.accent).toEqual(['blue'])
    expect(result.plain).toEqual(['#00ff00'])
    // The chosen one cannot be chosen, so Tab lands on the first that can.
    expect(result.some).toEqual(['a'])
    expect(result.off).toEqual([])
  })

  it('chooses with a click, and says so', async () => {
    const result = await page.json(on(`
      dot('accent', 'green').click()
      return later(() => ({ model: probe.accent(), checked: checked('accent'), stops: stops('accent'), heard: probe.heard.slice() }))
    `))

    expect(result).toEqual({ model: 'green', checked: ['green'], stops: ['green'], heard: ['green'] })
  })

  it('says nothing when the chosen dot is clicked again', async () => {
    expect(await page.json(on(`dot('accent', 'green').click(); return probe.heard.length`))).toBe(1)
  })

  it('moves the choice and the focus with the arrow keys, round the ends, and to them with Home and End', async () => {
    const result = await page.json(on(`
      const out = {}, focused = () => document.activeElement.getAttribute('data-value')
      dot('accent', 'green').focus()
      const handled = !press(dot('accent', 'green'), 'ArrowRight'); out.wrap = [probe.accent(), focused()]
      press(dot('accent', 'multi'), 'ArrowDown'); out.down = [probe.accent(), focused()]
      press(dot('accent', 'blue'), 'ArrowLeft'); out.left = [probe.accent(), focused()]
      press(dot('accent', 'multi'), 'ArrowUp'); out.up = [probe.accent(), focused()]
      press(dot('accent', 'green'), 'Home'); out.home = [probe.accent(), focused()]
      press(dot('accent', 'multi'), 'End'); out.end = [probe.accent(), focused()]
      out.handled = handled; out.ignored = press(dot('accent', 'green'), 'a')
      return later(() => Object.assign(out, { checked: checked('accent'), stops: stops('accent') }))
    `))

    expect(result.wrap).toEqual(['multi', 'multi'])
    expect(result.down).toEqual(['blue', 'blue'])
    expect(result.left).toEqual(['multi', 'multi'])
    expect(result.up).toEqual(['green', 'green'])
    expect(result.home).toEqual(['multi', 'multi'])
    expect(result.end).toEqual(['green', 'green'])
    expect(result.handled).toBe(true)
    expect(result.ignored).toBe(true)
    expect(result.checked).toEqual(['green'])
    expect(result.stops).toEqual(['green'])
  })

  it('chooses the focused dot with Space', async () => {
    const result = await page.json(on(`
      const handled = !press(dot('accent', 'purple'), ' ')
      return later(() => ({ handled, model: probe.accent(), checked: checked('accent') }))
    `))

    expect(result).toEqual({ handled: true, model: 'purple', checked: ['purple'] })
  })

  it('steps over a dot that cannot be chosen, and does nothing while disabled', async () => {
    const result = await page.json(on(`
      press(dot('some', 'a'), 'ArrowRight')
      dot('some', 'b').click()
      dot('off', 'c').click()
      press(dot('off', 'a'), 'ArrowRight')
      return later(() => ({ some: checked('some'), off: checked('off'), disabled: dots('off').map(d => d.disabled), aria: group('off').getAttribute('aria-disabled') }))
    `))

    expect(result).toEqual({ some: ['c'], off: ['a'], disabled: [true, true], aria: 'true' })
  })

  it('takes a new choice, and new colours, from the page', async () => {
    const result = await page.json(on(`
      probe.accent.set('blue')
      probe.palette.set([{ value: 'blue', label: 'Sky', color: 'rgb(1, 2, 3)' }, { value: 'red', label: 'Red', color: 'rgb(200, 0, 0)' }])
      return later(() => ({ checked: checked('accent'), names: dots('accent').map(d => d.getAttribute('aria-label')), colour: getComputedStyle(dot('accent', 'blue').querySelector('.stx-color-swatch-dot')).backgroundColor }))
    `))

    expect(result).toEqual({ checked: ['blue'], names: ['Sky', 'Red'], colour: 'rgb(1, 2, 3)' })
  })
})

describe('in the dark', () => {
  it('writes the name in the dark secondary ink', async () => {
    const colour = await page.json(on(`
      document.documentElement.classList.add('dark')
      const read = getComputedStyle(dot('accent', 'blue').querySelector('.stx-color-swatch-caption')).color
      document.documentElement.classList.remove('dark')
      return read
    `))

    expect(colour).toBe('rgba(255, 255, 255, 0.55)')
  })
})
