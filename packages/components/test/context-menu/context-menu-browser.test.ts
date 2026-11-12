/**
 * <ContextMenu> in a real browser: where a menu lands, where focus is, what
 * each key does, and that it gets out of the way again.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { EVENTS, openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

const HELPERS = `
  ${EVENTS}
  const host = id => document.getElementById(id)
  const api = id => host(id).closest('[data-stx-scope]').__stx_exposed
  const menus = () => Array.from(document.querySelectorAll('.stx-menu'))
  const rows = (depth) => Array.from((menus()[depth || 0] || document.createElement('div')).querySelectorAll(':scope > .stx-menu-item'))
  const labels = (depth) => rows(depth).map(r => r.querySelector('.stx-menu-label').textContent)
  const focused = () => { const a = document.activeElement; return a && a.classList.contains('stx-menu-item') ? a.querySelector('.stx-menu-label').textContent : (a && a.classList.contains('stx-menu') ? '(menu)' : (a && a.id) || a.tagName) }
  const key = (name, extra) => !press(document.activeElement, name, extra)
  const rightClick = (el, x, y) => { const c = centre(el); return !mouse(el, 'contextmenu', x == null ? c.x : x, y == null ? c.y : y, { button: 2, detail: 1 }) }
  const closeAll = () => { api('files').close(); api('fn').close(); api('off').close() }
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'context-menu-browser',
    width: 1000,
    height: 800,
    ready: `document.querySelectorAll('[data-menu-ready]').length === 3`,
    body: `
<script client>
const events = { select: [], open: [], close: [] }
const fileItems = state([
  { label: 'Copy value', id: 'copy', shortcut: 'Mod+C' },
  { label: 'Copy path', id: 'copy-path', shortcut: 'Shift+Mod+C' },
  { separator: true },
  { label: 'Open in', children: [
    { label: 'Table', id: 'table' },
    { label: 'Graph', id: 'graph' },
    { label: 'More', children: [{ label: 'Preview', id: 'preview' }] },
  ] },
  { label: 'Wrap lines', id: 'wrap', checked: true },
  { label: 'Paste', id: 'paste', disabled: true },
  { separator: true },
  { label: 'Delete', id: 'delete', danger: true, value: { confirm: true } },
])
const off = state(false)
function menuFor(target) {
  const row = target && target.closest('[data-row]')
  return row ? [{ label: 'Open ' + row.getAttribute('data-row'), id: 'open-row' }, { label: 'A {' + '{ braces }' + '} label', id: 'braces' }] : []
}
window.probe = { events, fileItems, off }
</script>
<button id="before">before</button>
<ContextMenu id="files" label="File actions" :items="fileItems()" @select="events.select.push($event)" @open="events.open.push($event)" @close="events.close.push($event)">
  <div id="area" style="width: 300px; height: 120px; margin: 20px; background: #eee">
    <button id="inside">inside</button>
  </div>
</ContextMenu>
<ContextMenu id="fn" :items="menuFor" @select="events.select.push($event)">
  <ul id="list" style="margin: 20px; width: 300px">
    <li data-row="alpha" id="alpha" tabindex="0">alpha</li>
    <li id="plain">no menu here</li>
  </ul>
</ContextMenu>
<ContextMenu id="off" :disabled="off()" items='[{"label":"Only item"}]'>
  <div id="corner" style="position: fixed; right: 0; bottom: 0; width: 60px; height: 60px; background: #ddd"></div>
</ContextMenu>`,
  })
}, 60_000)

afterAll(() => page?.close())

describe('opening', () => {
  it('raises no script errors and takes no box of its own', async () => {
    expect(await page.errors()).toEqual([])
    expect(await page.run(on(`return getComputedStyle(host('files')).display`))).toBe('contents')
  })

  it('opens at the pointer on a right click, and stops the browser menu', async () => {
    const result = await page.json(on(`
      const prevented = rightClick(host('area'), 100, 80)
      const box = menus()[0].getBoundingClientRect()
      return { prevented, count: menus().length, left: box.left, top: box.top, labels: labels(), focus: focused(), open: api('files').isOpen(), event: probe.events.open.slice(-1)[0] }
    `))

    expect(result.prevented).toBe(true)
    expect(result.count).toBe(1)
    expect([result.left, result.top]).toEqual([100, 80])
    expect(result.labels).toEqual(['Copy value', 'Copy path', 'Open in', 'Wrap lines', 'Paste', 'Delete'])
    // Opened by pointer: the menu has focus, and no item is chosen yet.
    expect(result.focus).toBe('(menu)')
    expect(result.open).toBe(true)
    expect(result.event.keyboard).toBe(false)
    expect(result.event.x).toBe(100)
  })

  it('describes the menu and its items to assistive technology', async () => {
    const info = await page.json(on(`
      const m = menus()[0], r = rows()
      const read = el => ({ role: el.getAttribute('role'), checked: el.getAttribute('aria-checked'), disabled: el.getAttribute('aria-disabled'), popup: el.getAttribute('aria-haspopup'), expanded: el.getAttribute('aria-expanded'), keys: el.getAttribute('aria-keyshortcuts'), shortcut: (el.querySelector('.stx-menu-shortcut') || {}).textContent || null })
      return { role: m.getAttribute('role'), label: m.getAttribute('aria-label'), separators: m.querySelectorAll('[role="separator"]').length, copy: read(r[0]), path: read(r[1]), sub: read(r[2]), wrap: read(r[3]), paste: read(r[4]), topLayer: m.parentElement.matches(':popover-open') }
    `))

    expect(info.role).toBe('menu')
    expect(info.label).toBe('File actions')
    expect(info.separators).toBe(2)
    expect(info.copy.role).toBe('menuitem')
    expect(info.copy.shortcut).toBe(page.apple ? '⌘C' : 'Ctrl+C')
    expect(info.copy.keys).toBe(page.apple ? 'Meta+C' : 'Control+C')
    expect(info.path.shortcut).toBe(page.apple ? '⇧⌘C' : 'Ctrl+Shift+C')
    expect(info.sub).toMatchObject({ popup: 'menu', expanded: 'false', shortcut: null })
    expect(info.wrap).toMatchObject({ role: 'menuitemcheckbox', checked: 'true' })
    expect(info.paste.disabled).toBe('true')
    expect(info.topLayer).toBe(true)
  })

  it('closes on a press outside, without stealing focus back', async () => {
    const result = await page.json(on(`
      const b = host('before'), c = centre(b)
      pointer(b, 'pointerdown', c.x, c.y)
      return { count: menus().length, close: probe.events.close.slice(-1)[0] }
    `))

    expect(result.count).toBe(0)
    expect(result.close).toEqual({ reason: 'outside' })
  })

  it('stays on screen when opened in a corner', async () => {
    const box = await page.json(on(`
      rightClick(host('corner'))
      const r = menus()[0].getBoundingClientRect()
      const out = { right: r.right, bottom: r.bottom, vw: innerWidth, vh: innerHeight }
      closeAll()
      return out
    `))

    expect(box.right).toBeLessThanOrEqual(box.vw - 8)
    expect(box.bottom).toBeLessThanOrEqual(box.vh - 8)
  })

  it('leaves the browser menu alone when disabled, or when there is nothing to show', async () => {
    const result = await page.json(on(`
      probe.off.set(true)
      return new Promise(done => setTimeout(() => {
        const disabled = rightClick(host('corner'))
        const empty = rightClick(host('plain'))
        probe.off.set(false)
        done({ disabled, empty, count: menus().length })
      }, 40))
    `))

    expect(result).toEqual({ disabled: false, empty: false, count: 0 })
  })

  it('builds its items for the element that was clicked', async () => {
    const result = await page.json(on(`
      rightClick(host('alpha'))
      const out = { labels: labels(), html: rows()[1].querySelector('.stx-menu-label').innerHTML }
      rows()[0].click()
      out.select = probe.events.select.slice(-1)[0]
      out.target = out.select.target === host('alpha')
      delete out.select.target
      return out
    `))

    // A label with braces in it is text, never a template.
    expect(result.labels).toEqual(['Open alpha', 'A {{ braces }} label'])
    expect(result.select).toEqual({ item: { label: 'Open alpha', id: 'open-row' }, id: 'open-row', path: [0] })
    expect(result.target).toBe(true)
  })
})

describe('the keyboard', () => {
  it('opens under the focused element from the menu key, on the first item', async () => {
    const result = await page.json(on(`
      const b = host('inside'); b.focus()
      const handled = !press(b, 'F10', { shiftKey: true })
      const anchor = b.getBoundingClientRect(), box = menus()[0].getBoundingClientRect()
      return { handled, focus: focused(), left: box.left - anchor.left, top: box.top - anchor.bottom, keyboard: probe.events.open.slice(-1)[0].keyboard }
    `))

    expect(result).toEqual({ handled: true, focus: 'Copy value', left: 0, top: 4, keyboard: true })
  })

  it('moves with the arrows, skipping separators and wrapping', async () => {
    const result = await page.json(on(`
      const seen = []
      for (const k of ['ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'End', 'Home']) { key(k); seen.push(focused()) }
      return seen
    `))

    expect(result).toEqual(['Copy path', 'Open in', 'Copy path', 'Copy value', 'Delete', 'Copy value', 'Delete', 'Copy value'])
  })

  it('jumps to an item by its first letters', async () => {
    const result = await page.json(on(`
      const seen = []
      key('p'); seen.push(focused())
      return new Promise(done => setTimeout(() => { key('c'); seen.push(focused()); key('o'); seen.push(focused()); done(seen) }, 700))
    `))

    expect(result).toEqual(['Paste', 'Copy value', 'Copy value'])
  })

  it('opens a submenu with the right arrow and closes it with the left', async () => {
    const result = await page.json(on(`
      const out = {}
      key('ArrowDown'); key('ArrowDown'); out.on = focused()
      key('ArrowRight'); out.opened = { count: menus().length, focus: focused(), expanded: rows(0)[2].getAttribute('aria-expanded'), labelledby: menus()[1].getAttribute('aria-labelledby') === rows(0)[2].id }
      const parent = rows(0)[2].getBoundingClientRect(), sub = menus()[1].getBoundingClientRect()
      out.beside = sub.left >= parent.right - 6 && Math.abs(sub.top - parent.top) <= 6
      key('ArrowDown'); key('ArrowDown'); key('Enter'); out.deeper = { count: menus().length, focus: focused() }
      key('Escape'); out.escaped = { count: menus().length, focus: focused() }
      key('ArrowLeft'); out.left = { count: menus().length, focus: focused(), expanded: rows(0)[2].getAttribute('aria-expanded') }
      return out
    `))

    expect(result.on).toBe('Open in')
    expect(result.opened).toEqual({ count: 2, focus: 'Table', expanded: 'true', labelledby: true })
    expect(result.beside).toBe(true)
    expect(result.deeper).toEqual({ count: 3, focus: 'Preview' })
    expect(result.escaped).toEqual({ count: 2, focus: 'More' })
    expect(result.left).toEqual({ count: 1, focus: 'Open in', expanded: 'false' })
  })

  it('does nothing on a disabled item', async () => {
    const result = await page.json(on(`
      const before = probe.events.select.length
      key('ArrowDown'); key('ArrowDown'); const on = focused()
      key('Enter')
      return { on, count: menus().length, selected: probe.events.select.length - before }
    `))

    expect(result).toEqual({ on: 'Paste', count: 1, selected: 0 })
  })

  it('chooses with Enter, closes, and gives focus back', async () => {
    const result = await page.json(on(`
      key('End'); key('Enter')
      const select = probe.events.select.slice(-1)[0]
      return { count: menus().length, focus: focused(), id: select.id, item: select.item, path: select.path, close: probe.events.close.slice(-1)[0].reason }
    `))

    expect(result.count).toBe(0)
    expect(result.focus).toBe('inside')
    expect(result.id).toBe('delete')
    expect(result.item).toEqual({ label: 'Delete', id: 'delete', danger: true, value: { confirm: true } })
    // Its place in the menu as drawn, separators included.
    expect(result.path).toEqual([7])
    expect(result.close).toBe('select')
  })

  it('closes on Escape and gives focus back, without the page seeing the key', async () => {
    const result = await page.json(on(`
      let leaked = 0
      const spy = e => { if (e.key === 'Escape') leaked++ }
      document.addEventListener('keydown', spy)
      host('inside').focus(); press(host('inside'), 'ContextMenu')
      const opened = menus().length
      key('Escape')
      document.removeEventListener('keydown', spy)
      return { opened, count: menus().length, focus: focused(), leaked, reason: probe.events.close.slice(-1)[0].reason }
    `))

    expect(result).toEqual({ opened: 1, count: 0, focus: 'inside', leaked: 0, reason: 'escape' })
  })
})

describe('the pointer', () => {
  it('moves focus to the item under it and opens a submenu after a pause', async () => {
    const result = await page.json(on(`
      rightClick(host('area'), 60, 60)
      const row = rows(0)[2], c = centre(row)
      pointer(row, 'pointermove', c.x, c.y)
      const at = { focus: focused(), count: menus().length }
      return new Promise(done => setTimeout(() => {
        const opened = { count: menus().length, focus: focused() }
        const other = rows(0)[0], o = centre(other)
        pointer(other, 'pointermove', o.x, o.y)
        setTimeout(() => done({ at, opened, after: { count: menus().length, focus: focused() } }), 260)
      }, 260))
    `))

    expect(result.at).toEqual({ focus: 'Open in', count: 1 })
    // Opened by hover, so focus stays on the item that opened it.
    expect(result.opened).toEqual({ count: 2, focus: 'Open in' })
    expect(result.after).toEqual({ count: 1, focus: 'Copy value' })
  })

  it('chooses an item in a submenu on a click', async () => {
    const result = await page.json(on(`
      rows(0)[2].click()
      const opened = menus().length
      rows(1)[1].click()
      const select = probe.events.select.slice(-1)[0]
      return { opened, count: menus().length, id: select.id, path: select.path }
    `))

    expect(result).toEqual({ opened: 2, count: 0, id: 'graph', path: [3, 1] })
  })
})

describe('from the page', () => {
  it('opens at a point with items of its own, and under an element', async () => {
    const result = await page.json(on(`
      const out = {}
      out.opened = api('files').open({ x: 300, y: 200 }, [{ label: 'One' }, { label: 'Two' }])
      const box = menus()[0].getBoundingClientRect()
      out.at = [box.left, box.top]; out.labels = labels()
      api('files').open(host('before'))
      out.again = { count: menus().length, labels: labels().length, focus: focused() }
      api('files').close()
      out.closed = { count: menus().length, open: api('files').isOpen() }
      out.nothing = api('files').open({ x: 1, y: 1 }, [])
      return out
    `))

    expect(result.opened).toBe(true)
    expect(result.at).toEqual([300, 200])
    expect(result.labels).toEqual(['One', 'Two'])
    expect(result.again).toEqual({ count: 1, labels: 6, focus: 'Copy value' })
    expect(result.closed).toEqual({ count: 0, open: false })
    expect(result.nothing).toBe(false)
  })

  it('follows a change to its items', async () => {
    const labels = await page.json(on(`
      probe.fileItems.set([{ label: 'Only' }])
      return new Promise(done => setTimeout(() => { api('files').open({ x: 10, y: 10 }); const l = labels(); api('files').close(); done(l) }, 40))
    `))

    expect(labels).toEqual(['Only'])
  })

  it('is drawn with the theme tokens', async () => {
    const colours = await page.json(on(`
      document.documentElement.style.setProperty('--stx-panel', 'rgb(10, 20, 30)')
      document.documentElement.style.setProperty('--stx-accent-solid', 'rgb(200, 0, 100)')
      api('files').open(host('before'))
      const out = { menu: getComputedStyle(menus()[0]).backgroundColor, active: getComputedStyle(rows()[0]).backgroundColor }
      api('files').close()
      return out
    `))

    expect(colours).toEqual({ menu: 'rgb(10, 20, 30)', active: 'rgb(200, 0, 100)' })
  })
})
