/**
 * <SettingsWindow> in a real browser: which pane is showing after a click, a
 * key, a search or a reload with a stored pane, what assistive technology is
 * told, and whether the window measures what System Settings does.
 *
 * The rows are plain markup following the DOM contract, since the shell finds
 * them by attribute and must not care which component drew them.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { EVENTS, openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

const HELPERS = `
  ${EVENTS}
  const root = id => document.getElementById(id)
  const api = id => root(id).closest('[data-stx-scope]').__stx_exposed
  const q = (id, selector) => root(id).querySelector(selector)
  const all = (id, selector) => Array.from(root(id).querySelectorAll(selector))
  const items = id => all(id, '[data-settings-item]')
  const item = (id, pane) => q(id, '[data-settings-item="' + pane + '"]')
  const paneEl = (id, pane) => q(id, '[data-settings-pane="' + pane + '"]')
  const shown = id => all(id, '[data-settings-pane]').filter(p => !p.hidden).map(p => p.getAttribute('data-settings-pane'))
  const selected = id => items(id).filter(i => i.getAttribute('aria-selected') === 'true').map(i => i.getAttribute('data-settings-item'))
  const visible = id => items(id).filter(i => !i.hidden).map(i => i.getAttribute('data-settings-item'))
  const title = id => q(id, '[data-settings-title]').textContent
  const input = id => q(id, '[data-settings-search-input]')
  const type = (id, text) => { const field = input(id); field.value = text; field.dispatchEvent(new Event('input', { bubbles: true })) }
  const results = id => all(id, '[data-settings-result]').map(r => [r.querySelector('.stx-settings-result-label').textContent, r.querySelector('.stx-settings-result-pane').textContent])
  const box = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } }
  const css = (el, name) => getComputedStyle(el)[name]
  const accent = scope => { const probe = document.createElement('i'); probe.style.background = 'var(--stx-mac-accent)'; scope.append(probe); const value = getComputedStyle(probe).backgroundColor; probe.remove(); return value }
  const later = (ms, read) => new Promise(done => setTimeout(() => done(read()), ms))
  const reset = id => { if (input(id)) type(id, ''); api(id).showPane('general'); q(id, '[data-settings-body]').scrollTop = 0 }
`
const on = (body: string): string => `${HELPERS}\n${body}`

const row = (label: string, extra = ''): string => `<div data-settings-row data-label="${label}" ${extra} class="row"><span>${label}</span></div>`
const filler = Array.from({ length: 24 }, (_, index) => row(`Option ${index + 1}`)).join('')

const sidebar = `
  <template #sidebar>
    <SettingsSidebarGroup>
      <SettingsSidebarItem id="wifi" label="Wi-Fi" icon="i-f7-wifi" tone="blue" />
      <SettingsSidebarItem id="network" label="Network" icon="i-f7-globe" tone="blue" keywords="ethernet vpn" />
    </SettingsSidebarGroup>
    <SettingsSidebarGroup>
      <SettingsSidebarItem id="general" label="General" icon="i-f7-gear-alt-fill" tone="grey" badge="2" />
      <SettingsSidebarItem id="appearance" label="Appearance" icon="i-f7-circle-lefthalf-fill" tone="ink" />
      <SettingsSidebarItem id="sound" label="Sound" icon="i-f7-speaker-2-fill" tone="pink" />
    </SettingsSidebarGroup>
  </template>`

const panes = `
  <SettingsPane id="general" title="General" keywords="preferences" active>
    <div class="card">
      ${row('About', 'data-navigate="about" data-setting="about-row" role="button" tabindex="0"')}
      <div data-settings-row data-label="Storage" data-navigate="about" role="button" tabindex="0" class="row"><span>Storage</span><button type="button" data-inner>Manage</button></div>
      ${row('Language', 'data-setting="language" data-keywords="locale region"')}
    </div>
    <div class="card">${filler}</div>
    <div class="card">${row('Startup disk', 'data-setting="startup-disk"')}</div>
  </SettingsPane>
  <SettingsPane id="about" title="About" parent="general">
    <div class="card">${row('Name', 'data-setting="computer-name"')}${row('Serial number', 'data-setting="serial" data-keywords="identifier"')}</div>
  </SettingsPane>
  <SettingsPane id="appearance" title="Appearance" keywords="dark light theme">
    <div class="card">${row('Accent colour', 'data-setting="accent"')}${row('Sidebar icon size', 'data-setting="sidebar-size"')}</div>
  </SettingsPane>
  <SettingsPane id="sound" title="Sound">
    <div class="card">${row('Alert volume', 'data-setting="alert-volume"')}${row('Play sound on startup', 'data-setting="startup-sound"')}</div>
  </SettingsPane>
  <SettingsPane id="wifi" title="Wi-Fi">
    <div class="card">${row('Known networks', 'data-setting="known-networks"')}</div>
  </SettingsPane>
  <SettingsPane id="network" title="Network">
    <div class="card">${row('Firewall', 'data-setting="firewall"')}</div>
  </SettingsPane>`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'settings-window-browser',
    width: 1000,
    height: 800,
    ready: `document.querySelectorAll('[data-settings-ready]').length === 4`,
    body: `
<style>
  .card { margin-bottom: 10px; border-radius: 12px; background: var(--stx-mac-card); }
  .row { display: flex; align-items: center; justify-content: space-between; min-height: 38px; padding: 0 10px; }
</style>
<script client>
localStorage.setItem('stx:settings:kept', 'sound')
localStorage.setItem('stx:settings:stale', 'removed-last-year')
const events = { pane: [], search: [], navigate: [] }
const open = state('general')
window.probe = { events, open }
</script>
<SettingsWindow id="win" v-model:pane="open" @pane="events.pane.push($event)" @search="events.search.push($event)" @navigate="events.navigate.push($event)">
  <template #account><div style="height: 40px">Account</div></template>
  ${sidebar}
  ${panes}
</SettingsWindow>
<div style="padding: 20px">
  <SettingsWindow id="sheet" presentation="sheet" storageKey="kept" title="Preferences" searchPlaceholder="Find">${sidebar}${panes}</SettingsWindow>
</div>
<div style="padding: 20px">
  <SettingsWindow id="stale" presentation="sheet" storageKey="stale" pane="appearance" height="300px" sidebarWidth="180">${sidebar}${panes}</SettingsWindow>
</div>
<div class="dark" style="padding: 20px">
  <SettingsWindow id="dark" presentation="sheet" :searchable="false" pane="appearance" height="300px">${sidebar}${panes}</SettingsWindow>
</div>`,
  })
}, 60_000)

afterAll(() => page?.close())

describe('what is drawn', () => {
  it('raises no script errors', async () => {
    expect(await page.errors()).toEqual([])
  })

  it('shows one pane, the one it was given, and selects its sidebar item', async () => {
    const drawn = await page.json(on(`return { shown: shown('win'), selected: selected('win'), title: title('win'), pane: api('win').getPane(), attribute: root('win').getAttribute('data-pane') }`))

    expect(drawn).toEqual({ shown: ['general'], selected: ['general'], title: 'General', pane: 'general', attribute: 'general' })
  })

  it('opens on a stored pane, ahead of the first one', async () => {
    expect(await page.json(on(`return { shown: shown('sheet'), selected: selected('sheet'), title: title('sheet') }`))).toEqual({ shown: ['sound'], selected: ['sound'], title: 'Sound' })
  })

  it('measures what System Settings measures', async () => {
    const m = await page.json(on(`
      const win = root('win'), general = item('win', 'general'), list = items('win')
      const sidebar = q('win', '.stx-settings-sidebar'), search = q('win', '.stx-settings-search'), history = q('win', '.stx-settings-history')
      const tile = general.querySelector('.stx-settings-tile'), content = q('win', '.stx-settings-content'), body = q('win', '[data-settings-body]')
      return {
        window: box(win), sidebar: box(sidebar), search: box(search), searchRadius: css(search, 'borderTopLeftRadius'), searchFont: css(input('win'), 'fontSize'),
        item: box(general), itemRadius: css(general, 'borderTopLeftRadius'), itemFont: css(general, 'fontSize'), itemPadding: css(general, 'paddingLeft'), itemGap: css(general, 'columnGap'),
        pitch: box(list[1]).y - box(list[0]).y, groupGap: box(list[2]).y - (box(list[1]).y + box(list[1]).h),
        tile: box(tile), tileRadius: css(tile, 'borderTopLeftRadius'), glyph: box(tile.firstElementChild),
        toolbar: box(q('win', '.stx-settings-toolbar')), history: box(history), historyRadius: css(history, 'borderTopLeftRadius'),
        title: box(q('win', '[data-settings-title]')), titleFont: css(q('win', '[data-settings-title]'), 'fontSize'), titleWeight: css(q('win', '[data-settings-title]'), 'fontWeight'),
        content: box(content), page: document.documentElement.clientWidth, bodyInner: body.clientWidth, bodyLeft: box(body).x, cursor: css(general, 'cursor'), select: css(general, 'webkitUserSelect'),
      }
    `))

    // The whole viewport, less the page's own scrollbar where the engine draws one.
    // As tall as the viewport, whatever that is: a headless Chrome takes its
    // own window furniture out of the height it was asked for.
    expect(m.window).toEqual({ x: 0, y: 0, w: m.page, h: m.window.h })
    expect(m.window.h).toBeGreaterThan(600)
    expect(m.sidebar).toEqual({ x: 0, y: 0, w: 226, h: m.window.h })
    // The search capsule: 28 high, fully rounded, 9 in from each edge, below the traffic lights' band.
    expect(m.search).toEqual({ x: 9, y: 59, w: 208, h: 28 })
    expect(m.searchRadius).toBe('14px')
    expect(m.searchFont).toBe('13px')
    // A sidebar row: 30 high on a 32 pitch, radius 8, 9 in, 13 between groups.
    expect(m.item.h).toBe(30)
    expect(m.item.x).toBe(9)
    expect(m.item.w).toBe(208)
    expect(m.itemRadius).toBe('8px')
    expect(m.itemFont).toBe('13px')
    expect(m.itemPadding).toBe('8px')
    expect(m.itemGap).toBe('8px')
    expect(m.pitch).toBe(32)
    expect(m.groupGap).toBe(13)
    expect(m.tile.w).toBe(20)
    expect(m.tile.h).toBe(20)
    expect(m.tileRadius).toBe('5.5px')
    expect(m.glyph.w).toBe(13)
    expect(m.glyph.h).toBe(13)
    // The toolbar: 52 high, the back and forward capsule 74 by 36, the title 12 after it.
    expect(m.toolbar).toEqual({ x: 226, y: 0, w: m.page - 226, h: 52 })
    expect(m.history).toEqual({ x: 234, y: 8, w: 74, h: 36 })
    expect(m.historyRadius).toBe('18px')
    expect(m.title.x).toBe(320)
    expect(m.titleFont).toBe('15px')
    expect(m.titleWeight).toBe('600')
    // The content column: 500 at most, centred in what the scroller leaves.
    expect(m.content.w).toBe(500)
    expect(Math.abs((m.content.x - m.bodyLeft) - (m.bodyInner - 500) / 2)).toBeLessThanOrEqual(1)
    expect(m.cursor).toBe('default')
    expect(m.select).toBe('none')
  })

  it('fills the selected item with the accent and writes on it in white', async () => {
    const colours = await page.json(on(`
      const general = item('win', 'general'), other = item('win', 'sound')
      return { accent: accent(root('win')), fill: css(general, 'backgroundColor'), ink: css(general, 'color'), weight: css(general, 'fontWeight'), otherFill: css(other, 'backgroundColor'), otherInk: css(other, 'color'), sidebar: css(q('win', '.stx-settings-sidebar'), 'backgroundColor'), detail: css(q('win', '.stx-settings-detail'), 'backgroundColor') }
    `))

    // The accent is the library's, which a page sets with --stx-accent; #007aff when it sets none.
    expect(colours.accent).not.toBe('rgba(0, 0, 0, 0)')
    expect(colours.fill).toBe(colours.accent)
    expect(colours.ink).toBe('rgb(255, 255, 255)')
    // The same weight as its neighbours: the fill says which row is chosen.
    expect(colours.weight).toBe('400')
    expect(colours.otherFill).toBe('rgba(0, 0, 0, 0)')
    expect(colours.otherInk).toBe('rgba(0, 0, 0, 0.85)')
    expect(colours.sidebar).toBe('rgb(242, 241, 240)')
    expect(colours.detail).toBe('rgb(255, 255, 255)')
  })

  it('colours each tile by its tone', async () => {
    const tiles = await page.json(on(`
      const tile = (id, pane) => item(id, pane).querySelector('.stx-settings-tile')
      return { blue: css(tile('win', 'wifi'), 'backgroundImage'), ink: css(tile('win', 'appearance'), 'backgroundImage'), glyph: css(tile('win', 'appearance'), 'color'), darkInk: css(tile('dark', 'appearance'), 'backgroundImage'), darkGlyph: css(tile('dark', 'appearance'), 'color'), badge: item('win', 'general').querySelector('.stx-settings-item-badge').textContent }
    `))

    expect(tiles.blue).toContain('rgb(0, 122, 255)')
    expect(tiles.ink).toContain('rgb(29, 29, 31)')
    expect(tiles.glyph).toBe('rgb(255, 255, 255)')
    // Ink inverts in the dark: a light tile with a dark glyph.
    expect(tiles.darkInk).toContain('rgb(220, 220, 224)')
    expect(tiles.darkGlyph).toBe('rgb(29, 29, 31)')
    expect(tiles.badge).toBe('2')
  })

  it('takes its dark values from the dark class', async () => {
    const dark = await page.json(on(`
      return { sidebar: css(q('dark', '.stx-settings-sidebar'), 'backgroundColor'), detail: css(q('dark', '.stx-settings-detail'), 'backgroundColor'), ink: css(item('dark', 'sound'), 'color'), selected: css(item('dark', 'appearance'), 'backgroundColor') === accent(root('dark')), differs: accent(root('dark')) !== accent(root('win')) }
    `))

    expect(dark).toEqual({ sidebar: 'rgb(42, 42, 42)', detail: 'rgb(30, 30, 30)', ink: 'rgba(255, 255, 255, 0.85)', selected: true, differs: true })
  })

  it('makes the bands above the search and the toolbar window drag regions, but not what can be pressed in them', async () => {
    const drag = await page.json(on(`
      return { top: q('win', '.stx-settings-sidebar-top').hasAttribute('data-window-drag'), toolbar: q('win', '.stx-settings-toolbar').hasAttribute('data-window-drag'), sheetTop: box(q('sheet', '.stx-settings-search')).y - box(root('sheet')).y }
    `))

    expect(drag.top).toBe(true)
    expect(drag.toolbar).toBe(true)
    // A sheet has no traffic lights to clear.
    expect(drag.sheetTop).toBe(12)
  })
})

describe('what assistive technology is told', () => {
  it('describes the sidebar as a vertical tab list with one tab stop', async () => {
    const info = await page.json(on(`
      reset('win')
      const list = q('win', '[data-settings-list]')
      return {
        root: [root('win').getAttribute('role'), root('win').getAttribute('aria-label')],
        list: [list.getAttribute('role'), list.getAttribute('aria-orientation'), list.getAttribute('aria-label')],
        tabs: items('win').map(i => [i.getAttribute('role'), i.getAttribute('aria-selected'), i.getAttribute('tabindex'), i.tagName]),
        wrappers: all('win', '[data-settings-group]').map(g => g.getAttribute('role')),
        between: items('win').every(i => { for (let p = i.parentElement; p !== list; p = p.parentElement) { if (p.getAttribute('role') !== 'presentation') return false } return true }),
        sheet: [root('sheet').getAttribute('aria-label'), input('sheet').getAttribute('placeholder'), input('sheet').getAttribute('aria-label')],
      }
    `))

    expect(info.root).toEqual(['group', 'Settings'])
    expect(info.list).toEqual(['tablist', 'vertical', 'Settings'])
    expect(info.tabs).toEqual([
      ['tab', 'false', '-1', 'BUTTON'],
      ['tab', 'false', '-1', 'BUTTON'],
      ['tab', 'true', '0', 'BUTTON'],
      ['tab', 'false', '-1', 'BUTTON'],
      ['tab', 'false', '-1', 'BUTTON'],
    ])
    expect(info.wrappers).toEqual(['presentation', 'presentation'])
    expect(info.between).toBe(true)
    expect(info.sheet).toEqual(['Preferences', 'Find', 'Find'])
  })

  it('links each tab to its panel and names the panel after the tab', async () => {
    const info = await page.json(on(`
      const general = item('win', 'general'), pane = paneEl('win', 'general'), about = paneEl('win', 'about')
      return {
        controls: general.getAttribute('aria-controls') === pane.id, labelled: pane.getAttribute('aria-labelledby') === general.id, role: pane.getAttribute('role'),
        unique: new Set(Array.from(document.querySelectorAll('[id]')).map(e => e.id)).size === document.querySelectorAll('[id]').length,
        about: [about.getAttribute('role'), about.getAttribute('aria-label'), about.getAttribute('data-parent'), about.hidden],
        heading: [q('win', '[data-settings-title]').getAttribute('role'), q('win', '[data-settings-title]').getAttribute('aria-level'), q('sheet', '[data-settings-title]').getAttribute('aria-level')],
        live: [q('win', '[data-settings-live]').getAttribute('role'), q('win', '[data-settings-live]').getAttribute('aria-live')],
        history: [q('win', '[data-settings-back]').getAttribute('aria-label'), q('win', '[data-settings-forward]').getAttribute('aria-label')],
      }
    `))

    expect(info.controls).toBe(true)
    expect(info.labelled).toBe(true)
    expect(info.role).toBe('tabpanel')
    expect(info.unique).toBe(true)
    expect(info.about).toEqual(['region', 'About', 'general', true])
    expect(info.heading).toEqual(['heading', '1', '2'])
    expect(info.live).toEqual(['status', 'polite'])
    expect(info.history).toEqual(['Back', 'Forward'])
  })
})

describe('switching panes', () => {
  it('opens a pane from its sidebar item, and says so', async () => {
    const result = await page.json(on(`
      reset('win')
      probe.events.pane.length = 0
      item('win', 'appearance').click()
      return { shown: shown('win'), selected: selected('win'), title: title('win'), stops: items('win').filter(i => i.tabIndex === 0).map(i => i.getAttribute('data-settings-item')), events: probe.events.pane, model: probe.open() }
    `))

    expect(result.shown).toEqual(['appearance'])
    expect(result.selected).toEqual(['appearance'])
    expect(result.title).toBe('Appearance')
    expect(result.stops).toEqual(['appearance'])
    expect(result.events).toEqual([{ id: 'appearance', title: 'Appearance', parent: '' }])
    expect(result.model).toBe('appearance')
  })

  it('follows the pane it is bound to', async () => {
    const result = await page.json(on(`probe.open.set('wifi'); return later(80, () => ({ shown: shown('win'), selected: selected('win'), pane: api('win').getPane() }))`))

    expect(result).toEqual({ shown: ['wifi'], selected: ['wifi'], pane: 'wifi' })
  })

  it('keeps a trail to go back and forward along, and drops what was ahead on a new choice', async () => {
    // Counted first: an engine may start a page with more than one entry.
    const entries = await page.json<number>('return history.length')
    const result = await page.json(on(`
      const out = {}, back = q('win', '[data-settings-back]'), forward = q('win', '[data-settings-forward]')
      const state = () => [api('win').getPane(), back.disabled, forward.disabled]
      api('win').showPane('general'); api('win').showPane('sound'); api('win').showPane('network')
      out.end = state()
      back.click(); out.back = state()
      api('win').back(); out.backAgain = state()
      forward.click(); out.forward = state()
      api('win').showPane('appearance'); out.chosen = state()
      api('win').forward(); out.nothingAhead = state()
      out.length = history.length
      return out
    `))

    expect(result.end).toEqual(['network', false, true])
    expect(result.back).toEqual(['sound', false, false])
    expect(result.backAgain).toEqual(['general', false, false])
    expect(result.forward).toEqual(['sound', false, false])
    expect(result.chosen).toEqual(['appearance', false, true])
    expect(result.nothingAhead).toEqual(['appearance', false, true])
    // The browser's own history is never touched.
    expect(result.length).toBe(entries)
  })

  it('goes back and forward with Command and the square brackets', async () => {
    const result = await page.json(on(`
      api('win').showPane('general'); api('win').showPane('sound')
      const out = {}
      out.handled = !press(document.body, '[', { metaKey: true }); out.back = api('win').getPane()
      press(document.body, ']', { ctrlKey: true }); out.forward = api('win').getPane()
      out.plain = press(document.body, '['); out.unmoved = api('win').getPane()
      return out
    `))

    expect(result).toEqual({ handled: true, back: 'general', forward: 'sound', plain: true, unmoved: 'sound' })
  })

  it('scrolls the pane to the top on a change, and draws the toolbar line only once scrolled', async () => {
    const result = await page.json(on(`
      reset('win')
      const body = q('win', '[data-settings-body]'), out = { before: root('win').hasAttribute('data-scrolled') }
      body.scrollTop = 200
      return later(80, () => {
        out.scrolled = root('win').hasAttribute('data-scrolled'); out.top = body.scrollTop
        api('win').showPane('sound')
        out.after = [body.scrollTop, root('win').hasAttribute('data-scrolled')]
        return out
      })
    `))

    expect(result.before).toBe(false)
    expect(result.scrolled).toBe(true)
    expect(result.top).toBe(200)
    expect(result.after).toEqual([0, false])
  })

  it('refuses a pane that does not exist', async () => {
    const result = await page.json(on(`reset('win'); return { ok: api('win').showPane('nowhere'), pane: api('win').getPane(), shown: shown('win') }`))

    expect(result).toEqual({ ok: false, pane: 'general', shown: ['general'] })
  })
})

describe('the keyboard in the sidebar', () => {
  it('moves and selects with the arrows, and stops at the ends', async () => {
    const result = await page.json(on(`
      reset('win')
      const out = {}, focused = () => document.activeElement.getAttribute('data-settings-item')
      item('win', 'general').focus()
      out.handled = !press(document.activeElement, 'ArrowDown'); out.down = [focused(), api('win').getPane()]
      press(document.activeElement, 'ArrowUp'); press(document.activeElement, 'ArrowUp'); out.up = [focused(), api('win').getPane()]
      press(document.activeElement, 'Home'); out.home = [focused(), api('win').getPane()]
      press(document.activeElement, 'ArrowUp'); out.top = focused()
      press(document.activeElement, 'End'); out.end = [focused(), api('win').getPane()]
      press(document.activeElement, 'ArrowDown'); out.bottom = focused()
      out.stops = items('win').filter(i => i.tabIndex === 0).length
      out.tab = press(document.activeElement, 'Tab')
      out.sideways = press(document.activeElement, 'ArrowRight')
      return out
    `))

    expect(result.handled).toBe(true)
    expect(result.down).toEqual(['appearance', 'appearance'])
    expect(result.up).toEqual(['network', 'network'])
    expect(result.home).toEqual(['wifi', 'wifi'])
    expect(result.top).toBe('wifi')
    expect(result.end).toEqual(['sound', 'sound'])
    expect(result.bottom).toBe('sound')
    expect(result.stops).toBe(1)
    // Tab is left alone: nothing traps focus.
    expect(result.tab).toBe(true)
    expect(result.sideways).toBe(true)
  })

  it('selects by typing the start of a name', async () => {
    const result = await page.json(on(`
      reset('win')
      const out = {}
      item('win', 'general').focus()
      press(document.activeElement, 's'); out.s = api('win').getPane()
      return later(800, () => {
        press(document.activeElement, 'n'); out.n = api('win').getPane()
        press(document.activeElement, 'e'); out.ne = [api('win').getPane(), document.activeElement.getAttribute('data-settings-item')]
        out.command = press(document.activeElement, 'w', { metaKey: true })
        return out
      })
    `))

    expect(result.s).toBe('sound')
    expect(result.n).toBe('network')
    expect(result.ne).toEqual(['network', 'network'])
    expect(result.command).toBe(true)
  })

  it('opens a pane with a click on an item that is not focused first', async () => {
    expect(await page.json(on(`reset('win'); item('win', 'wifi').click(); return selected('win')`))).toEqual(['wifi'])
  })
})

describe('navigation rows and sub-panes', () => {
  it('opens a sub-pane from a navigation row and keeps its parent selected in the sidebar', async () => {
    const result = await page.json(on(`
      reset('win')
      probe.events.navigate.length = 0; probe.events.pane.length = 0
      q('win', '[data-setting="about-row"]').click()
      return { shown: shown('win'), selected: selected('win'), title: title('win'), back: q('win', '[data-settings-back]').disabled, sub: root('win').hasAttribute('data-subpane'), navigate: probe.events.navigate, pane: probe.events.pane }
    `))

    expect(result.shown).toEqual(['about'])
    expect(result.selected).toEqual(['general'])
    expect(result.title).toBe('About')
    expect(result.back).toBe(false)
    expect(result.sub).toBe(true)
    expect(result.navigate).toEqual([{ id: 'about', from: 'general', setting: 'about-row' }])
    expect(result.pane).toEqual([{ id: 'about', title: 'About', parent: 'general' }])
  })

  it('comes back from it', async () => {
    const result = await page.json(on(`q('win', '[data-settings-back]').click(); return { shown: shown('win'), selected: selected('win'), sub: root('win').hasAttribute('data-subpane'), forward: q('win', '[data-settings-forward]').disabled }`))

    expect(result).toEqual({ shown: ['general'], selected: ['general'], sub: false, forward: false })
  })

  it('opens with Enter and with Space, and moves focus into the pane that opened', async () => {
    const result = await page.json(on(`
      const out = {}, link = q('win', '[data-setting="about-row"]')
      reset('win'); link.focus()
      out.enterHandled = !press(link, 'Enter'); out.enter = api('win').getPane(); out.focus = document.activeElement === paneEl('win', 'about')
      reset('win'); link.focus()
      out.spaceHandled = !press(link, ' '); out.space = api('win').getPane()
      reset('win'); link.focus()
      out.other = press(link, 'a'); out.unmoved = api('win').getPane()
      return out
    `))

    expect(result).toEqual({ enterHandled: true, enter: 'about', focus: true, spaceHandled: true, space: 'about', other: true, unmoved: 'general' })
  })

  it('leaves a control inside a navigation row to itself', async () => {
    const result = await page.json(on(`
      reset('win')
      const button = q('win', '[data-inner]')
      button.click(); const click = api('win').getPane()
      const key = press(button, 'Enter')
      return { click, key, pane: api('win').getPane() }
    `))

    expect(result).toEqual({ click: 'general', key: true, pane: 'general' })
  })

  it('leads back to the parent when a sub-pane was opened directly', async () => {
    const result = await page.json(on(`
      const out = {}
      api('dark').showPane('about')
      out.sub = [api('dark').getPane(), selected('dark')]
      api('dark').back(); api('dark').back(); api('dark').back()
      out.back = api('dark').getPane()
      return out
    `))

    expect(result.sub).toEqual(['about', ['general']])
    expect(result.back).toBe('appearance')
  })
})

describe('search', () => {
  it('filters the sidebar and lists the matching settings under it', async () => {
    const result = await page.json(on(`
      reset('win')
      probe.events.search.length = 0
      type('win', 'so')
      return {
        visible: visible('win'), groups: all('win', '[data-settings-group]').map(g => g.hidden), results: results('win'), resultsHidden: q('win', '[data-settings-results]').hidden,
        account: q('win', '[data-settings-account]').hidden, empty: q('win', '[data-settings-empty]').hidden, live: q('win', '[data-settings-live]').textContent,
        searching: root('win').hasAttribute('data-searching'), filled: q('win', '[data-settings-search]').hasAttribute('data-filled'), event: probe.events.search.slice(-1)[0], pane: api('win').getPane(),
      }
    `))

    expect(result.visible).toEqual(['sound'])
    expect(result.groups).toEqual([true, false])
    // A word that starts with the query, then the pane's name as a keyword.
    expect(result.results).toEqual([['Play sound on startup', 'Sound'], ['Alert volume', 'Sound']])
    expect(result.resultsHidden).toBe(false)
    expect(result.account).toBe(true)
    expect(result.empty).toBe(true)
    expect(result.live).toBe('3 results')
    expect(result.searching).toBe(true)
    expect(result.filled).toBe(true)
    expect(result.event).toEqual({
      query: 'so',
      panes: ['sound'],
      settings: [{ id: 'startup-sound', label: 'Play sound on startup', pane: 'sound' }, { id: 'alert-volume', label: 'Alert volume', pane: 'sound' }],
    })
    // Typing opens nothing by itself.
    expect(result.pane).toBe('general')
  })

  it('finds a setting inside a pane, by label or keyword, with no sidebar item matching', async () => {
    const result = await page.json(on(`
      const out = {}
      type('win', 'serial'); out.label = { visible: visible('win'), list: q('win', '[data-settings-list]').hidden, results: results('win'), live: q('win', '[data-settings-live]').textContent }
      type('win', 'locale'); out.keyword = results('win')
      type('win', 'ethernet'); out.item = { visible: visible('win'), results: results('win'), live: q('win', '[data-settings-live]').textContent }
      return out
    `))

    expect(result.label).toEqual({ visible: [], list: true, results: [['Serial number', 'About']], live: '1 result' })
    expect(result.keyword).toEqual([['Language', 'General']])
    expect(result.item).toEqual({ visible: ['network'], results: [], live: '1 result' })
  })

  it('opens the pane of a chosen setting, brings the row into view and highlights it for a moment', async () => {
    const result = await page.json(on(`
      reset('win')
      type('win', 'startup disk')
      const out = { results: results('win') }
      q('win', '[data-settings-result]').click()
      const target = q('win', '[data-setting="startup-disk"]'), body = q('win', '[data-settings-body]')
      const inView = () => { const r = target.getBoundingClientRect(), b = body.getBoundingClientRect(); return r.top >= b.top && r.bottom <= b.bottom }
      out.pane = api('win').getPane(); out.highlight = target.hasAttribute('data-highlight'); out.scrolled = body.scrollTop > 0; out.inView = inView()
      out.query = input('win').value
      return later(1750, () => { out.afterwards = target.hasAttribute('data-highlight'); return out })
    `))

    expect(result.results).toEqual([['Startup disk', 'General']])
    expect(result.pane).toBe('general')
    expect(result.highlight).toBe(true)
    expect(result.scrolled).toBe(true)
    expect(result.inView).toBe(true)
    expect(result.query).toBe('startup disk')
    // 1.6 seconds, then the row is an ordinary row again.
    expect(result.afterwards).toBe(false)
  })

  it('opens a sub-pane for a setting found inside one', async () => {
    const result = await page.json(on(`
      reset('win')
      type('win', 'serial')
      q('win', '[data-settings-result]').click()
      return { pane: api('win').getPane(), selected: selected('win'), highlight: q('win', '[data-setting="serial"]').hasAttribute('data-highlight'), title: title('win') }
    `))

    expect(result).toEqual({ pane: 'about', selected: ['general'], highlight: true, title: 'About' })
  })

  it('says when nothing matches', async () => {
    const result = await page.json(on(`
      type('win', 'zzzz')
      const empty = q('win', '[data-settings-empty]')
      return { hidden: empty.hidden, text: empty.textContent, visible: visible('win'), results: results('win'), live: q('win', '[data-settings-live]').textContent, drawn: box(empty).h > 0 }
    `))

    expect(result).toEqual({ hidden: false, text: 'No Results', visible: [], results: [], live: 'No results', drawn: true })
  })

  it('moves from the field through the items into the settings with the arrows, and opens one with Enter', async () => {
    const result = await page.json(on(`
      reset('win')
      const out = {}
      input('win').focus(); type('win', 'so')
      press(input('win'), 'ArrowDown'); out.first = document.activeElement.getAttribute('data-settings-item')
      press(document.activeElement, 'ArrowDown'); out.second = document.activeElement.getAttribute('data-settings-result')
      press(document.activeElement, 'ArrowDown'); out.third = document.activeElement.getAttribute('data-settings-result')
      press(document.activeElement, 'ArrowUp'); press(document.activeElement, 'ArrowUp'); out.backUp = document.activeElement.getAttribute('data-settings-item')
      input('win').focus(); press(input('win'), 'Enter'); out.enter = api('win').getPane()
      return out
    `))

    expect(result).toEqual({ first: 'sound', second: '0', third: '1', backUp: 'sound', enter: 'sound' })
  })

  it('focuses the field on Command F and clears it on Escape, returning focus to the list', async () => {
    const result = await page.json(on(`
      reset('win')
      const out = {}
      document.activeElement.blur()
      out.handled = !press(document.body, 'f', { metaKey: true }); out.focused = document.activeElement === input('win')
      type('win', 'app')
      out.filtered = visible('win')
      out.escape = !press(input('win'), 'Escape')
      out.value = input('win').value; out.visible = visible('win').length; out.account = q('win', '[data-settings-account]').hidden
      out.focus = document.activeElement.getAttribute('data-settings-item'); out.live = q('win', '[data-settings-live]').textContent
      out.results = q('win', '[data-settings-results]').hidden; out.searching = root('win').hasAttribute('data-searching')
      // With nothing typed, Escape is the window's to use.
      out.idle = press(input('win'), 'Escape')
      press(q('sheet', '[data-settings-list]'), 'f', { ctrlKey: true }); out.sheet = document.activeElement === input('sheet')
      return out
    `))

    expect(result.handled).toBe(true)
    expect(result.focused).toBe(true)
    expect(result.filtered).toEqual(['appearance'])
    expect(result.escape).toBe(true)
    expect(result.value).toBe('')
    expect(result.visible).toBe(5)
    expect(result.account).toBe(false)
    expect(result.focus).toBe('general')
    expect(result.live).toBe('')
    expect(result.results).toBe(true)
    expect(result.searching).toBe(false)
    expect(result.idle).toBe(true)
    expect(result.sheet).toBe(true)
  })

  it('clears with the button in the field', async () => {
    const result = await page.json(on(`
      type('win', 'wi')
      const clear = q('win', '[data-settings-search-clear]'), shownBefore = css(clear, 'display') !== 'none'
      clear.click()
      return { shownBefore, value: input('win').value, visible: visible('win').length, shownAfter: css(clear, 'display') !== 'none' }
    `))

    expect(result).toEqual({ shownBefore: true, value: '', visible: 5, shownAfter: false })
  })

  it('can be left out', async () => {
    expect(await page.json(on(`return { input: Boolean(input('dark')), panes: shown('dark').length }`))).toEqual({ input: false, panes: 1 })
  })
})

describe('the methods it exposes', () => {
  it('reveals a setting by its id: opens its pane, scrolls to it and highlights it', async () => {
    const result = await page.json(on(`
      reset('win')
      api('win').showPane('wifi')
      const ok = api('win').revealSetting('startup-disk'), target = q('win', '[data-setting="startup-disk"]'), body = q('win', '[data-settings-body]')
      const r = target.getBoundingClientRect(), b = body.getBoundingClientRect()
      return { ok, pane: api('win').getPane(), highlight: target.hasAttribute('data-highlight'), inView: r.top >= b.top && r.bottom <= b.bottom, missing: api('win').revealSetting('no-such-setting'), empty: api('win').revealSetting('') }
    `))

    expect(result).toEqual({ ok: true, pane: 'general', highlight: true, inView: true, missing: false, empty: false })
  })

  it('moves the highlight to the next setting revealed', async () => {
    const result = await page.json(on(`
      api('win').revealSetting('language')
      return { old: q('win', '[data-setting="startup-disk"]').hasAttribute('data-highlight'), next: q('win', '[data-setting="language"]').hasAttribute('data-highlight'), count: all('win', '[data-highlight]').length }
    `))

    expect(result).toEqual({ old: false, next: true, count: 1 })
  })

  it('focuses the search field', async () => {
    expect(await page.json(on(`document.activeElement.blur(); api('win').focusSearch(); return document.activeElement === input('win')`))).toBe(true)
  })

  it('keeps two windows on one page apart', async () => {
    const result = await page.json(on(`
      reset('win'); api('sheet').showPane('network')
      return { win: api('win').getPane(), sheet: api('sheet').getPane(), winShown: shown('win'), sheetShown: shown('sheet') }
    `))

    expect(result).toEqual({ win: 'general', sheet: 'network', winShown: ['general'], sheetShown: ['network'] })
  })
})

describe('a remembered pane', () => {
  it('stores the pane it moves to, and falls back when the stored pane is gone', async () => {
    const result = await page.json(on(`
      api('sheet').showPane('wifi')
      return { stored: localStorage.getItem('stx:settings:kept'), stale: api('stale').getPane(), staleShown: shown('stale'), staleStored: localStorage.getItem('stx:settings:stale') }
    `))

    expect(result.stored).toBe('wifi')
    // A stored id that no longer exists falls back, here to the pane the prop named.
    expect(result.stale).toBe('appearance')
    expect(result.staleShown).toEqual(['appearance'])
    expect(result.staleStored).toBe('appearance')
  })

  it('does not write anything without a storage key', async () => {
    expect(await page.json(on(`api('win').showPane('sound'); return Object.keys(localStorage).filter(k => k.startsWith('stx:settings:')).sort()`))).toEqual(['stx:settings:kept', 'stx:settings:stale'])
  })
})

describe('a window that is not in front', () => {
  it('turns the selection into the grey pill and back', async () => {
    const result = await page.json(on(`
      reset('win')
      const general = item('win', 'general'), out = { start: root('win').getAttribute('data-stx-window-active'), accent: accent(root('win')) }
      window.dispatchEvent(new Event('blur'))
      out.inactive = [root('win').getAttribute('data-stx-window-active'), css(general, 'backgroundColor'), css(general, 'color'), css(general.querySelector('.stx-settings-tile'), 'filter')]
      window.dispatchEvent(new Event('focus'))
      out.active = [root('win').getAttribute('data-stx-window-active'), css(general, 'backgroundColor'), css(general, 'color'), css(general.querySelector('.stx-settings-tile'), 'filter')]
      return out
    `))

    expect(result.start).toBe('true')
    expect(result.inactive).toEqual(['false', 'rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.85)', 'saturate(0.7)'])
    expect(result.active).toEqual(['true', result.accent, 'rgb(255, 255, 255)', 'none'])
  })

  it('goes quiet when Craft says the window is inactive too', async () => {
    const result = await page.json(on(`
      const general = item('win', 'general')
      document.documentElement.setAttribute('data-craft-window-active', 'false')
      const fill = css(general, 'backgroundColor')
      document.documentElement.removeAttribute('data-craft-window-active')
      return { fill, back: css(general, 'backgroundColor') === accent(root('win')) }
    `))

    expect(result).toEqual({ fill: 'rgba(0, 0, 0, 0.08)', back: true })
  })
})

describe('as a sheet', () => {
  it('is a rounded box of its own size, not the viewport', async () => {
    const result = await page.json(on(`
      const sheet = root('sheet'), small = root('stale')
      return {
        presentation: sheet.getAttribute('data-presentation'), sheet: box(sheet), radius: css(sheet, 'borderTopLeftRadius'), overflow: css(sheet, 'overflow'),
        small: box(small), smallSidebar: box(q('stale', '.stx-settings-sidebar')).w, sidebar: box(q('sheet', '.stx-settings-sidebar')).w,
        toolbar: box(q('sheet', '.stx-settings-toolbar')).h, scrolls: css(q('sheet', '[data-settings-body]'), 'overflowY'), window: root('win').getAttribute('data-presentation'),
      }
    `))

    expect(result.presentation).toBe('sheet')
    expect(result.window).toBe('window')
    // min(640px, 90vh) of an 800 viewport, and no wider than a Settings window.
    expect(result.sheet.h).toBe(640)
    expect(result.sheet.w).toBe(715)
    expect(result.sheet.x).toBe(20)
    expect(result.radius).toBe('14px')
    expect(result.overflow).toBe('hidden')
    expect(result.sidebar).toBe(226)
    expect(result.toolbar).toBe(52)
    expect(result.scrolls).toBe('auto')
    // The height and sidebar width it was given.
    expect(result.small.h).toBe(300)
    expect(result.smallSidebar).toBe(180)
  })

  it('hears its shortcuts only from inside itself', async () => {
    const result = await page.json(on(`
      api('sheet').showPane('general'); api('sheet').showPane('sound')
      reset('win'); api('win').showPane('appearance')
      press(q('sheet', '[data-settings-list]'), '[', { metaKey: true })
      return { sheet: api('sheet').getPane(), win: api('win').getPane() }
    `))

    expect(result).toEqual({ sheet: 'general', win: 'appearance' })
  })
})
