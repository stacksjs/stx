/**
 * The form controls in their Mac look, in a real browser: that each is the
 * size System Settings draws it, that it still does what the control does
 * (toggle, choose, type, step, bind, submit), and that asking for nothing
 * still renders exactly the control the library had before the look existed.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { processDirectives } from '../../../stx/src/process'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

const ROOT = resolve(import.meta.dir, '../..')

/* The light values of the tokens the assertions name, as a browser reports them. */
const WELL = 'rgba(0, 0, 0, 0.07)'
const SWITCH_ON = 'rgb(52, 199, 89)'
const CONTROL = 'rgb(255, 255, 255)'
const DANGER = 'rgb(255, 59, 48)'
const CLEAR = 'rgba(0, 0, 0, 0)'

let page: BrowserPage
/* The accent is the page's own (`--stx-accent`), so it is read, not assumed. */
let ACCENT = ''
let DARK_ACCENT = ''

const HELPERS = `
  const within = (id, selector) => document.getElementById(id).querySelector(selector)
  const every = (id, selector) => Array.from(document.getElementById(id).querySelectorAll(selector))
  const box = el => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height, x: r.left, y: r.top } }
  const look = (el, pseudo) => getComputedStyle(el, pseudo || null)
  const form = () => Object.fromEntries(new FormData(document.getElementById('form')))
  const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  const type = (el, text) => { el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })) }
  const choose = (el, value) => { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })) }
  /* Read once the 150ms transitions and the runtime's own flush are over. */
  const later = read => new Promise(done => setTimeout(() => done(read()), 280))
  const rules = () => Array.from(document.styleSheets).flatMap(sheet => Array.from(sheet.cssRules))
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'mac-controls-browser',
    width: 700,
    height: 900,
    ready: `window.probe && document.querySelectorAll('#seg .stx-mac-segment').length === 3 && document.querySelector('#radio-slot [aria-checked="true"]')`,
    body: `
<script client>
const tint = state(true)
const size = state('medium')
const period = state('week')
const name = state('Chris')
const count = state('3')
const heard = { tint: [], size: [], period: [], menubar: [], scroll: [], click: [], clicks: [] }
window.probe = { tint, size, period, name, count, heard }
</script>
<form id="form" style="padding: 20px; width: 500px">
  <div id="sw"><Switch variant="mac" v-model:checked="tint" name="tint" @change="heard.tint.push($event)" /></div>
  <div id="sw-off"><Switch variant="mac" label="Hidden bar" /></div>
  <div id="sw-mini"><Switch variant="mac" size="mini" checked /></div>
  <div id="sw-mini-off"><Switch variant="mac" size="mini" /></div>
  <div id="sw-disabled"><Switch variant="mac" disabled /></div>
  <div id="popup"><Select variant="mac" v-model:value="size" name="size" placeholder="" :options="[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]" @change="heard.size.push($event)" /></div>
  <div id="seg"><SegmentedControl variant="mac" v-model:value="period" label="Period" :options="[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]" @change="heard.period.push($event)" /></div>
  <div id="cb"><Checkbox variant="mac" checked label="Show in menu bar" name="menubar" value="yes" @change="heard.menubar.push($event)" /></div>
  <div id="cb-off"><Checkbox variant="mac" label="Off" /></div>
  <div id="cb-mixed"><Checkbox variant="mac" indeterminate label="Mixed" /></div>
  <div id="cb-disabled"><Checkbox variant="mac" checked disabled label="Disabled" /></div>
  <div id="radio"><RadioGroup variant="mac" value="auto" :options="[{ value: 'auto', label: 'Automatically' }, { value: 'scrolling', label: 'When scrolling' }, { value: 'always', label: 'Always' }, { value: 'never', label: 'Never', disabled: true }]" @change="heard.scroll.push($event)" /></div>
  <div id="radio-slot">
    <RadioGroup variant="mac" value="page" @change="heard.click.push($event)">
      <RadioGroupOption variant="mac" value="page">Jump to the next page</RadioGroupOption>
      <RadioGroupOption variant="mac" value="spot">Jump to the spot that is clicked</RadioGroupOption>
    </RadioGroup>
  </div>
  <div id="btn"><Button appearance="mac" @click="heard.clicks.push('plain')">Cancel</Button></div>
  <div id="btn-primary"><Button appearance="mac" variant="primary" @click="heard.clicks.push('primary')">Save</Button></div>
  <div id="btn-danger"><Button appearance="mac" variant="danger">Delete</Button></div>
  <div id="btn-ghost"><Button appearance="mac" variant="ghost">Plain</Button></div>
  <div id="btn-disabled"><Button appearance="mac" disabled @click="heard.clicks.push('disabled')">Off</Button></div>
  <div id="field" style="width: 180px"><TextInput variant="mac" v-model:value="name" name="name" placeholder="Name" clearable /></div>
  <div id="field-invalid" style="width: 180px"><TextInput variant="mac" error value="bad" /></div>
  <div id="field-disabled" style="width: 180px"><TextInput variant="mac" disabled value="off" /></div>
  <div id="secure" style="width: 180px"><PasswordInput variant="mac" value="hunter22" name="secret" /></div>
  <div id="stepper"><NumberInput variant="mac" v-model:value="count" name="count" min="0" max="5" /></div>
