/**
 * <AppearancePicker> in a real browser: three small pictures of the right
 * size, a ring and a bold caption on the chosen one, and the radio group it
 * is to a keyboard.
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
  const options = id => Array.from(group(id).querySelectorAll('[role="radio"]'))
  const option = (id, mode) => options(id).find(o => o.getAttribute('data-mode') === mode)
  const checked = id => options(id).filter(o => o.getAttribute('aria-checked') === 'true').map(o => o.getAttribute('data-mode'))
  const stops = id => options(id).filter(o => o.tabIndex === 0).map(o => o.getAttribute('data-mode'))
  const later = (read, wait) => new Promise(done => setTimeout(() => done(read()), wait || 60))
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'appearance-picker-browser',
    width: 700,
    height: 500,
    ready: `document.querySelectorAll('#picker [role="radio"]').length === 3 && document.querySelectorAll('#two [role="radio"]').length === 2`,
    body: `
<script client>
const appearance = state('auto')
const heard = []
window.probe = { appearance, heard }
</script>
<div style="padding: 30px">
  <AppearancePicker id="picker" v-model:value="appearance" label="Appearance" @change="heard.push($event)" />
</div>
<div style="padding: 30px">
  <AppearancePicker id="two" value="dark" :options="[{ value: 'light', label: 'Hell' }, { value: 'dark', label: 'Dunkel' }, { value: 'sepia', label: 'Sepia' }]" />
  <AppearancePicker id="fallback" value="nonsense" />
  <AppearancePicker id="off" value="light" disabled />
</div>`,
  })
}, 60_000)

afterAll(() => page?.close())

describe('what is drawn', () => {
  it('raises no script errors', async () => {
    expect(await page.errors()).toEqual([])
  })

  it('draws three pictures, 67 by 44 with rounded corners, 16 apart', async () => {
    const drawn = await page.json(on(`
      const thumbs = options('picker').map(o => o.querySelector('.stx-appearance-thumb'))
      const rects = thumbs.map(t => t.getBoundingClientRect())
      return { sizes: rects.map(r => [r.width, r.height]), gaps: rects.slice(1).map((r, i) => r.left - rects[i].right), radius: getComputedStyle(thumbs[0]).borderRadius, modes: options('picker').map(o => o.getAttribute('data-mode')) }
    `))

    expect(drawn.modes).toEqual(['light', 'dark', 'auto'])
    expect(drawn.sizes).toEqual([[67, 44], [67, 44], [67, 44]])
    expect(drawn.gaps).toEqual([16, 16])
    expect(drawn.radius).toBe('7px')
  })

  it('shows one scheme in light and in dark, and half of each in auto', async () => {
    const drawn = await page.json(on(`
      const scenes = mode => Array.from(option('picker', mode).querySelectorAll('.stx-appearance-scene')).filter(s => getComputedStyle(s).display !== 'none').map(s => { const r = s.getBoundingClientRect(), t = s.parentElement.getBoundingClientRect(); return [s.getAttribute('data-scheme'), r.left - t.left, r.width] })
      return { light: scenes('light'), dark: scenes('dark'), auto: scenes('auto') }
    `))

    expect(drawn.light).toEqual([['light', 0, 67]])
    expect(drawn.dark).toEqual([['dark', 0, 67]])
    expect(drawn.auto).toEqual([['light', 0, 33.5], ['dark', 33.5, 33.5]])
  })

  it('rings the chosen picture, 2.5 thick and 2 away', async () => {
    const drawn = await page.json(on(`
      const ring = mode => { const s = getComputedStyle(option('picker', mode).querySelector('.stx-appearance-frame'), '::after'); return { width: s.borderTopWidth, colour: s.borderTopColor, top: s.top, radius: s.borderTopLeftRadius } }
      const swatch = document.createElement('i'); swatch.style.background = 'var(--stx-mac-accent)'; document.body.append(swatch)
      const accentColour = getComputedStyle(swatch).backgroundColor; swatch.remove()
      return { accentColour, on: ring('auto'), off: ring('light') }
    `))

    // 2.5, which an engine drawing at one pixel a point rounds to 2.
    expect(drawn.on.width).toMatch(/^(2\.5|2)px$/)
    expect(drawn.on.colour).toBe(drawn.accentColour)
    expect(drawn.on.top).toBe('-4.5px')
    expect(drawn.on.radius).toBe('11.5px')
    expect(drawn.off.colour).toBe('rgba(0, 0, 0, 0)')
  })

  it('captions each picture, the chosen one bold and in full ink', async () => {
    const drawn = await page.json(on(`
      const caption = mode => { const c = option('picker', mode).querySelector('.stx-appearance-caption'), s = getComputedStyle(c); return { text: c.textContent, size: s.fontSize, weight: s.fontWeight, colour: s.color, below: c.getBoundingClientRect().top - option('picker', mode).querySelector('.stx-appearance-thumb').getBoundingClientRect().bottom } }
      return { light: caption('light'), dark: caption('dark'), auto: caption('auto'), renamed: options('two').map(o => o.textContent.trim()) }
    `))

    expect(drawn.light).toEqual({ text: 'Light', size: '11px', weight: '400', colour: 'rgba(0, 0, 0, 0.5)', below: 5 })
    expect(drawn.dark.text).toBe('Dark')
    expect(drawn.auto).toEqual({ text: 'Auto', size: '11px', weight: '600', colour: 'rgba(0, 0, 0, 0.85)', below: 5 })
    expect(drawn.renamed).toEqual(['Hell', 'Dunkel'])
  })
})

describe('a radio group', () => {
  it('names the group, and each picture by its caption', async () => {
    const info = await page.json(on(`
      return { role: group('picker').getAttribute('role'), label: group('picker').getAttribute('aria-label'), names: options('picker').map(o => o.textContent.trim()), hidden: options('picker').map(o => o.querySelector('.stx-appearance-frame').getAttribute('aria-hidden')), checked: checked('picker') }
    `))

    expect(info.role).toBe('radiogroup')
    expect(info.label).toBe('Appearance')
    expect(info.names).toEqual(['Light', 'Dark', 'Auto'])
    expect(info.hidden).toEqual(['true', 'true', 'true'])
    expect(info.checked).toEqual(['auto'])
  })

  it('leaves out a choice that is not offered or is not a mode, and falls back to auto', async () => {
    const result = await page.json(on(`return { two: options('two').map(o => o.getAttribute('data-mode')), chosen: checked('two'), fallback: checked('fallback') }`))

    expect(result).toEqual({ two: ['light', 'dark'], chosen: ['dark'], fallback: ['auto'] })
  })

  it('has one tab stop, on the chosen picture', async () => {
    expect(await page.json(on(`return [stops('picker'), stops('two')]`))).toEqual([['auto'], ['dark']])
  })

  it('chooses with a click, and says so once', async () => {
    const result = await page.json(on(`
      option('picker', 'light').click()
      option('picker', 'light').click()
      return later(() => ({ model: probe.appearance(), checked: checked('picker'), stops: stops('picker'), heard: probe.heard.slice() }))
    `))

    expect(result).toEqual({ model: 'light', checked: ['light'], stops: ['light'], heard: ['light'] })
  })

  it('moves the choice and the focus with the arrow keys, round the ends, and to them with Home and End', async () => {
    const result = await page.json(on(`
      const out = {}, focused = () => document.activeElement.getAttribute('data-mode')
      option('picker', 'light').focus()
      const handled = !press(option('picker', 'light'), 'ArrowLeft'); out.wrap = [probe.appearance(), focused()]
      press(option('picker', 'auto'), 'ArrowRight'); out.right = [probe.appearance(), focused()]
      press(option('picker', 'light'), 'ArrowDown'); out.down = [probe.appearance(), focused()]
      press(option('picker', 'dark'), 'End'); out.end = [probe.appearance(), focused()]
      press(option('picker', 'auto'), 'Home'); out.home = [probe.appearance(), focused()]
      press(option('picker', 'light'), 'ArrowUp'); out.up = [probe.appearance(), focused()]
      out.handled = handled; out.ignored = press(option('picker', 'auto'), 'a')
      return later(() => Object.assign(out, { checked: checked('picker'), stops: stops('picker') }))
    `))

    expect(result.wrap).toEqual(['auto', 'auto'])
    expect(result.right).toEqual(['light', 'light'])
    expect(result.down).toEqual(['dark', 'dark'])
    expect(result.end).toEqual(['auto', 'auto'])
    expect(result.home).toEqual(['light', 'light'])
    expect(result.up).toEqual(['auto', 'auto'])
    expect(result.handled).toBe(true)
    expect(result.ignored).toBe(true)
    expect(result.checked).toEqual(['auto'])
    expect(result.stops).toEqual(['auto'])
  })

  it('chooses the focused picture with Space', async () => {
    const result = await page.json(on(`
      const handled = !press(option('picker', 'dark'), ' ')
      return later(() => ({ handled, model: probe.appearance(), checked: checked('picker') }))
    `))

    expect(result).toEqual({ handled: true, model: 'dark', checked: ['dark'] })
  })

  it('takes a new choice from the page, and changes nothing else on the page', async () => {
    const result = await page.json(on(`
      probe.appearance.set('light')
      return later(() => ({ checked: checked('picker'), dark: document.documentElement.classList.contains('dark'), heard: probe.heard.length }))
    `))

    // It reports a choice. Putting it into effect is the page's business.
    expect(result.checked).toEqual(['light'])
    expect(result.dark).toBe(false)
    expect(result.heard).toBe(8)
  })

  it('does nothing while disabled', async () => {
    const result = await page.json(on(`
      option('off', 'dark').click()
      press(option('off', 'light'), 'ArrowRight')
      return later(() => ({ checked: checked('off'), disabled: options('off').map(o => o.disabled), aria: group('off').getAttribute('aria-disabled') }))
    `))

    expect(result).toEqual({ checked: ['light'], disabled: [true, true, true], aria: 'true' })
  })
})

describe('in the dark', () => {
  it('captions in the dark inks', async () => {
    const colours = await page.json(on(`
      document.documentElement.classList.add('dark')
      const read = mode => getComputedStyle(option('picker', mode).querySelector('.stx-appearance-caption')).color
      const out = { on: read('light'), off: read('dark') }
      document.documentElement.classList.remove('dark')
      return out
    `))

    expect(colours).toEqual({ on: 'rgba(255, 255, 255, 0.85)', off: 'rgba(255, 255, 255, 0.55)' })
  })
})
