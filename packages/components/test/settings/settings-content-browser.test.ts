/**
 * What a Settings pane is made of, in a real browser: the card, its rows and
 * the rules between them, the pane's header card, and how a row names the
 * control it holds.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { EVENTS, openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

const HELPERS = `
  ${EVENTS}
  const $ = id => document.getElementById(id)
  const section = id => $(id)
  const card = id => $(id).querySelector(':scope > .stx-settings-card')
  const rows = id => Array.from(card(id).querySelectorAll('[data-settings-row]'))
  const row = setting => document.querySelector('[data-settings-row][data-setting="' + setting + '"]')
  const box = el => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height } }
  const rule = el => { const s = getComputedStyle(el, '::before'); return s.content === 'none' ? null : { top: s.top, left: s.left, right: s.right, height: s.height, colour: s.backgroundColor } }
  const nameOf = el => el.hasAttribute('aria-labelledby') ? el.getAttribute('aria-labelledby').split(' ').map(id => $(id) ? $(id).textContent.trim() : '?').join(' ') : (el.getAttribute('aria-label') || '')
  const describedBy = el => el.hasAttribute('aria-describedby') ? $(el.getAttribute('aria-describedby')).textContent.trim() : null
  const later = (read, wait) => new Promise(done => setTimeout(() => done(read()), wait || 60))
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'settings-content-browser',
    width: 700,
    height: 1400,
    ready: `document.querySelectorAll('#controls [data-stx-color-swatches] [role="radio"]').length === 2 && document.querySelector('[data-setting="text"] input').hasAttribute('aria-labelledby')`,
    body: `
<script client>
const size = state(1)
const colour = state('red')
const title = state('Sidebar icon size')
const heading = state('Windows')
window.probe = { size, colour, title, heading }
</script>
<div id="pane" style="width: 500px; margin: 0 auto; padding: 20px">
  <SettingsPaneHeader icon="i-f7-gear-alt-fill" tone="blue" title="General" description="Manage your overall setup and preferences." />
  <SettingsGroup id="first">
    <SettingsRow label="One" setting="one" keywords="first single" />
  </SettingsGroup>
  <SettingsGroup id="windows" :header="heading()" footer="Applies to new windows.">
    <SettingsRow :label="title()" setting="icon-size" :keywords="['sidebar', 'icons']"><span id="popup">Medium</span></SettingsRow>
    <SettingsRow label="Tint window background" description="Uses the wallpaper colour." setting="tint"><button type="button" role="switch" aria-checked="false" style="width: 36px; height: 20px"></button></SettingsRow>
    <SettingsRow label="Hidden one" setting="hidden-one" />
    <SettingsRow label="Last" setting="last" />
  </SettingsGroup>
  <SettingsGroup id="linked" header="Privacy">
    <SettingsRow label="Share analytics" setting="analytics" />
    <template #footer>Read the <a id="link" href="#privacy">privacy notes</a>.</template>
  </SettingsGroup>
  <SettingsGroup id="shapes">
    <SettingsRow label="A long label that is allowed to wrap on to a second line because the row was told it could do that" description="And a description that also wraps when there is more of it than fits beside the control." setting="wraps" multiline><span id="tall" style="display: block; width: 60px; height: 20px"></span></SettingsRow>
    <SettingsRow label="Show scroll bars" setting="stacked" layout="stacked"><textarea id="area" style="display: block; width: 100%; height: 40px; box-sizing: border-box"></textarea></SettingsRow>
    <SettingsRow label="Erase everything" setting="erase" destructive><button type="button" id="erase">Erase...</button></SettingsRow>
    <SettingsRow label="Unavailable" setting="unavailable" disabled />
  </SettingsGroup>
  <SettingsGroup id="nav">
    <SettingsRow label="About" setting="about" to="about" icon="i-f7-info-circle-fill" tone="indigo" />
    <SettingsRow label="Storage" setting="storage" to="storage" value="212 GB" />
    <SettingsRow label="Plain" setting="plain-tile" icon="i-f7-gear-alt-fill" tone="nonsense" />
  </SettingsGroup>
  <SettingsGroup id="controls">
    <SettingsRow label="Name" description="Shown to other people." setting="text"><input type="text" /></SettingsRow>
    <SettingsRow label="Already named" setting="named"><input type="text" aria-label="Its own name" /></SettingsRow>
    <SettingsRow label="Reset" setting="push"><button type="button">Reset all</button></SettingsRow>
    <SettingsRow label="Text size" setting="slider"><Slider v-model:value="size" min="0" max="2" step="1" ticks /></SettingsRow>
    <SettingsRow label="Accent" setting="swatches" multiline><ColorSwatches v-model:value="colour" :options="[{ value: 'red', label: 'Red', color: 'red' }, { value: 'blue', label: 'Blue', color: 'blue' }]" /></SettingsRow>
    <SettingsRow label="Appearance" setting="appearance" multiline><AppearancePicker value="dark" /></SettingsRow>
    <SettingsRow label="Nothing to name" setting="empty" />
  </SettingsGroup>
  <div id="bare" class="stx-settings-card" style="width: 300px">
    <div data-settings-row id="bare-one"></div>
    <div data-settings-row id="bare-two"></div>
  </div>
  <div id="inactive" data-stx-window-active="false"><SettingsGroup><SettingsRow label="In a window that is not key" setting="inactive" /></SettingsGroup></div>
</div>`,
  })
  await page.run(`document.querySelector('[data-setting="hidden-one"]').hidden = true`)
}, 60_000)

afterAll(() => page?.close())

describe('the card', () => {
  it('raises no script errors', async () => {
    expect(await page.errors()).toEqual([])
  })

  it('is a rounded fill with no border, as wide as the column', async () => {
    const drawn = await page.json(on(`
      const s = getComputedStyle(card('windows'))
      return { radius: s.borderRadius, fill: s.backgroundColor, border: s.borderTopWidth, width: box(card('windows')).width, overflow: s.overflow }
    `))

    expect(drawn.radius).toBe('12px')
    expect(drawn.fill).toBe('rgba(0, 0, 0, 0.04)')
    expect(drawn.border).toBe('0px')
    expect(drawn.width).toBe(460)
    // A menu or a focus ring inside a row has to be able to leave the card.
    expect(drawn.overflow).toBe('visible')
  })

  it('writes the header above in 13 bold and the footnote below in 11 secondary, both inset 10', async () => {
    const drawn = await page.json(on(`
      const h = section('windows').querySelector('.stx-settings-section-header'), f = section('windows').querySelector('.stx-settings-section-footer')
      const hs = getComputedStyle(h), fs = getComputedStyle(f)
      return {
        header: { text: h.textContent, size: hs.fontSize, weight: hs.fontWeight, colour: hs.color, inset: hs.paddingLeft, below: box(card('windows')).top - box(h).bottom + Number.parseFloat(hs.paddingBottom) },
        footer: { text: f.textContent, size: fs.fontSize, colour: fs.color, inset: fs.paddingLeft, above: fs.paddingTop, top: box(f).top - box(card('windows')).bottom },
        labelled: card('windows').getAttribute('aria-labelledby') === h.id, role: card('windows').getAttribute('role'),
      }
    `))

    expect(drawn.header).toEqual({ text: 'Windows', size: '13px', weight: '700', colour: 'rgba(0, 0, 0, 0.85)', inset: '10px', below: 8 })
    expect(drawn.footer).toEqual({ text: 'Applies to new windows.', size: '11px', colour: 'rgba(0, 0, 0, 0.5)', inset: '10px', above: '6px', top: 0 })
    expect(drawn.labelled).toBe(true)
    expect(drawn.role).toBe('group')
  })

  it('leaves 10 between two cards and 28 above a header', async () => {
    const drawn = await page.json(on(`
      const hero = document.querySelector('[data-settings-pane-header]')
      const h = section('windows').querySelector('.stx-settings-section-header')
      return {
        afterHero: box(card('first')).top - box(hero).bottom,
        betweenCards: box(card('nav')).top - box(card('shapes')).bottom,
        aboveHeader: box(h).top + Number.parseFloat(getComputedStyle(h).paddingTop) - box(card('first')).bottom,
        none: getComputedStyle(section('first').querySelector('.stx-settings-section-header')).display,
        noFooter: getComputedStyle(section('first').querySelector('.stx-settings-section-footer')).display,
      }
    `))

    expect(drawn.afterHero).toBe(10)
    expect(drawn.betweenCards).toBe(10)
    expect(drawn.aboveHeader).toBe(28)
    expect(drawn.none).toBe('none')
    expect(drawn.noFooter).toBe('none')
  })

  it('takes a footnote with a link from its footer slot', async () => {
    const drawn = await page.json(on(`
      const f = section('linked').querySelector('.stx-settings-section-footer'), a = $('link')
      return { text: f.textContent.trim(), size: getComputedStyle(f).fontSize, inFooter: f.contains(a), href: a.getAttribute('href'), cursor: getComputedStyle(a).cursor, rows: rows('linked').length, afterCard: box(f).top >= box(card('linked')).bottom }
    `))

    expect(drawn).toEqual({ text: 'Read the privacy notes.', size: '11px', inFooter: true, href: '#privacy', cursor: 'default', rows: 1, afterCard: true })
  })

  it('follows a header that changes', async () => {
    const result = await page.json(on(`
      probe.heading.set('Fenster')
      return later(() => { const text = section('windows').querySelector('.stx-settings-section-header').textContent; probe.heading.set('Windows'); return text })
    `))

    expect(result).toBe('Fenster')
  })
})

describe('the rules between rows', () => {
  it('wraps every row in a component wrapper that lays nothing out', async () => {
    const wrapped = await page.json(on(`return rows('windows').map(r => [r.parentElement.hasAttribute('data-stx-scope'), getComputedStyle(r.parentElement).display, r.parentElement.parentElement === card('windows')])`))

    expect(wrapped).toEqual([[true, 'contents', true], [true, 'contents', true], [true, 'contents', true], [true, 'contents', true]])
  })

  it('draws a hairline above every row but the first, inset 10 on both sides', async () => {
    const drawn = await page.json(on(`return { windows: rows('windows').map(rule), single: rows('first').map(rule), controls: rows('controls').map(r => rule(r) !== null), position: getComputedStyle(rows('windows')[1]).position }`))

    expect(drawn.single).toEqual([null])
    expect(drawn.windows[0]).toBeNull()
    expect(drawn.windows[1].top).toBe('0px')
    expect(drawn.windows[1].left).toBe('10px')
    expect(drawn.windows[1].right).toBe('10px')
    expect(['0.5px', '1px']).toContain(drawn.windows[1].height)
    expect(drawn.windows[1].colour).toBe('rgba(0, 0, 0, 0.1)')
    expect(drawn.windows[3]).toEqual(drawn.windows[1])
    expect(drawn.controls).toEqual([false, true, true, true, true, true, true])
    expect(drawn.position).toBe('relative')
  })

  it('draws none under the last row, or anywhere on the card itself', async () => {
    const drawn = await page.json(on(`
      const last = rows('windows')[3], after = getComputedStyle(last, '::after'), c = getComputedStyle(card('windows'))
      return { afterFill: after.backgroundColor, cardBefore: getComputedStyle(card('windows'), '::before').content, cardAfter: getComputedStyle(card('windows'), '::after').content, borderBottom: getComputedStyle(last).borderBottomWidth, cardBorder: c.borderBottomWidth, flush: box(card('windows')).bottom - box(last).bottom }
    `))

    expect(drawn).toEqual({ afterFill: 'rgba(0, 0, 0, 0)', cardBefore: 'none', cardAfter: 'none', borderBottom: '0px', cardBorder: '0px', flush: 0 })
  })

  it('does not count a hidden row as the one before', async () => {
    const drawn = await page.json(on(`
      const list = rows('windows')
      list[0].hidden = true; list[1].hidden = true
      const out = { afterHidden: rule(list[3]) }
      list[0].hidden = false; list[1].hidden = false
      out.restored = rule(list[3]) !== null
      return out
    `))

    // The first three are hidden, so the fourth is the first that shows.
    expect(drawn.afterHidden).toBeNull()
    expect(drawn.restored).toBe(true)
  })

  it('draws the same rule for rows that are plain siblings, with no wrapper', async () => {
    const drawn = await page.json(on(`return [rule($('bare-one')), rule($('bare-two'))]`))

    expect(drawn[0]).toBeNull()
    expect(drawn[1].left).toBe('10px')
    expect(drawn[1].right).toBe('10px')
  })
})

describe('a row', () => {
  it('is 38 tall with 10 either side, the label in 13 regular', async () => {
    const drawn = await page.json(on(`
      const r = row('one'), s = getComputedStyle(r), l = r.querySelector('.stx-settings-row-label'), ls = getComputedStyle(l)
      return { height: box(r).height, left: s.paddingLeft, right: s.paddingRight, label: { size: ls.fontSize, weight: ls.fontWeight, colour: ls.color, inset: box(l).left - box(r).left }, cursor: s.cursor, centred: Math.abs((box(l).top + box(l).bottom) / 2 - (box(r).top + box(r).bottom) / 2) }
    `))

    expect(drawn.height).toBe(38)
    expect(drawn.left).toBe('10px')
    expect(drawn.right).toBe('10px')
    expect(drawn.label).toEqual({ size: '13px', weight: '400', colour: 'rgba(0, 0, 0, 0.85)', inset: 10 })
    expect(drawn.cursor).toBe('default')
    expect(drawn.centred).toBeLessThan(0.6)
  })

  it('puts the control at the trailing edge, level with the label', async () => {
    const drawn = await page.json(on(`
      const r = row('icon-size'), c = $('popup'), l = r.querySelector('.stx-settings-row-label')
      return { fromEdge: box(r).right - box(c).right, level: Math.abs((box(c).top + box(c).bottom) / 2 - (box(l).top + box(l).bottom) / 2), height: box(r).height }
    `))

    expect(drawn.fromEdge).toBe(10)
    expect(drawn.level).toBeLessThan(1)
    expect(drawn.height).toBe(38)
  })

  it('writes a description under the label in 11 secondary, and grows', async () => {
    const drawn = await page.json(on(`
      const r = row('tint'), l = r.querySelector('.stx-settings-row-label'), d = r.querySelector('.stx-settings-row-description'), s = getComputedStyle(d)
      return { text: d.textContent, size: s.fontSize, colour: s.color, under: box(d).top >= box(l).bottom, height: box(r).height, none: getComputedStyle(row('one').querySelector('.stx-settings-row-description')).display }
    `))

    expect(drawn.text).toBe('Uses the wallpaper colour.')
    expect(drawn.size).toBe('11px')
    expect(drawn.colour).toBe('rgba(0, 0, 0, 0.5)')
    expect(drawn.under).toBe(true)
    expect(drawn.height).toBeGreaterThan(38)
    expect(drawn.none).toBe('none')
  })

  it('carries what the window searches by', async () => {
    const found = await page.json(on(`
      const read = r => ({ setting: r.getAttribute('data-setting'), label: r.getAttribute('data-label'), keywords: r.getAttribute('data-keywords'), row: r.hasAttribute('data-settings-row') })
      return { one: read(row('one')), size: read(row('icon-size')), unset: document.querySelector('#bare-one').hasAttribute('data-setting') }
    `))

    expect(found.one).toEqual({ setting: 'one', label: 'One', keywords: 'first single', row: true })
    expect(found.size).toEqual({ setting: 'icon-size', label: 'Sidebar icon size', keywords: 'sidebar icons', row: true })
  })

  it('follows a label that changes, in the words and in what is searched', async () => {
    const result = await page.json(on(`
      probe.title.set('Symbolgrösse')
      return later(() => { const r = row('icon-size'), out = { text: r.querySelector('.stx-settings-row-label').textContent, label: r.getAttribute('data-label') }; probe.title.set('Sidebar icon size'); return out })
    `))

    expect(result).toEqual({ text: 'Symbolgrösse', label: 'Symbolgrösse' })
  })

  it('wraps and puts the control at the top when multiline', async () => {
    const drawn = await page.json(on(`
      const r = row('wraps'), l = r.querySelector('.stx-settings-row-label'), c = $('tall')
      return { labelLines: Math.round(box(l).height / 16), wrap: getComputedStyle(l).whiteSpace, labelTop: box(l).top - box(r).top, controlTop: box(c).top - box(r).top, tall: box(r).height > 60, oneLine: getComputedStyle(row('one').querySelector('.stx-settings-row-label')).whiteSpace }
    `))

    expect(drawn.labelLines).toBeGreaterThan(1)
    expect(drawn.wrap).toBe('normal')
    expect(drawn.labelTop).toBe(10)
    expect(drawn.controlTop).toBe(10)
    expect(drawn.tall).toBe(true)
    expect(drawn.oneLine).toBe('nowrap')
  })

  it('puts the control under the label at full width when stacked', async () => {
    const drawn = await page.json(on(`
      const r = row('stacked'), l = r.querySelector('.stx-settings-row-label'), a = $('area')
      return { layout: r.getAttribute('data-layout'), under: box(a).top >= box(l).bottom, width: box(a).width, left: box(a).left - box(r).left, other: row('one').getAttribute('data-layout') }
    `))

    expect(drawn).toEqual({ layout: 'stacked', under: true, width: 440, left: 10, other: 'inline' })
  })

  it('paints a destructive label in the danger colour, and dims a disabled row', async () => {
    const drawn = await page.json(on(`
      const probeEl = document.createElement('i'); probeEl.style.color = 'var(--stx-mac-danger)'; document.body.append(probeEl)
      const danger = getComputedStyle(probeEl).color; probeEl.remove()
      return { danger, label: getComputedStyle(row('erase').querySelector('.stx-settings-row-label')).color, disabled: row('unavailable').getAttribute('aria-disabled'), dimmed: getComputedStyle(row('unavailable').querySelector('.stx-settings-row-text')).opacity, events: getComputedStyle(row('unavailable')).pointerEvents }
    `))

    expect(drawn.danger).toBe('rgb(255, 59, 48)')
    expect(drawn.label).toBe(drawn.danger)
    expect(drawn.disabled).toBe('true')
    expect(Number(drawn.dimmed)).toBeLessThan(1)
    expect(drawn.events).toBe('none')
  })

  it('draws an icon on a 24 point tile of its tone, grey for a tone it does not know', async () => {
    const drawn = await page.json(on(`
      const tile = r => { const t = r.querySelector('.stx-settings-row-tile'), s = getComputedStyle(t); return { size: [box(t).width, box(t).height], radius: s.borderRadius, fill: s.backgroundColor, tone: t.getAttribute('data-tone'), glyph: t.querySelector('i').className, hidden: t.getAttribute('aria-hidden'), ink: s.color } }
      return { about: tile(row('about')), plain: tile(row('plain-tile')), none: row('one').querySelector('.stx-settings-row-tile') }
    `))

    expect(drawn.about).toEqual({ size: [24, 24], radius: '6px', fill: 'rgb(88, 86, 214)', tone: 'indigo', glyph: 'i-f7-info-circle-fill', hidden: 'true', ink: 'rgb(255, 255, 255)' })
    expect(drawn.plain.tone).toBe('grey')
    expect(drawn.plain.fill).toBe('rgb(142, 142, 147)')
    expect(drawn.none).toBeNull()
  })
})

describe('a navigation row', () => {
  it('says where it goes and is something to press', async () => {
    const info = await page.json(on(`
      const read = r => ({ navigate: r.getAttribute('data-navigate'), role: r.getAttribute('role'), tab: r.tabIndex, chevron: Boolean(r.querySelector('.stx-settings-row-chevron')) })
      return { about: read(row('about')), storage: read(row('storage')), plain: read(row('one')) }
    `))

    expect(info.about).toEqual({ navigate: 'about', role: 'button', tab: 0, chevron: true })
    expect(info.storage).toEqual({ navigate: 'storage', role: 'button', tab: 0, chevron: true })
    expect(info.plain).toEqual({ navigate: null, role: null, tab: -1, chevron: false })
  })

  it('is 44 tall with a tile, and writes its value before the chevron in secondary ink', async () => {
    const drawn = await page.json(on(`
      const r = row('storage'), v = r.querySelector('.stx-settings-row-value'), c = r.querySelector('.stx-settings-row-chevron')
      return { withTile: box(row('about')).height, without: box(r).height, value: v.textContent, colour: getComputedStyle(v).color, before: box(v).right <= box(c).left, chevron: [box(c).width, box(c).height], fromEdge: box(r).right - box(c).right, stroke: getComputedStyle(c, '::before').borderTopColor, noValue: getComputedStyle(row('about').querySelector('.stx-settings-row-value')).display }
    `))

    expect(drawn.withTile).toBe(44)
    expect(drawn.without).toBe(38)
    expect(drawn.value).toBe('212 GB')
    expect(drawn.colour).toBe('rgba(0, 0, 0, 0.5)')
    expect(drawn.before).toBe(true)
    expect(drawn.chevron).toEqual([7, 11])
    expect(drawn.fromEdge).toBe(10)
    expect(drawn.stroke).toBe('rgba(0, 0, 0, 0.26)')
    expect(drawn.noValue).toBe('none')
  })

  it('leaves opening the pane to the window', async () => {
    const result = await page.json(on(`
      const before = location.hash
      row('about').click()
      const allowed = press(row('about'), 'Enter')
      return { same: location.hash === before, allowed }
    `))

    // The row draws; it neither navigates nor swallows the key the window listens for.
    expect(result).toEqual({ same: true, allowed: true })
  })
})

describe('the highlight', () => {
  it('washes a found row with the accent and fades over 1.6 seconds', async () => {
    const drawn = await page.json(on(`
      const r = row('one'), before = getComputedStyle(r, '::after').animationName
      r.setAttribute('data-highlight', '')
      const s = getComputedStyle(r, '::after')
      const out = { before, name: s.animationName, duration: s.animationDuration, inset: s.top, radius: s.borderTopLeftRadius, events: s.pointerEvents, fill: s.backgroundColor, wash: getComputedStyle(r).getPropertyValue('--stx-settings-row-wash').trim() }
      r.removeAttribute('data-highlight')
      out.after = getComputedStyle(r, '::after').animationName
      return out
    `))

    expect(drawn.before).toBe('none')
    expect(drawn.name).toBe('stx-settings-row-highlight')
    expect(drawn.duration).toBe('1.6s')
    expect(drawn.inset).toBe('3px')
    expect(drawn.radius).toBe('9px')
    expect(drawn.events).toBe('none')
    // The first frame is the wash itself, not yet faded.
    expect(drawn.fill).not.toBe('rgba(0, 0, 0, 0)')
    expect(drawn.wash).toContain('color-mix(')
    expect(drawn.after).toBe('none')
  })

  it('has no accent to wash with in a window that is not key', async () => {
    const wash = await page.json(on(`return getComputedStyle(row('inactive')).getPropertyValue('--stx-settings-row-wash').trim()`))

    expect(wash).toBe('rgba(0, 0, 0, 0.08)')
  })

  it('does not animate for someone who asked for less motion', async () => {
    const css = await page.json(on(`
      const rules = []
      for (const sheet of document.styleSheets) for (const rule of sheet.cssRules) if (rule.media && rule.conditionText.includes('prefers-reduced-motion')) for (const inner of rule.cssRules) if (inner.selectorText && inner.selectorText.includes('data-highlight')) rules.push(inner.style.animationName)
      return rules
    `))

    expect(css.length).toBeGreaterThan(0)
    expect(new Set(css)).toEqual(new Set(['none']))
  })
})

describe('naming the control', () => {
  it('gives a row label an id, and says which on the row', async () => {
    const info = await page.json(on(`
      const r = row('text'), l = r.querySelector('.stx-settings-row-label'), api = r.closest('[data-stx-scope]').__stx_exposed
      const ids = Array.from(document.querySelectorAll('[data-settings-row] .stx-settings-row-label')).map(el => el.id)
      return { id: l.id, onRow: r.getAttribute('data-label-id'), exposed: api.labelId, description: api.descriptionId, unique: new Set(ids).size === ids.length, all: ids.every(Boolean) }
    `))

    expect(info.id).toBe('settings-row-text-label')
    expect(info.onRow).toBe(info.id)
    expect(info.exposed).toBe(info.id)
    expect(info.description).toBe('settings-row-text-description')
    expect(info.unique).toBe(true)
    expect(info.all).toBe(true)
  })

  it('names a control that has no name after the row, and describes it', async () => {
    const names = await page.json(on(`
      const input = row('text').querySelector('input'), toggle = row('tint').querySelector('[role="switch"]'), area = $('area')
      return { input: [nameOf(input), describedBy(input)], toggle: [nameOf(toggle), describedBy(toggle)], area: [nameOf(area), describedBy(area)] }
    `))

    expect(names.input).toEqual(['Name', 'Shown to other people.'])
    expect(names.toggle).toEqual(['Tint window background', 'Uses the wallpaper colour.'])
    expect(names.area).toEqual(['Show scroll bars', null])
  })

  it('leaves a control that names itself alone', async () => {
    const names = await page.json(on(`
      const named = row('named').querySelector('input'), push = row('push').querySelector('button'), erase = $('erase')
      return { named: [nameOf(named), named.hasAttribute('aria-labelledby')], push: [push.textContent, push.hasAttribute('aria-labelledby')], erase: erase.hasAttribute('aria-labelledby') }
    `))

    expect(names.named).toEqual(['Its own name', false])
    expect(names.push).toEqual(['Reset all', false])
    expect(names.erase).toBe(false)
  })

  it('names a slider, and a group of choices rather than one choice in it', async () => {
    const names = await page.json(on(`
      const range = row('slider').querySelector('input[type="range"]'), swatches = row('swatches').querySelector('[role="radiogroup"]'), picker = row('appearance').querySelector('[role="radiogroup"]')
      return { slider: nameOf(range), swatches: nameOf(swatches), firstDot: row('swatches').querySelector('[role="radio"]').getAttribute('aria-label'), picker: nameOf(picker), firstPicture: row('appearance').querySelector('[role="radio"]').hasAttribute('aria-labelledby') }
    `))

    expect(names).toEqual({ slider: 'Text size', swatches: 'Accent', firstDot: 'Red', picker: 'Appearance', firstPicture: false })
  })

  it('gives a slider in a row a width of its own, at the trailing edge', async () => {
    const drawn = await page.json(on(`
      const r = row('slider'), s = r.querySelector('[data-stx-slider]')
      return { width: box(s).width, fromEdge: box(r).right - box(s).right, height: box(r).height }
    `))

    expect(drawn).toEqual({ width: 220, fromEdge: 10, height: 38 })
  })

  it('keeps the controls working inside a row', async () => {
    const result = await page.json(on(`
      press(row('slider').querySelector('input[type="range"]'), 'ArrowRight')
      row('swatches').querySelector('[data-value="blue"]').click()
      return later(() => ({ size: probe.size(), colour: probe.colour() }))
    `))

    expect(result).toEqual({ size: 2, colour: 'blue' })
  })
})

describe('the pane header', () => {
  it('centres a 48 point tile over a 20 bold title and a 12 secondary description, 22 in from the card', async () => {
    const drawn = await page.json(on(`
      const h = document.querySelector('[data-settings-pane-header]'), s = getComputedStyle(h)
      const tile = h.querySelector('.stx-settings-hero-tile'), title = h.querySelector('.stx-settings-hero-title'), text = h.querySelector('.stx-settings-hero-description')
      const ts = getComputedStyle(title), ds = getComputedStyle(text), mid = el => (box(el).left + box(el).right) / 2
      return {
        card: { radius: s.borderRadius, fill: s.backgroundColor, padding: s.paddingTop, width: box(h).width },
        tile: { size: [box(tile).width, box(tile).height], top: box(tile).top - box(h).top, fill: getComputedStyle(tile).backgroundColor, centred: Math.abs(mid(tile) - mid(h)) < 0.6, hidden: tile.getAttribute('aria-hidden') },
        title: { text: title.textContent, tag: title.tagName, size: ts.fontSize, weight: ts.fontWeight, centred: Math.abs(mid(title) - mid(h)) < 0.6, under: box(title).top >= box(tile).bottom },
        description: { text: text.textContent, size: ds.fontSize, colour: ds.color, align: ds.textAlign, under: box(text).top >= box(title).bottom, bottom: box(h).bottom - box(text).bottom },
      }
    `))

    expect(drawn.card).toEqual({ radius: '12px', fill: 'rgba(0, 0, 0, 0.04)', padding: '22px', width: 460 })
    expect(drawn.tile).toEqual({ size: [48, 48], top: 22, fill: 'rgb(0, 122, 255)', centred: true, hidden: 'true' })
    expect(drawn.title).toEqual({ text: 'General', tag: 'H2', size: '20px', weight: '700', centred: true, under: true })
    expect(drawn.description).toEqual({ text: 'Manage your overall setup and preferences.', size: '12px', colour: 'rgba(0, 0, 0, 0.5)', align: 'center', under: true, bottom: 22 })
  })
})

describe('in the dark', () => {
  it('draws the card, the words, the rule and the tiles with the dark values', async () => {
    const drawn = await page.json(on(`
      document.documentElement.classList.add('dark')
      const out = {
        card: getComputedStyle(card('windows')).backgroundColor,
        hero: getComputedStyle(document.querySelector('[data-settings-pane-header]')).backgroundColor,
        header: getComputedStyle(section('windows').querySelector('.stx-settings-section-header')).color,
        footer: getComputedStyle(section('windows').querySelector('.stx-settings-section-footer')).color,
        label: getComputedStyle(row('one').querySelector('.stx-settings-row-label')).color,
        description: getComputedStyle(row('tint').querySelector('.stx-settings-row-description')).color,
        rule: rule(rows('windows')[1]).colour,
        danger: getComputedStyle(row('erase').querySelector('.stx-settings-row-label')).color,
        tile: getComputedStyle(row('about').querySelector('.stx-settings-row-tile')).backgroundColor,
        chevron: getComputedStyle(row('about').querySelector('.stx-settings-row-chevron'), '::before').borderTopColor,
      }
      document.documentElement.classList.remove('dark')
      return out
    `))

    expect(drawn).toEqual({
      card: 'rgba(255, 255, 255, 0.05)',
      hero: 'rgba(255, 255, 255, 0.05)',
      header: 'rgba(255, 255, 255, 0.85)',
      footer: 'rgba(255, 255, 255, 0.55)',
      label: 'rgba(255, 255, 255, 0.85)',
      description: 'rgba(255, 255, 255, 0.55)',
      rule: 'rgba(255, 255, 255, 0.1)',
      danger: 'rgb(255, 69, 58)',
      tile: 'rgb(94, 92, 230)',
      chevron: 'rgba(255, 255, 255, 0.25)',
    })
  })
})