</form>
<div id="dark" class="dark" style="padding: 20px; background: #1e1e1e">
  <Switch variant="mac" checked />
  <Switch variant="mac" />
  <Checkbox variant="mac" checked label="On" />
  <SegmentedControl variant="mac" value="a" :options="['a', 'b']" />
  <Button appearance="mac">Plain</Button>
  <TextInput variant="mac" value="text" />
</div>
<div id="inactive" data-stx-window-active="false" style="padding: 20px">
  <Switch variant="mac" checked />
  <Checkbox variant="mac" checked label="On" />
  <RadioGroup variant="mac" value="a" :options="[{ value: 'a', label: 'A' }]" />
  <Button appearance="mac" variant="primary">Save</Button>
</div>`,
  })
  const accents = await page.json(on(`
    const resolved = host => { const probe = document.createElement('i'); probe.style.background = 'var(--stx-mac-accent)'; host.appendChild(probe); const colour = look(probe).backgroundColor; probe.remove(); return colour }
    return [resolved(document.body), resolved(document.getElementById('dark'))]
  `))
  ACCENT = accents[0]
  DARK_ACCENT = accents[1]
}, 60_000)

afterAll(() => page?.close())

describe('the page', () => {
  it('raises no script errors', async () => {
    expect(await page.errors()).toEqual([])
  })

  it('has an accent to draw with, and it is not the switch\'s green', () => {
    expect(ACCENT).not.toBe('')
    expect(ACCENT).not.toBe(CLEAR)
    expect(ACCENT).not.toBe(SWITCH_ON)
    expect(DARK_ACCENT).not.toBe(CLEAR)
  })

  it('draws every control from the system font at 13px, with the arrow cursor', async () => {
    const drawn = await page.json(on(`
      const read = el => ({ size: look(el).fontSize, cursor: look(el).cursor, system: /system|apple|Segoe/i.test(look(el).fontFamily) })
      return [within('sw', 'label'), within('popup', 'select'), within('seg', 'button'), within('cb', 'label'), within('radio', '[role="radio"]'), within('btn', 'button'), within('field', 'input')].map(read)
    `))

    for (const control of drawn.slice(0, 6))
      expect(control).toEqual({ size: '13px', cursor: 'default', system: true })
    // A text field is where the I-beam belongs.
    expect(drawn[6].size).toBe('13px')
    expect(drawn[6].system).toBe(true)
  })
})

describe('the switch', () => {
  it('is a 36x20 capsule whose 22x16 pill slides 10', async () => {
    const drawn = await page.json(on(`
      const read = id => { const track = within(id, '[role="switch"]'), knob = track.firstElementChild; return { track: box(track), knob: box(knob), inset: [box(knob).x - box(track).x, box(knob).y - box(track).y], radius: look(track).borderRadius, knobRadius: look(knob).borderRadius, fill: look(track).backgroundColor } }
      return later(() => ({ on: read('sw'), off: read('sw-off'), mini: read('sw-mini'), miniOff: read('sw-mini-off') }))
    `))

    expect([drawn.on.track.w, drawn.on.track.h]).toEqual([36, 20])
    expect([Math.round(drawn.on.knob.w), drawn.on.knob.h]).toEqual([22, 16])
    expect(drawn.on.radius).toBe('10px')
    expect(drawn.on.knobRadius).toBe('8px')
    expect(drawn.off.inset).toEqual([2, 2])
    expect(drawn.on.inset).toEqual([12, 2])

    expect([drawn.mini.track.w, drawn.mini.track.h]).toEqual([26, 15])
    expect([drawn.mini.knob.w, drawn.mini.knob.h]).toEqual([16, 11])
    expect(drawn.miniOff.inset).toEqual([2, 2])
    expect(drawn.mini.inset).toEqual([8, 2])
  })

  it('is sunk when off and green, not the accent, when on', async () => {
    const fills = await page.json(on(`return [look(within('sw-off', '[role="switch"]')).backgroundColor, look(within('sw', '[role="switch"]')).backgroundColor, look(within('sw', '[role="switch"]').firstElementChild).backgroundColor]`))

    expect(fills).toEqual([WELL, SWITCH_ON, CONTROL])
  })

  it('toggles, says so, and carries its value in the form', async () => {
    const result = await page.json(on(`
      const track = within('sw', '[role="switch"]')
      const before = { checked: track.getAttribute('aria-checked'), form: form().tint }
      track.click()
      return later(() => ({ before, checked: track.getAttribute('aria-checked'), model: probe.tint(), heard: probe.heard.tint.slice(), form: form().tint, x: box(track.firstElementChild).x - box(track).x, fill: look(track).backgroundColor }))
    `))

    expect(result.before).toEqual({ checked: 'true', form: 'true' })
    expect(result.checked).toBe('false')
    expect(result.model).toBe(false)
    expect(result.heard).toEqual([false])
    expect(result.form).toBe('false')
    expect(result.x).toBe(2)
    expect(result.fill).toBe(WELL)
  })

  it('follows its model back', async () => {
    const result = await page.json(on(`
      const track = within('sw', '[role="switch"]')
      probe.tint.set(true)
      return later(() => ({ checked: track.getAttribute('aria-checked'), form: form().tint, x: box(track.firstElementChild).x - box(track).x }))
    `))

    expect(result).toEqual({ checked: 'true', form: 'true', x: 12 })
  })

  it('is a real button, so Space and Enter work it, and its label names it', async () => {
    const info = await page.json(on(`
      const track = within('sw-off', '[role="switch"]')
      const label = within('sw-off', 'label')
      label.querySelector('span').click()
      return later(() => ({ tag: track.tagName, type: track.type, tab: track.tabIndex, name: track.getAttribute('aria-label'), afterLabelClick: track.getAttribute('aria-checked') }))
    `))

    expect(info).toEqual({ tag: 'BUTTON', type: 'button', tab: 0, name: 'Hidden bar', afterLabelClick: 'true' })
  })

  it('dims to half and ignores a click when disabled, with no change of cursor', async () => {
    const result = await page.json(on(`
      const track = within('sw-disabled', '[role="switch"]')
      track.click()
      return later(() => ({ checked: track.getAttribute('aria-checked'), opacity: look(track).opacity, cursor: look(track).cursor, disabled: track.disabled }))
    `))

    expect(result).toEqual({ checked: 'false', opacity: '0.5', cursor: 'default', disabled: true })
  })
})

describe('the pop-up button', () => {
  it('is borderless text ending in a 20px disc', async () => {
    const drawn = await page.json(on(`
      const select = within('popup', 'select'), disc = within('popup', '.stx-mac-popup-disc')
      const s = look(select), d = look(disc)
      return { height: box(select).h, border: s.borderTopWidth, fill: s.backgroundColor, align: s.textAlign, appearance: s.appearance || s.webkitAppearance, gap: Number.parseFloat(s.paddingRight) - box(disc).w, disc: box(disc), discRadius: d.borderRadius, discFill: d.backgroundColor, flush: Math.round(box(disc).x + box(disc).w - box(select).x - box(select).w), chevrons: [look(disc, '::before').borderTopWidth, look(disc, '::after').borderTopWidth], through: d.pointerEvents }
    `))

    expect(drawn.height).toBe(20)
    expect(drawn.border).toBe('0px')
    expect(drawn.fill).toBe(CLEAR)
    expect(drawn.align).toBe('right')
    expect(drawn.appearance).toBe('none')
    expect(drawn.gap).toBe(8)
    expect([drawn.disc.w, drawn.disc.h]).toEqual([20, 20])
    expect(drawn.discRadius).toBe('50%')
    expect(drawn.discFill).toBe(WELL)
    expect(drawn.flush).toBe(0)
    // One and a half pixels, which an engine drawing at one pixel a point
    // reports as the whole pixel it can draw.
    expect(drawn.chevrons.every((width: string) => width === '1.5px' || width === '1px')).toBe(true)
    // The disc is a picture: the select under it takes the click.
    expect(drawn.through).toBe('none')
  })

  it('chooses, says so, and carries its value in the form', async () => {
    const result = await page.json(on(`
      const select = within('popup', 'select')
      const before = { value: select.value, form: form().size, options: Array.from(select.options).map(o => o.textContent.trim()) }
      choose(select, 'large')
      return later(() => ({ before, model: probe.size(), heard: probe.heard.size.slice(), form: form().size }))
    `))

    expect(result.before).toEqual({ value: 'medium', form: 'medium', options: ['Small', 'Medium', 'Large'] })
    expect(result.model).toBe('large')
    expect(result.heard).toEqual(['large'])
    expect(result.form).toBe('large')
  })

  it('follows its model back', async () => {
    expect(await page.json(on(`probe.size.set('small'); return later(() => within('popup', 'select').value)`))).toBe('small')
  })

  it('is still a native select, so the menu and its keys are the platform\'s', async () => {
    const info = await page.json(on(`const select = within('popup', 'select'); return { tag: select.tagName, tab: select.tabIndex, multiple: select.multiple }`))

    expect(info).toEqual({ tag: 'SELECT', tab: 0, multiple: false })
  })
})

describe('the segmented control', () => {
  it('is a 24px capsule track with the chosen segment raised in it', async () => {
    const drawn = await page.json(on(`
      const track = within('seg', '[role="group"]'), segments = every('seg', 'button')
      return { height: box(track).h, radius: look(track).borderRadius, fill: look(track).backgroundColor, segments: segments.map(s => ({ h: box(s).h, radius: look(s).borderRadius, fill: look(s).backgroundColor, raised: look(s).boxShadow !== 'none', pressed: s.getAttribute('aria-pressed') })) }
    `))

    expect(drawn.height).toBe(24)
    expect(drawn.radius).toBe('12px')
    expect(drawn.fill).toBe(WELL)
    expect(drawn.segments).toEqual([
      { h: 20, radius: '10px', fill: CLEAR, raised: false, pressed: 'false' },
      { h: 20, radius: '10px', fill: CONTROL, raised: true, pressed: 'true' },
      { h: 20, radius: '10px', fill: CLEAR, raised: false, pressed: 'false' },
    ])
  })

  it('chooses on a click and says so', async () => {
    const result = await page.json(on(`
      every('seg', 'button')[2].click()
      return later(() => ({ model: probe.period(), heard: probe.heard.period.slice(), pressed: every('seg', 'button').map(s => s.getAttribute('aria-pressed')), fills: every('seg', 'button').map(s => look(s).backgroundColor) }))
    `))

    expect(result.model).toBe('month')
    expect(result.heard).toEqual(['month'])
    expect(result.pressed).toEqual(['false', 'false', 'true'])
    expect(result.fills).toEqual([CLEAR, CLEAR, CONTROL])
  })

  it('follows its model back, and each segment is a button in the tab order', async () => {
    const result = await page.json(on(`
      probe.period.set('day')
      return later(() => ({ pressed: every('seg', 'button').map(s => s.getAttribute('aria-pressed')), buttons: every('seg', 'button').map(s => s.tagName + ':' + s.tabIndex), group: within('seg', '[role="group"]').getAttribute('aria-label') }))
    `))

    expect(result.pressed).toEqual(['true', 'false', 'false'])
    expect(result.buttons).toEqual(['BUTTON:0', 'BUTTON:0', 'BUTTON:0'])
    expect(result.group).toBe('Period')
  })
})

describe('the checkbox', () => {
  it('is a 14px box with 4px corners, sunk when off and the accent when on', async () => {
    const drawn = await page.json(on(`
      const read = id => { const input = within(id, 'input'); return { w: box(input).w, h: box(input).h, radius: look(input).borderRadius, fill: look(input).backgroundColor } }
      const mark = id => look(within(id, '.stx-mac-checkbox-mark'), '::before')
      return { on: read('cb'), off: read('cb-off'), mixed: read('cb-mixed'), mixedState: within('cb-mixed', 'input').indeterminate, tick: [mark('cb').opacity, mark('cb-off').opacity, mark('cb-mixed').opacity], ink: look(within('cb', '.stx-mac-checkbox-mark')).color }
    `))

    expect(drawn.on).toEqual({ w: 14, h: 14, radius: '4px', fill: ACCENT })
    expect(drawn.off).toEqual({ w: 14, h: 14, radius: '4px', fill: WELL })
    expect(drawn.mixedState).toBe(true)
    expect(drawn.mixed.fill).toBe(ACCENT)
    expect(drawn.tick).toEqual(['1', '0', '1'])
    expect(drawn.ink).toBe(CONTROL)
  })

  it('toggles from the box and from its label, says so, and submits like a checkbox', async () => {
    const result = await page.json(on(`
      const input = within('cb', 'input')
      const before = form().menubar
      input.click()
      const off = { checked: input.checked, form: 'menubar' in form(), fill: null }
      within('cb', 'label').click()
      return later(() => ({ before, off, checked: input.checked, form: form().menubar, heard: probe.heard.menubar.slice(), fill: look(input).backgroundColor }))
    `))

    expect(result.before).toBe('yes')
    expect(result.off.checked).toBe(false)
    expect(result.off.form).toBe(false)
    expect(result.checked).toBe(true)
    expect(result.form).toBe('yes')
    expect(result.heard).toEqual([false, true])
    expect(result.fill).toBe(ACCENT)
  })

  it('is a real checkbox, so Space works it, and dims to half when disabled', async () => {
    const info = await page.json(on(`
      const input = within('cb', 'input'), off = within('cb-disabled', 'input')
      return { type: input.type, tab: input.tabIndex, name: input.getAttribute('aria-label'), disabled: off.disabled, opacity: look(off).opacity, cursor: look(off).cursor }
    `))

    expect(info).toEqual({ type: 'checkbox', tab: 0, name: 'Show in menu bar', disabled: true, opacity: '0.5', cursor: 'default' })
  })
})

describe('the radio buttons', () => {
  it('are 15px circles 22 apart, sunk when off and the accent around a white dot when on', async () => {
    const drawn = await page.json(on(`
      const options = every('radio', '[role="radio"]')
      const circle = el => { const c = look(el, '::before'); return { w: c.width, h: c.height, radius: c.borderRadius, fill: c.backgroundColor, dot: c.backgroundImage.includes('radial-gradient') } }
      return { circles: options.slice(0, 2).map(circle), pitch: box(options[1]).y - box(options[0]).y, gap: look(options[0]).columnGap, card: look(options[0]).backgroundColor, shadow: look(options[0]).boxShadow }
    `))

    expect(drawn.circles).toEqual([
      { w: '15px', h: '15px', radius: '50%', fill: ACCENT, dot: true },
      { w: '15px', h: '15px', radius: '50%', fill: WELL, dot: false },
    ])
    expect(drawn.pitch).toBe(22)
    expect(drawn.gap).toBe('8px')
    // None of the default look's card is left on a chosen option.
    expect(drawn.card).toBe(CLEAR)
    expect(drawn.shadow).toBe('none')
  })

  it('choose on a click, on Space and on Enter, and say so', async () => {
    const result = await page.json(on(`
      const options = every('radio', '[role="radio"]')
      const state = () => options.map(o => o.getAttribute('aria-checked'))
      options[1].click(); const clicked = state()
      key(options[2], ' '); const spaced = state()
      key(options[0], 'Enter'); const entered = state()
      key(options[1], 'a'); const ignored = state()
      return { clicked, spaced, entered, ignored, heard: probe.heard.scroll.slice(), tabs: options.map(o => o.tabIndex) }
    `))

    expect(result.clicked).toEqual(['false', 'true', 'false', 'false'])
    expect(result.spaced).toEqual(['false', 'false', 'true', 'false'])
    expect(result.entered).toEqual(['true', 'false', 'false', 'false'])
    expect(result.ignored).toEqual(result.entered)
    expect(result.heard).toEqual(['scrolling', 'always', 'auto'])
    expect(result.tabs).toEqual([0, 0, 0, -1])
  })

  it('leave a disabled option alone, at half strength', async () => {
    const result = await page.json(on(`
      const options = every('radio', '[role="radio"]')
      options[3].click(); key(options[3], ' ')
      return { checked: options[3].getAttribute('aria-checked'), opacity: look(options[3]).opacity, cursor: look(options[3]).cursor, heard: probe.heard.scroll.length }
    `))

    expect(result).toEqual({ checked: 'false', opacity: '0.5', cursor: 'default', heard: 3 })
  })

  it('work the same written as RadioGroupOption children', async () => {
    const result = await page.json(on(`
      const options = every('radio-slot', '[role="radio"]')
      const before = options.map(o => o.getAttribute('aria-checked'))
      const fill = () => options.map(o => look(o, '::before').backgroundColor)
      const fillBefore = fill()
      key(options[1], ' ')
      return later(() => ({ before, fillBefore, after: options.map(o => o.getAttribute('aria-checked')), fill: fill(), card: options.map(o => look(o).backgroundColor), heard: probe.heard.click.slice(), size: look(options[0], '::before').width }))
    `))

    expect(result.before).toEqual(['true', 'false'])
    expect(result.fillBefore).toEqual([ACCENT, WELL])
    expect(result.after).toEqual(['false', 'true'])
    expect(result.fill).toEqual([WELL, ACCENT])
    expect(result.card).toEqual([CLEAR, CLEAR])
    expect(result.heard).toEqual(['spot'])
    expect(result.size).toBe('15px')
  })
})

describe('the push button', () => {
  it('is 22 tall, a capsule, with 12 either side of 13px words', async () => {
    const drawn = await page.json(on(`
      const b = within('btn', 'button'), s = look(b)
      return { h: box(b).h, radius: s.borderRadius, padding: [s.paddingLeft, s.paddingRight], size: s.fontSize, fill: s.backgroundColor, raised: s.boxShadow !== 'none', words: b.textContent.trim() }
    `))

    expect(drawn).toEqual({ h: 22, radius: '11px', padding: ['12px', '12px'], size: '13px', fill: CONTROL, raised: true, words: 'Cancel' })
  })

  it('draws intent from variant: plain, the accent default button, destructive, faceless', async () => {
    const drawn = await page.json(on(`
      const read = id => { const b = within(id, 'button'), s = look(b); return { intent: b.dataset.intent, fill: s.backgroundColor, ink: s.color } }
      return { plain: read('btn'), primary: read('btn-primary'), danger: read('btn-danger'), ghost: read('btn-ghost') }
    `))

    expect(drawn.plain.intent).toBe('default')
    expect(drawn.primary).toEqual({ intent: 'primary', fill: ACCENT, ink: CONTROL })
    expect(drawn.danger).toEqual({ intent: 'destructive', fill: CONTROL, ink: DANGER })
    expect(drawn.ghost).toEqual({ intent: 'plain', fill: CLEAR, ink: drawn.plain.ink })
  })

  it('emits its click, and not when disabled', async () => {
    const result = await page.json(on(`
      within('btn', 'button').click(); within('btn-primary', 'button').click(); within('btn-disabled', 'button').click()
      const off = within('btn-disabled', 'button')
      return { heard: probe.heard.clicks.slice(), tag: within('btn', 'button').tagName, type: within('btn', 'button').type, opacity: look(off).opacity, cursor: look(off).cursor }
    `))

    expect(result).toEqual({ heard: ['plain', 'primary'], tag: 'BUTTON', type: 'button', opacity: '0.5', cursor: 'default' })
  })
})

describe('the text field and the secure field', () => {
  it('are 24 tall with 6px corners, a raised face inside a hairline, and 7 of padding', async () => {
    const drawn = await page.json(on(`
      const read = id => { const input = within(id, 'input'), s = look(input); return { h: box(input).h, w: box(input).w, radius: s.borderRadius, fill: s.backgroundColor, left: s.paddingLeft, size: s.fontSize, border: s.borderTopWidth, line: s.boxShadow.includes('inset') } }
      return { text: read('field'), secure: read('secure'), invalid: look(within('field-invalid', 'input')).boxShadow, off: look(within('field-disabled', 'input')).opacity }
    `))

    expect(drawn.text).toEqual({ h: 24, w: 180, radius: '6px', fill: CONTROL, left: '7px', size: '13px', border: '0px', line: true })
    expect(drawn.secure).toEqual({ h: 24, w: 180, radius: '6px', fill: CONTROL, left: '7px', size: '13px', border: '0px', line: true })
    expect(drawn.invalid).toContain(DANGER)
    expect(drawn.off).toBe('0.5')
  })

  it('takes typing into its model and its form, and follows the model back', async () => {
    const result = await page.json(on(`
      const input = within('field', 'input')
      const before = { value: input.value, form: form().name }
      type(input, 'Avery')
      const typed = { model: probe.name(), form: form().name }
      probe.name.set('Blake')
      return later(() => ({ before, typed, value: input.value, type: input.type, tab: input.tabIndex }))
    `))

    expect(result.before).toEqual({ value: 'Chris', form: 'Chris' })
    expect(result.typed).toEqual({ model: 'Avery', form: 'Avery' })
    expect(result.value).toBe('Blake')
    expect(result.type).toBe('text')
    expect(result.tab).toBe(0)
  })

  it('empties from its clear button, which is there only while there is something to clear', async () => {
    const result = await page.json(on(`
      const clear = within('field', '.stx-mac-field-clear')
      const shown = look(clear).display !== 'none'
      clear.click()
      return later(() => ({ shown, model: probe.name(), value: within('field', 'input').value, hidden: look(clear).display === 'none', name: clear.getAttribute('aria-label') }))
    `))

    expect(result).toEqual({ shown: true, model: '', value: '', hidden: true, name: 'Clear input' })
  })

  it('keeps a password hidden until asked, and submits it', async () => {
    const result = await page.json(on(`
      const input = within('secure', 'input'), reveal = within('secure', '.stx-mac-field-reveal')
      const before = { type: input.type, form: form().secret, name: reveal.getAttribute('aria-label') }
      reveal.click()
      return later(() => { const shown = { type: input.type, name: reveal.getAttribute('aria-label') }; reveal.click(); type(input, 'correct horse'); return later(() => ({ before, shown, type: input.type, form: form().secret })) })
    `))

    expect(result.before).toEqual({ type: 'password', form: 'hunter22', name: 'Show password' })
    expect(result.shown).toEqual({ type: 'text', name: 'Hide password' })
    expect(result.type).toBe('password')
    expect(result.form).toBe('correct horse')
  })
})

describe('the stepper', () => {
  it('is a narrow field with its digits to the right, beside a 15x22 capsule', async () => {
    const drawn = await page.json(on(`
      const input = within('stepper', 'input'), capsule = within('stepper', '.stx-mac-stepper-buttons'), halves = every('stepper', '.stx-mac-stepper-button')
      return { field: box(input), align: look(input).textAlign, radius: look(input).borderRadius, capsule: box(capsule), capsuleRadius: look(capsule).borderRadius, fill: look(capsule).backgroundColor, raised: look(capsule).boxShadow !== 'none', halves: halves.map(h => [box(h).w, box(h).h]), gap: box(capsule).x - box(input).x - box(input).w, names: halves.map(h => h.getAttribute('aria-label')), chevrons: halves.map(h => look(h, '::before').borderTopWidth) }
    `))

    expect([drawn.field.w, drawn.field.h]).toEqual([56, 24])
    expect(drawn.align).toBe('right')
    expect(drawn.radius).toBe('6px')
    expect([drawn.capsule.w, drawn.capsule.h]).toEqual([15, 22])
    expect(drawn.capsuleRadius).toBe('7.5px')
    expect(drawn.fill).toBe(CONTROL)
    expect(drawn.raised).toBe(true)
    expect(drawn.halves).toEqual([[15, 11], [15, 11]])
    expect(drawn.gap).toBe(4)
    expect(drawn.names).toEqual(['Increment', 'Decrement'])
    // One and a half pixels, which an engine drawing at one pixel a point
    // reports as the whole pixel it can draw.
    expect(drawn.chevrons.every((width: string) => width === '1.5px' || width === '1px')).toBe(true)
  })

  it('steps up and down into its model and its form, and stops at its bounds', async () => {
    const result = await page.json(on(`
      const input = within('stepper', 'input'), up = within('stepper', '.stx-mac-stepper-up'), down = within('stepper', '.stx-mac-stepper-down')
      const read = () => [probe.count(), form().count]
      const before = read()
      up.click(); const one = read()
      up.click(); up.click(); up.click(); const top = read()
      for (let i = 0; i < 8; i++) down.click()
      return later(() => ({ before, one, top, bottom: read(), shown: input.value }))
    `))

    expect(result.before).toEqual(['3', '3'])
    expect(result.one).toEqual(['4', '4'])
    expect(result.top).toEqual(['5', '5'])
    expect(result.bottom).toEqual(['0', '0'])
    expect(result.shown).toBe('0')
  })

  it('takes typing, follows its model, and is a number input so the arrow keys step it', async () => {
    const result = await page.json(on(`
      const input = within('stepper', 'input')
      type(input, '2')
      const typed = probe.count()
      probe.count.set('4')
      return later(() => ({ typed, value: input.value, type: input.type, min: input.min, max: input.max, step: input.step, tab: input.tabIndex }))
    `))

    expect(result).toEqual({ typed: '2', value: '4', type: 'number', min: '0', max: '5', step: '1', tab: 0 })
  })
})

describe('states every control shares', () => {
  it('rings keyboard focus, and only keyboard focus, with the focus-ring token', async () => {
    // A headless view is never the key window, so nothing in it matches
    // :focus-visible. What can be read is the rule each control carries.
    const found = await page.json(on(`
      const focusRules = rules().filter(rule => rule.selectorText && rule.selectorText.includes(':focus-visible') && rule.style.getPropertyValue('box-shadow').includes('var(--stx-mac-focus-ring)'))
      const has = selector => focusRules.some(rule => rule.selectorText.split(',').some(part => part.trim().startsWith(selector)))
      const anyPlainFocus = rules().some(rule => rule.selectorText && /\\.stx-mac-[a-z-]+:focus(?!-)/.test(rule.selectorText))
      return { controls: ['.stx-mac-switch', '.stx-mac-popup-select', '.stx-mac-segment', '.stx-mac-checkbox', '.stx-mac-radio', '.stx-mac-button', '.stx-mac-field', '.stx-mac-stepper-buttons'].filter(selector => !has(selector)), anyPlainFocus, ring: look(document.documentElement).getPropertyValue('--stx-mac-focus-ring').trim() }
    `))

    expect(found.controls).toEqual([])
    expect(found.anyPlainFocus).toBe(false)
    expect(found.ring).toContain('0 0 0 3px')
  })

  it('stops moving under reduced motion, and gains lines under more contrast', async () => {
    const found = await page.json(on(`
      const media = word => rules().filter(rule => rule.media && rule.media.mediaText.includes(word)).flatMap(rule => Array.from(rule.cssRules))
      const still = media('prefers-reduced-motion').filter(rule => rule.style && rule.style.getPropertyValue('transition') === 'none').map(rule => rule.selectorText).join(', ')
      const lined = media('prefers-contrast').map(rule => rule.selectorText || '').join(', ')
      return { still: ['.stx-mac-switch', '.stx-mac-switch-knob', '.stx-mac-popup-disc', '.stx-mac-segment', '.stx-mac-checkbox', '.stx-mac-radio::before', '.stx-mac-button', '.stx-mac-field'].filter(s => !still.includes(s)), lined: ['.stx-mac-switch', '.stx-mac-popup-disc', '.stx-mac-segmented', '.stx-mac-checkbox', '.stx-mac-radio', '.stx-mac-button', '.stx-mac-stepper-buttons'].filter(s => !lined.includes(s)) }
    `))

    expect(found).toEqual({ still: [], lined: [] })
  })

  it('draws from the dark values under a dark class', async () => {
    const drawn = await page.json(on(`
      const switches = every('dark', '[role="switch"]')
      return { on: look(switches[0]).backgroundColor, off: look(switches[1]).backgroundColor, knob: look(switches[0].firstElementChild).backgroundColor, checkbox: look(within('dark', '.stx-mac-checkbox')).backgroundColor, track: look(within('dark', '.stx-mac-segmented')).backgroundColor, segment: look(within('dark', '.stx-mac-segment[aria-pressed="true"]')).backgroundColor, button: look(within('dark', '.stx-mac-button')).backgroundColor, ink: look(within('dark', '.stx-mac-button')).color, field: look(within('dark', '.stx-mac-field')).backgroundColor, fieldInk: look(within('dark', '.stx-mac-field')).color }
    `))

    expect(drawn).toEqual({
      on: 'rgb(48, 209, 88)',
      off: 'rgba(255, 255, 255, 0.1)',
      knob: CONTROL,
      checkbox: DARK_ACCENT,
      track: 'rgba(255, 255, 255, 0.1)',
      segment: 'rgba(255, 255, 255, 0.14)',
      button: 'rgba(255, 255, 255, 0.14)',
      ink: 'rgba(255, 255, 255, 0.85)',
      field: 'rgba(255, 255, 255, 0.14)',
      fieldInk: 'rgba(255, 255, 255, 0.85)',
    })
  })

  it('gives up its colour in a window that is not the key window', async () => {
    const drawn = await page.json(on(`
      const radio = look(within('inactive', '[role="radio"]'), '::before')
      return { switch: look(within('inactive', '[role="switch"]')).backgroundColor, checkbox: look(within('inactive', '.stx-mac-checkbox')).backgroundColor, tick: look(within('inactive', '.stx-mac-checkbox-mark')).color, radio: radio.backgroundColor, dot: radio.backgroundImage.includes('radial-gradient'), button: look(within('inactive', '.stx-mac-button')).backgroundColor, checked: within('inactive', '[role="switch"]').getAttribute('aria-checked') }
    `))

    // Still on, and still saying so: only the colour goes.
    expect(drawn.checked).toBe('true')
    expect(drawn.dot).toBe(true)
    for (const fill of [drawn.switch, drawn.checkbox, drawn.radio]) {
      expect(fill).not.toBe(SWITCH_ON)
      expect(fill).not.toBe(ACCENT)
      expect(fill).not.toBe(WELL)
    }
    expect(drawn.tick).toBe('rgba(0, 0, 0, 0.85)')
    expect(drawn.button).toBe(CONTROL)
  })
})

/*
 * The other half of the promise: a control that is not asked for the Mac
 * look is the control it was. Each one is rendered twice, from the file as
 * it is now and from the file as it is committed, and the markup compared.
 * (Once a change to these files is committed the two are the same file, and
 * what is left is the check that no Mac class reaches the default look.)
 */
const DEFAULTS: Array<{ files: string[], body: string }> = [
  { files: ['switch/Switch.stx'], body: `<Switch /><Switch checked label="Wi-Fi" name="wifi" size="sm" /><Switch disabled size="lg" className="extra" />` },
  { files: ['select/Select.stx'], body: `<Select label="Size" name="size" value="m" helperText="Pick one" required :options="['s', 'm', 'l']" /><Select size="sm" error disabled placeholder="" />` },
  { files: ['segmented-control/SegmentedControl.stx'], body: `<SegmentedControl value="a" label="Show" :options="['a', 'b']" /><SegmentedControl stretch size="lg" disabled testID="t" className="extra" :options="[{ value: 'x', label: 'X' }]" />` },
  { files: ['checkbox/Checkbox.stx'], body: `<Checkbox /><Checkbox checked label="Agree" description="To the terms" required name="agree" value="yes" size="lg" /><Checkbox appearance="switch" disabled error className="extra" />` },
  { files: ['radio-group/RadioGroup.stx', 'radio-group/RadioGroupOption.stx'], body: `<RadioGroup value="a" :options="[{ value: 'a', label: 'A', description: 'First' }, { value: 'b', label: 'B', disabled: true }]" /><RadioGroup value="x" className="extra"><RadioGroupOption value="x">X</RadioGroupOption><RadioGroupOption value="y" disabled className="extra">Y</RadioGroupOption></RadioGroup>` },
  { files: ['button/Button.stx'], body: `<Button>Save</Button><Button variant="danger" size="sm" disabled>Delete</Button><Button variant="ghost" loading fullWidth label="Wait" className="extra" /><Button variant="outline" type="submit" ariaLabel="Go">Go</Button>` },
  { files: ['input/TextInput.stx'], body: `<TextInput /><TextInput label="Name" name="name" value="Chris" placeholder="Name" helperText="Yours" required clearable maxLength="20" showCount /><TextInput type="date" min="2026-01-01" size="sm" error disabled className="extra" inputClassName="inner" />` },
  { files: ['input/PasswordInput.stx'], body: `<PasswordInput /><PasswordInput label="Password" name="pw" value="hunter22" helperText="Keep it safe" required showStrength size="lg" error />` },
  { files: ['input/NumberInput.stx'], body: `<NumberInput /><NumberInput label="Count" name="count" value="3" min="0" max="5" step="2" helperText="How many" required /><NumberInput disabled size="sm" error className="extra" inputClassName="inner" /><NumberInput :showControls="false" readonly />` },
]

/** The markup of a rendered page: no styles, no scripts, no build stamp, no blank lines. */
function markupOf(html: string): string {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<meta name="stx-build"[^>]*>/g, '')
    .split('\n')
    .filter(line => line.trim() !== '')
    .join('\n')
}

async function render(body: string, componentsDir: string): Promise<string> {
  const source = `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`
  const html = await processDirectives(source, {}, resolve(ROOT, 'mac-controls-default.stx'), { componentsDir, root: ROOT, cache: false, debug: false } as any, new Set())
  return markupOf(html)
}

/** A file as it is committed, or null where there is no repository to ask. */
function committed(path: string): string | null {
  try {
    const prefix = Bun.spawnSync(['git', 'rev-parse', '--show-prefix'], { cwd: ROOT })
    if (prefix.exitCode !== 0)
      return null
    const shown = Bun.spawnSync(['git', 'show', `HEAD:${prefix.stdout.toString().trim()}src/ui/${path}`], { cwd: ROOT })
    return shown.exitCode === 0 ? shown.stdout.toString() : null
  }
  catch {
    return null
  }
}

describe('the default look', () => {
  let before = ''

  beforeAll(() => {
    before = mkdtempSync(join(tmpdir(), 'stx-mac-controls-'))
  })

  afterAll(() => {
    if (before)
      rmSync(before, { recursive: true, force: true })
  })

  for (const { files, body } of DEFAULTS) {
    it(`of ${files.map(file => file.split('/')[1].replace('.stx', '')).join(' and ')} is the markup it was`, async () => {
      const now = await render(body, resolve(ROOT, 'src/ui'))

      expect(now).not.toContain('stx-mac-')
      expect(now).toContain('data-stx-scope')

      const sources = files.map(file => [file, committed(file)] as const)
      if (sources.some(([, source]) => source === null))
        return
      for (const [file, source] of sources) {
        mkdirSync(dirname(join(before, file)), { recursive: true })
        writeFileSync(join(before, file), source as string)
      }

      expect(now).toBe(await render(body, before))
    })
  }
})
