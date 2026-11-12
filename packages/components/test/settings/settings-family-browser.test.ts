/**
 * The Settings family put together, in a real browser.
 *
 * The shell, the rows and the controls were built apart and meet only in the
 * DOM. Each has its own tests against markup written by hand; this is the one
 * place they are tested as an app would use them, with the library's own rows
 * and controls inside the library's own window.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { EVENTS, openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

const HELPERS = `
  ${EVENTS}
  const root = () => document.getElementById('win')
  const api = () => root().closest('[data-stx-scope]').__stx_exposed
  const q = sel => root().querySelector(sel)
  const all = sel => Array.from(root().querySelectorAll(sel))
  const pane = id => q('[data-settings-pane="' + id + '"]')
  const shown = () => all('[data-settings-pane]').filter(p => !p.hidden && p.getBoundingClientRect().height > 0).map(p => p.getAttribute('data-settings-pane'))
  const row = id => q('[data-setting="' + id + '"]')
  const type = text => { const f = q('[data-settings-search-input]'); f.focus(); f.value = text; f.dispatchEvent(new Event('input', { bubbles: true })) }
  const later = (fn, ms) => new Promise(done => setTimeout(() => done(fn()), ms || 120))
  // As a browser computes it: aria-labelledby outranks aria-label.
  const name = el => { const ids = (el.getAttribute('aria-labelledby') || '').split(' ').filter(Boolean); return ids.map(id => (document.getElementById(id) || {}).textContent || '').join(' ').trim() || el.getAttribute('aria-label') || '' }
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'settings-family-browser',
    width: 715,
    height: 700,
    ready: `document.querySelectorAll('[data-settings-ready]').length === 1`,
    body: `
<script client>
const open = state('general')
const login = state(true)
const size = state('medium')
const text = state(1)
const heard = { pane: [], login: [] }
window.probe = { open, login, size, text, heard }
</script>
<SettingsWindow id="win" v-model:pane="open" @pane="heard.pane.push($event)">
  <template #sidebar>
    <SettingsSidebarGroup>
      <SettingsSidebarItem id="general" label="General" icon="i-f7-gear-alt-fill" tone="grey" />
      <SettingsSidebarItem id="appearance" label="Appearance" icon="i-f7-circle-lefthalf-fill" tone="ink" />
    </SettingsSidebarGroup>
  </template>
  <SettingsPane id="general" title="General" active>
    <SettingsPaneHeader icon="i-f7-gear-alt-fill" tone="grey" title="General" description="How the app behaves." />
    <SettingsGroup header="Startup" footer="Runs in the background.">
      <SettingsRow label="Open at login" description="When you sign in." setting="open-at-login" keywords="launch boot">
        <Switch variant="mac" v-model:checked="login" @change="heard.login.push($event)" />
      </SettingsRow>
      <SettingsRow label="About" to="about" value="2.4" setting="general-about" />
    </SettingsGroup>
  </SettingsPane>
  <SettingsPane id="about" title="About" parent="general">
    <SettingsGroup>
      <SettingsRow label="Licence" setting="licence"><Button appearance="mac">Show</Button></SettingsRow>
    </SettingsGroup>
  </SettingsPane>
  <SettingsPane id="appearance" title="Appearance">
    <SettingsGroup header="Windows">
      <SettingsRow label="Sidebar icon size" setting="icon-size" keywords="tiles">
        <Select variant="mac" v-model:value="size" placeholder="" :options="[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }]" />
      </SettingsRow>
      <SettingsRow label="Text size" setting="text-size">
        <Slider v-model:value="text" min="0" max="2" step="1" ticks />
      </SettingsRow>
      <SettingsRow label="Show scroll bars" layout="stacked" setting="scroll-bars">
        <RadioGroup variant="mac" value="auto" :options="[{ value: 'auto', label: 'Automatically' }, { value: 'always', label: 'Always' }]" />
      </SettingsRow>
    </SettingsGroup>
  </SettingsPane>
</SettingsWindow>`,
  })
}, 60_000)

afterAll(() => page?.close())

describe('the family together', () => {
  it('raises no script errors and opens on the pane it was given', async () => {
    expect(await page.errors()).toEqual([])
    expect(await page.json(on(`return { shown: shown(), title: q('[data-settings-title]').textContent.trim(), selected: all('[data-settings-item][aria-selected="true"]').map(i => i.getAttribute('data-settings-item')) }`)))
      .toEqual({ shown: ['general'], title: 'General', selected: ['general'] })
  })

  it('draws a group as one card with a rule between its rows only', async () => {
    const drawn = await page.json(on(`
      const card = row('open-at-login').closest('.stx-settings-card'), rows = Array.from(card.querySelectorAll('[data-settings-row]'))
      const s = getComputedStyle(card)
      return { radius: s.borderTopLeftRadius, rows: rows.length, heights: rows.map(r => Math.round(r.getBoundingClientRect().height)), inside: rows.every(r => card.contains(r)) }
    `))

    expect(drawn.radius).toBe('12px')
    expect(drawn.rows).toBe(2)
    expect(drawn.inside).toBe(true)
    // A row with a description grows; a plain one is the 38 System Settings draws.
    expect(drawn.heights[0]).toBeGreaterThan(38)
    expect(drawn.heights[1]).toBe(38)
  })

  it('names each control by its row, and describes it by the second line of the row', async () => {
    const names = await page.json(on(`
      const control = (id, sel) => row(id).querySelector(sel)
      const sw = control('open-at-login', '[role="switch"]')
      const described = (sw.getAttribute('aria-describedby') || '').split(' ').map(id => (document.getElementById(id) || {}).textContent || '').join(' ').trim()
      return { switch: name(sw), described, select: name(control('icon-size', 'select')), slider: name(control('text-size', 'input[type="range"]')), size: [Math.round(sw.getBoundingClientRect().width), Math.round(sw.getBoundingClientRect().height)] }
    `))

    expect(names.switch).toBe('Open at login')
    expect(names.described).toBe('When you sign in.')
    expect(names.select).toBe('Sidebar icon size')
    expect(names.slider).toBe('Text size')
    expect(names.size).toEqual([36, 20])
  })

  it('still works as a control inside a row', async () => {
    const result = await page.json(on(`
      row('open-at-login').querySelector('[role="switch"]').click()
      return later(() => ({ model: probe.login(), heard: probe.heard.login.slice(-1)[0], checked: row('open-at-login').querySelector('[role="switch"]').getAttribute('aria-checked') }))
    `))

    expect(result).toEqual({ model: false, heard: false, checked: 'false' })
  })

  it('opens a sub-pane from a navigation row, and comes back', async () => {
    const result = await page.json(on(`
      const nav = row('general-about')
      const drawn = { role: nav.getAttribute('role'), to: nav.getAttribute('data-navigate'), value: nav.textContent.includes('2.4') }
      nav.click()
      const inside = { shown: shown(), title: q('[data-settings-title]').textContent.trim(), selected: all('[data-settings-item][aria-selected="true"]').map(i => i.getAttribute('data-settings-item')), model: probe.open() }
      q('[data-settings-back]').click()
      return { drawn, inside, back: shown() }
    `))

    expect(result.drawn).toEqual({ role: 'button', to: 'about', value: true })
    // A sub-pane keeps its parent chosen in the sidebar.
    expect(result.inside).toEqual({ shown: ['about'], title: 'About', selected: ['general'], model: 'about' })
    expect(result.back).toEqual(['general'])
  })

  it('finds a setting inside a pane by its keywords, opens the pane and points at the row', async () => {
    const result = await page.json(on(`
      type('tiles')
      return later(() => {
        const hits = all('[data-settings-result]').map(r => r.textContent.replace(/\\s+/g, ' ').trim())
        const live = q('[data-settings-live]').textContent.trim()
        all('[data-settings-result]')[0].click()
        return later(() => ({ hits, live, shown: shown(), highlighted: all('[data-highlight]').map(r => r.getAttribute('data-setting')) }), 200)
      }, 200)
    `))

    expect(result.hits.length).toBe(1)
    expect(result.hits[0]).toContain('Sidebar icon size')
    expect(result.hits[0]).toContain('Appearance')
    expect(result.live).toContain('1')
    expect(result.shown).toEqual(['appearance'])
    expect(result.highlighted).toEqual(['icon-size'])
  })

  it('reveals a setting when asked from outside', async () => {
    const result = await page.json(on(`
      const found = api().revealSetting('open-at-login')
      const missing = api().revealSetting('no-such-setting')
      return later(() => ({ found, missing, shown: shown(), highlighted: all('[data-highlight]').map(r => r.getAttribute('data-setting')), pane: api().getPane() }))
    `))

    expect(result).toEqual({ found: true, missing: false, shown: ['general'], highlighted: ['open-at-login'], pane: 'general' })
  })

  it('stands down when the window is not in front', async () => {
    const colours = await page.json(on(`
      // The search above is still in the field, as System Settings leaves it,
      // and a filtered-out row is not drawn at all. Clear it to see the row.
      type('')
      const item = q('[data-settings-item="general"]')
      const read = () => [root().getAttribute('data-stx-window-active'), getComputedStyle(item).backgroundColor]
      // A headless window is never in front, so it is put there first.
      window.dispatchEvent(new Event('focus'))
      const front = read()
      window.dispatchEvent(new Event('blur'))
      const behind = read()
      window.dispatchEvent(new Event('focus'))
      return { front, behind, back: read()[1] === front[1] }
    `))

    expect(colours.front[0]).toBe('true')
    expect(colours.behind).toEqual(['false', 'rgba(0, 0, 0, 0.08)'])
    expect(colours.front[1]).not.toBe(colours.behind[1])
    expect(colours.back).toBe(true)
  })
})
