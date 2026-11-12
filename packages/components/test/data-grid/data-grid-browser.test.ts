/**
 * <DataGrid> in a real browser.
 *
 * What makes a grid of a hundred thousand rows usable is what is NOT in the
 * document, and what a scroll, a sort and a filter cost. None of that can be
 * seen without an engine that lays the page out, so this loads the rows into
 * a real one and measures there, around the synchronous work with a forced
 * layout inside the measurement.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { EVENTS, openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

const HELPERS = `
  ${EVENTS}
  const grid = id => document.getElementById(id)
  const root = id => grid(id).closest('[data-stx-data-grid]')
  const api = id => grid(id).closest('[data-stx-scope]').__stx_exposed
  const view = id => api(id).grid()
  const body = id => root(id).querySelector('[data-dg="body"]')
  const shown = id => Array.from(body(id).children).filter(r => r.style.display !== 'none').sort((a, b) => a.__dgRow - b.__dgRow)
  const texts = (id, column) => shown(id).map(r => { const c = Array.from(r.children).find(c => c.__dgColumn === column); return c ? c.textContent : null })
  const cell = (id, row, column) => document.getElementById(id + '-r' + row + '-c' + column)
  const head = (id, column) => document.getElementById(id + '-h-c' + column)
  const heads = id => Array.from(root(id).querySelectorAll('.stx-dg-head'))
  const status = id => root(id).querySelector('[data-dg="status"]').textContent
  const active = id => grid(id).getAttribute('aria-activedescendant')
  const layout = id => body(id).lastElementChild && body(id).lastElementChild.getBoundingClientRect().top
  const timed = work => { const t = performance.now(); work(); return performance.now() - t }
  const stats = list => { const s = list.slice().sort((a, b) => a - b); const at = q => s[Math.min(s.length - 1, Math.floor(s.length * q))]; return { median: +at(0.5).toFixed(2), p95: +at(0.95).toFixed(2), max: +s[s.length - 1].toFixed(2) } }
  const wait = ms => new Promise(done => setTimeout(done, ms))
`
const on = (body: string): string => `${HELPERS}\n${body}`

/** A hundred thousand rows of twelve columns, the same ones every run. */
const MAKE_ROWS = `
  const makeRows = (count) => {
    let seed = 42
    const next = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
    const first = ['Ada', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'Radia', 'Alan', 'Edsger', 'Hedy', 'Tim']
    const last = ['Lovelace', 'Hopper', 'Torvalds', 'Hamilton', 'Ritchie', 'Liskov', 'Thompson', 'Perlman', 'Turing', 'Dijkstra', 'Lamarr', 'Berners-Lee']
    const cities = ['Berlin', 'Lisbon', 'Osaka', 'Lagos', 'Lima', 'Oslo', 'Perth', 'Quito', 'Hanoi', 'Turin']
    const rows = new Array(count)
    for (let i = 0; i < count; i++) {
      const f = first[Math.floor(next() * first.length)], l = last[Math.floor(next() * last.length)]
      rows[i] = {
        id: i + 1,
        name: f + ' ' + l,
        email: (f + '.' + l + i + '@example.com').toLowerCase(),
        age: 18 + Math.floor(next() * 60),
        score: Math.round(next() * 1e6) / 100,
        active: next() > 0.5,
        created: new Date(1600000000000 + Math.floor(next() * 1e11)).toISOString(),
        city: cities[Math.floor(next() * cities.length)],
        balance: Math.round((next() - 0.3) * 1e7) / 100,
        visits: next() > 0.1 ? Math.floor(next() * 5000) : null,
        tags: i % 7 === 0 ? ['vip', 'beta'] : ['user'],
        note: 'note ' + (i % 1000) + ' ' + l,
      }
    }
    return rows
  }
`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'data-grid-browser',
    width: 1100,
    height: 1000,
    ready: `document.querySelectorAll('[data-dg-ready]').length === 4`,
    body: `
<script client>
const people = [
  { id: 1, name: 'Ada', age: 36, joined: '2021-03-04', admin: true, meta: { team: 'core' } },
  { id: 2, name: 'bob', age: null, joined: '2019-11-20', admin: false, meta: null },
  { id: 3, name: 'Cy, the "third"', age: 9, joined: '2023-01-01', admin: false, meta: { team: 'docs' } },
  // Put together here: written out, the page build would take it for one of its own expressions.
  { id: 4, name: '{' + '{ 6 * 7 }' + '}', age: 120, joined: '2020-05-05', admin: true, meta: { team: 'core' } },
]
const events = { sort: [], filter: [], select: [], cell: [], activate: [], copy: [], exported: [], context: [] }
const boundRows = state([])
const few = state([{ a: 1, b: 'x' }, { a: 2, b: 'y' }])
window.probe = { events, boundRows, few }
</script>
<div style="width: 900px; padding: 8px">
  <DataGrid id="big" height="420px" label="Everything" />
</div>
<div style="width: 700px; padding: 8px">
  <DataGrid id="small" :rows="people" height="240px" label="People" fileName="people" contextMenu
    @sort="events.sort.push($event)" @filter="events.filter.push($event)" @select="events.select.push($event)" @cell="events.cell.push($event)"
    @activate="events.activate.push($event)" @copy="events.copy.push($event)" @export="events.exported.push($event)" @context="events.context.push($event)" />
</div>
<div style="width: 700px; padding: 8px">
  <DataGrid id="bound" :rows="boundRows()" height="200px" />
</div>
<div style="width: 400px; padding: 8px">
  <DataGrid id="bare" :rows="few()" height="120px" filterable="false" exportable="false" selectable="false" rowHeight="20" headerHeight="24" />
</div>`,
  })
  // A download must not leave the page, and the test wants to see what was saved.
  await page.run(`
    window.downloads = []
    HTMLAnchorElement.prototype.click = function () { window.downloads.push({ name: this.download, href: this.href.slice(0, 5) }) }
    return true
  `)
}, 60_000)

afterAll(() => page?.close())

describe('what is drawn', () => {
  it('raises no script errors', async () => {
    expect(await page.errors()).toEqual([])
  })

  it('is a grid, with rows, cells and column headers', async () => {
    const info = await page.json(on(`
      const g = grid('small'), first = shown('small')[0], c = cell('small', 0, 1), h = head('small', 1)
      return {
        role: g.getAttribute('role'), tab: g.tabIndex, label: g.getAttribute('aria-label'), rows: g.getAttribute('aria-rowcount'), cols: g.getAttribute('aria-colcount'), multi: g.getAttribute('aria-multiselectable'),
        describedBy: document.getElementById(g.getAttribute('aria-describedby')).getAttribute('role'),
        headerRow: [h.parentElement.getAttribute('role'), h.parentElement.getAttribute('aria-rowindex')],
        row: [first.getAttribute('role'), first.getAttribute('aria-rowindex'), first.getAttribute('aria-selected')],
        cell: [c.getAttribute('role'), c.getAttribute('aria-colindex'), c.getAttribute('aria-selected'), c.textContent],
        head: [h.getAttribute('role'), h.getAttribute('aria-colindex'), h.getAttribute('aria-sort'), h.textContent],
        filterLabel: document.querySelector('label[for="small-filter"]').textContent,
        buttons: Array.from(root('small').querySelectorAll('button')).map(b => b.getAttribute('aria-label')),
      }
    `))

    expect(info).toEqual({
      role: 'grid',
      tab: 0,
      label: 'People',
      rows: '5',
      cols: '6',
      multi: 'true',
      describedBy: 'status',
      headerRow: ['row', '1'],
      row: ['row', '2', 'false'],
      cell: ['gridcell', '2', 'false', 'Ada'],
      head: ['columnheader', '2', 'none', 'name'],
      filterLabel: 'Filter People',
      buttons: ['Export People as CSV', 'Export People as JSON'],
    })
  })

  it('works the columns and their types out, and puts numbers on the right', async () => {
    const info = await page.json(on(`
      const first = shown('small')[0]
      return {
        heads: heads('small').map(h => h.textContent),
        types: Array.from(first.children).map(c => c.getAttribute('data-type')),
        align: Array.from(first.children).map(c => getComputedStyle(c).textAlign),
        numeric: getComputedStyle(cell('small', 0, 2)).fontVariantNumeric,
        status: status('small'),
      }
    `))

    expect(info.heads).toEqual(['id', 'name', 'age', 'joined', 'admin', 'meta'])
    expect(info.types).toEqual(['number', 'string', 'number', 'date', 'boolean', 'json'])
    expect(info.align).toEqual(['right', 'start', 'right', 'start', 'start', 'start'])
    expect(info.numeric).toContain('tabular-nums')
    expect(info.status).toBe('4 rows')
  })

  it('shows empty cells as empty, and tells them from text', async () => {
    const info = await page.json(on(`
      const a = cell('small', 1, 2), m = cell('small', 1, 5)
      return { age: [a.textContent, a.getAttribute('data-empty')], meta: [m.textContent, m.getAttribute('data-empty')], json: cell('small', 0, 5).textContent, filled: cell('small', 0, 2).hasAttribute('data-empty') }
    `))

    expect(info).toEqual({ age: ['null', 'null'], meta: ['null', 'null'], json: '{"team":"core"}', filled: false })
  })

  it('shows a value with braces in it as the text it is', async () => {
    expect(await page.run(on(`return cell('small', 3, 1).textContent`))).toBe('{{ 6 * 7 }}')
  })

  it('keeps the header on screen while the rows scroll under it', async () => {
    const info = await page.json(on(`
      const g = grid('small')
      g.scrollTop = 40
      view('small').render()
      const out = { header: Math.round(head('small', 0).getBoundingClientRect().top - g.getBoundingClientRect().top), position: getComputedStyle(root('small').querySelector('[data-dg="header"]')).position }
      g.scrollTop = 0
      view('small').render()
      return out
    `))

    expect(info).toEqual({ header: 0, position: 'sticky' })
  })

  it('takes its row and header heights, and can do without the toolbar', async () => {
    const info = await page.json(on(`
      const r = shown('bare')
      return {
        toolbar: Boolean(root('bare').querySelector('[data-dg="toolbar"]')), filter: Boolean(root('bare').querySelector('[data-dg="filter"]')),
        status: [status('bare'), root('bare').querySelector('[data-dg="status"]').getAttribute('role')],
        row: r[0].getBoundingClientRect().height, step: r[1].getBoundingClientRect().top - r[0].getBoundingClientRect().top, header: root('bare').querySelector('[data-dg="header"]').getBoundingClientRect().height,
        selected: r[0].getAttribute('aria-selected'), multi: grid('bare').getAttribute('aria-multiselectable'),
      }
    `))

    expect(info).toEqual({ toolbar: false, filter: false, status: ['2 rows', 'status'], row: 20, step: 20, header: 24, selected: null, multi: null })
  })
})

describe('sorting', () => {
  it('sorts on a header click, the other way on a second, and not at all on a third', async () => {
    const result = await page.json(on(`
      const out = {}
      mouse(head('small', 2), 'click'); out.asc = [texts('small', 2), head('small', 2).getAttribute('aria-sort')]
      mouse(head('small', 2), 'click'); out.desc = [texts('small', 2), head('small', 2).getAttribute('aria-sort')]
      mouse(head('small', 2), 'click'); out.none = [texts('small', 0), head('small', 2).getAttribute('aria-sort')]
      out.events = probe.events.sort.slice(-3)
      return out
    `))

    expect(result.asc).toEqual([['9', '36', '120', 'null'], 'ascending'])
    expect(result.desc).toEqual([['120', '36', '9', 'null'], 'descending'])
    expect(result.none).toEqual([['1', '2', '3', '4'], 'none'])
    expect(result.events).toEqual([[{ key: 'age', direction: 'asc' }], [{ key: 'age', direction: 'desc' }], []])
  })

  it('sorts by a second column with shift, and numbers the two', async () => {
    const result = await page.json(on(`
      mouse(head('small', 4), 'click')
      mouse(head('small', 2), 'click', 0, 0, { shiftKey: true })
      const out = { ids: texts('small', 0), marks: [head('small', 4).querySelector('.stx-dg-sort').textContent, head('small', 2).querySelector('.stx-dg-sort').textContent] }
      api('small').setSort([])
      out.cleared = [texts('small', 0), head('small', 4).getAttribute('aria-sort')]
      return out
    `))

    expect(result.ids).toEqual(['3', '2', '1', '4'])
    expect(result.marks).toEqual(['▲1', '▲2'])
    expect(result.cleared).toEqual([['1', '2', '3', '4'], 'none'])
  })
})

describe('the keyboard', () => {
  it('moves the active cell and names it to assistive technology', async () => {
    const result = await page.json(on(`
      const g = grid('small'), out = {}
      g.focus()
      api('small').grid().setActiveCell(0, 0)
      out.start = active('small')
      out.handled = !press(g, 'ArrowDown'); press(g, 'ArrowRight'); out.moved = active('small')
      out.marked = cell('small', 1, 1).hasAttribute('data-active')
      press(g, 'End'); out.end = active('small')
      press(g, 'Home'); out.home = active('small')
      press(g, 'End', { ctrlKey: true }); out.last = active('small')
      press(g, 'Home', { metaKey: true }); out.first = active('small')
      out.ignored = press(g, 'q')
      out.event = probe.events.cell.slice(-1)[0]
      return out
    `))

    expect(result.start).toBe('small-r0-c0')
    expect(result.handled).toBe(true)
    expect(result.moved).toBe('small-r1-c1')
    expect(result.marked).toBe(true)
    expect(result.end).toBe('small-r1-c5')
    expect(result.home).toBe('small-r1-c0')
    expect(result.last).toBe('small-r3-c5')
    expect(result.first).toBe('small-r0-c0')
    expect(result.ignored).toBe(true)
    expect(result.event.rowIndex).toBe(0)
    expect(result.event.value).toBe(1)
    expect(result.event.column.key).toBe('id')
  })

  it('reaches the header, sorts from it and resizes a column from it', async () => {
    const result = await page.json(on(`
      const g = grid('small'), out = {}
      api('small').grid().setActiveCell(0, 2)
      press(g, 'ArrowUp'); out.onHeader = active('small')
      press(g, 'Enter'); out.sorted = [texts('small', 2), head('small', 2).getAttribute('aria-sort'), active('small')]
      press(g, ' '); out.again = head('small', 2).getAttribute('aria-sort')
      press(g, 'Enter'); out.none = head('small', 2).getAttribute('aria-sort')
      const before = head('small', 2).getBoundingClientRect().width
      press(g, 'ArrowRight', { altKey: true }); out.wider = head('small', 2).getBoundingClientRect().width - before
      press(g, 'ArrowLeft', { altKey: true }); out.back = head('small', 2).getBoundingClientRect().width - before
      press(g, 'ArrowDown'); out.down = active('small')
      return out
    `))

    expect(result.onHeader).toBe('small-h-c2')
    expect(result.sorted).toEqual([['9', '36', '120', 'null'], 'ascending', 'small-h-c2'])
    expect(result.again).toBe('descending')
    expect(result.none).toBe('none')
    expect(result.wider).toBe(16)
    expect(result.back).toBe(0)
    expect(result.down).toBe('small-r0-c2')
  })

  it('selects with the space bar, extends with shift, and takes everything with select all', async () => {
    const result = await page.json(on(`
      const g = grid('small'), out = {}
      api('small').clearSelection()
      api('small').grid().setActiveCell(1, 0)
      press(g, ' '); out.one = api('small').getSelection().indices
      out.aria = [shown('small')[1].getAttribute('aria-selected'), cell('small', 1, 0).getAttribute('aria-selected'), shown('small')[0].getAttribute('aria-selected')]
      press(g, 'ArrowDown', { shiftKey: true }); out.range = api('small').getSelection().indices
      out.status = status('small')
      press(g, 'a', { metaKey: true }); out.all = api('small').getSelection().indices
      press(g, 'Escape'); out.cleared = api('small').getSelection().indices
      out.event = probe.events.select.slice(-1)[0]
      return out
    `))

    expect(result.one).toEqual([1])
    expect(result.aria).toEqual(['true', 'true', 'false'])
    expect(result.range).toEqual([1, 2])
    expect(result.status).toBe('4 rows, 2 selected')
    expect(result.all).toEqual([0, 1, 2, 3])
    expect(result.cleared).toEqual([])
    expect(result.event).toEqual({ rows: [], indices: [] })
  })

  it('copies the cell as JSON, the row with shift, and activates a row on Enter', async () => {
    const result = await page.json(on(`
      const g = grid('small')
      api('small').grid().setActiveCell(2, 1)
      press(g, 'c', { metaKey: true })
      press(g, 'c', { ctrlKey: true, shiftKey: true })
      press(g, 'Enter')
      return { copies: probe.events.copy.slice(-2), activate: probe.events.activate.slice(-1)[0] }
    `))

    expect(result.copies[0]).toEqual({ what: 'cell', text: '"Cy, the \\"third\\""' })
    expect(result.copies[1].what).toBe('row')
    expect(JSON.parse(result.copies[1].text)).toEqual({ id: 3, name: 'Cy, the "third"', age: 9, joined: '2023-01-01', admin: false, meta: { team: 'docs' } })
    expect(result.activate.rowIndex).toBe(2)
    expect(result.activate.row.id).toBe(3)
  })
})

describe('the pointer', () => {
  it('selects a row on a click, toggles with the modifier and takes a range with shift', async () => {
    const result = await page.json(on(`
      const out = {}
      mouse(cell('small', 0, 1), 'click'); out.one = api('small').getSelection().indices
      out.active = active('small')
      mouse(cell('small', 2, 1), 'click', 0, 0, { metaKey: true }); out.two = api('small').getSelection().indices
      mouse(cell('small', 3, 1), 'click', 0, 0, { shiftKey: true }); out.range = api('small').getSelection().indices
      mouse(cell('small', 2, 1), 'click', 0, 0, { ctrlKey: true }); out.minus = api('small').getSelection().indices
      mouse(cell('small', 1, 3), 'dblclick'); out.activate = probe.events.activate.slice(-1)[0].rowIndex
      api('small').clearSelection()
      return out
    `))

    expect(result.one).toEqual([0])
    expect(result.active).toBe('small-r0-c1')
    expect(result.two).toEqual([0, 2])
    expect(result.range).toEqual([2, 3])
    expect(result.minus).toEqual([3])
    expect(result.activate).toBe(1)
  })

  it('resizes a column by dragging its edge, and fits it on a double click', async () => {
    const result = await page.json(on(`
      const handle = head('small', 1).querySelector('.stx-dg-resize'), c = centre(handle), out = {}
      const before = head('small', 1).getBoundingClientRect().width, next = head('small', 2).getBoundingClientRect().left
      pointer(handle, 'pointerdown', c.x, c.y); pointer(handle, 'pointermove', c.x + 60, c.y)
      out.dragging = root('small').hasAttribute('data-resizing')
      pointer(handle, 'pointerup', c.x + 60, c.y)
      out.grew = head('small', 1).getBoundingClientRect().width - before
      out.pushed = head('small', 2).getBoundingClientRect().left - next
      out.cell = cell('small', 0, 1).getBoundingClientRect().width - before
      out.sorted = head('small', 1).getAttribute('aria-sort')
      pointer(handle, 'pointerdown', c.x + 60, c.y); pointer(handle, 'pointermove', c.x - 900, c.y); pointer(handle, 'pointerup', c.x - 900, c.y)
      out.least = head('small', 1).getBoundingClientRect().width
      mouse(head('small', 1).querySelector('.stx-dg-resize'), 'dblclick')
      out.fitted = head('small', 1).getBoundingClientRect().width === before
      out.done = root('small').hasAttribute('data-resizing')
      return out
    `))

    expect(result).toEqual({ dragging: true, grew: 60, pushed: 60, cell: 60, sorted: 'none', least: 48, fitted: true, done: false })
  })

  it('reports a right click with the cell under it, and keeps the browser menu away when asked', async () => {
    const result = await page.json(on(`
      const prevented = !mouse(cell('small', 2, 1), 'contextmenu', 120, 90)
      const left = mouse(cell('bare', 0, 0), 'contextmenu', 10, 10)
      const e = probe.events.context.slice(-1)[0]
      return { prevented, left, row: e.row.id, rowIndex: e.rowIndex, column: e.column.key, value: e.value, x: e.x, y: e.y, count: probe.events.context.length }
    `))

    expect(result).toEqual({ prevented: true, left: true, row: 3, rowIndex: 2, column: 'name', value: 'Cy, the "third"', x: 120, y: 90, count: 1 })
  })
})

describe('filtering and exporting', () => {
  it('filters as the field is typed in, after a pause, and says how many are left', async () => {
    const result = await page.json(on(`
      const f = root('small').querySelector('[data-dg="filter"]')
      f.value = 'co'; f.dispatchEvent(new Event('input', { bubbles: true }))
      f.value = 'core'; f.dispatchEvent(new Event('input', { bubbles: true }))
      const early = status('small')
      return wait(220).then(() => ({ early, status: status('small'), ids: texts('small', 0), events: probe.events.filter.slice(), rows: grid('small').getAttribute('aria-rowcount') }))
    `))

    expect(result.early).toBe('4 rows')
    expect(result.status).toBe('2 of 4 rows')
    expect(result.ids).toEqual(['1', '4'])
    expect(result.events).toEqual([{ text: 'core', count: 2 }])
    expect(result.rows).toBe('3')
  })

  it('exports what is on show: filtered, sorted, as CSV and as JSON', async () => {
    const result = await page.json(on(`
      api('small').setSort([{ key: 'id', direction: 'desc' }])
      root('small').querySelector('[data-dg="export-csv"]').click()
      root('small').querySelector('[data-dg="export-json"]').click()
      const out = { downloads: window.downloads.slice(-2), events: probe.events.exported.slice(-2), csv: api('small').exportCsv(), view: api('small').getView().map(r => r.id) }
      api('small').setSort([])
      api('small').setFilter('')
      out.after = [status('small'), root('small').querySelector('[data-dg="filter"]').value]
      return out
    `))

    expect(result.downloads).toEqual([{ name: 'people.csv', href: 'blob:' }, { name: 'people.json', href: 'blob:' }])
    expect(result.csv).toBe('id,name,age,joined,admin,meta\r\n4,{{ 6 * 7 }},120,2020-05-05,true,"{""team"":""core""}"\r\n1,Ada,36,2021-03-04,true,"{""team"":""core""}"\r\n')
    expect(result.events[0]).toEqual({ format: 'csv', text: result.csv, rows: 2 })
    expect(result.events[1].format).toBe('json')
    expect(JSON.parse(result.events[1].text).map((row: any) => row.id)).toEqual([4, 1])
    expect(result.view).toEqual([4, 1])
    expect(result.after).toEqual(['4 rows', ''])
  })

  it('says so when nothing matches', async () => {
    const result = await page.json(on(`
      api('small').setFilter('zzzz')
      const out = { status: status('small'), empty: root('small').hasAttribute('data-empty'), rows: shown('small').length, field: root('small').querySelector('[data-dg="filter"]').value }
      api('small').setFilter('')
      out.back = shown('small').length
      return out
    `))

    expect(result).toEqual({ status: '0 of 4 rows', empty: true, rows: 0, field: 'zzzz', back: 4 })
  })

  it('takes new rows from its rows prop', async () => {
    const result = await page.json(on(`
      probe.few.set([{ a: 5, b: 'p', c: true }, { a: 6, b: 'q', c: false }, { a: 7, b: 'r', c: true }])
      return wait(60).then(() => ({ heads: heads('bare').map(h => h.textContent), a: texts('bare', 0), status: status('bare') }))
    `))

    expect(result).toEqual({ heads: ['a', 'b', 'c'], a: ['5', '6', '7'], status: '3 rows' })
  })
})

describe('a hundred thousand rows', () => {
  const numbers: Record<string, unknown> = {}

  it('takes them, and draws only the ones on screen', async () => {
    const result = await page.json(on(`
      ${MAKE_ROWS}
      window.bigRows = makeRows(100000)
      const set = timed(() => { api('big').setRows(window.bigRows); layout('big') })
      const g = grid('big'), rows = shown('big')
      return {
        set, rowCount: g.getAttribute('aria-rowcount'), colCount: g.getAttribute('aria-colcount'), status: status('big'),
        rows: rows.length, cells: rows[0].childElementCount, heads: heads('big').length, elements: root('big').querySelectorAll('*').length,
        height: root('big').querySelector('[data-dg="content"]').offsetHeight, viewport: [g.clientWidth, g.clientHeight],
        total: view('big').model.totalWidth,
      }
    `))
    numbers['setRows (ms)'] = +result.set.toFixed(1)
    numbers['elements in the grid'] = result.elements
    numbers['rows / cells per row in the DOM'] = `${result.rows} / ${result.cells}`

    expect(result.rowCount).toBe('100001')
    expect(result.colCount).toBe('12')
    expect(result.status).toBe('100,000 rows')
    // The laid-out height, not the inline style: Chrome writes a length this
    // large back as `2.80003e+06px`.
    expect(result.height).toBe(2800032)
    // About 12 rows fit; a few more are drawn past each edge.
    expect(result.rows).toBeGreaterThan(8)
    expect(result.rows).toBeLessThan(40)
    // The twelve columns are wider than the grid, so not all of them are drawn.
    expect(result.total).toBeGreaterThan(result.viewport[0])
    expect(result.cells).toBeLessThan(12)
    expect(result.heads).toBe(result.cells)
    expect(result.elements).toBeLessThan(600)
    expect(result.set).toBeLessThan(1500)
  })

  it('scrolls without making or dropping elements', async () => {
    const result = await page.json(on(`
      const g = grid('big'), v = view('big'), vertical = [], horizontal = []
      const before = body('big').childElementCount
      for (let i = 0; i < 100; i++) vertical.push(timed(() => { g.scrollTop += 28 * 17 + 5; v.render(); layout('big') }))
      const mid = { first: shown('big')[0].__dgRow, top: g.scrollTop, text: texts('big', 0)[0], rows: shown('big').length, children: body('big').childElementCount }
      for (let i = 0; i < 50; i++) horizontal.push(timed(() => { g.scrollLeft += 97; v.render(); layout('big') }))
      const right = { cells: shown('big')[0].childElementCount, lastHead: heads('big').slice(-1)[0].textContent, left: g.scrollLeft }
      g.scrollTop = 28 * 99990; v.render()
      const end = { last: shown('big').slice(-1)[0].__dgRow, text: texts('big', view('big').model.columns.length - 1).slice(-1)[0] }
      g.scrollTop = 0; g.scrollLeft = 0; v.render()
      return { before, mid, right, end, vertical: stats(vertical), horizontal: stats(horizontal) }
    `))
    numbers['vertical scroll step (ms)'] = result.vertical
    numbers['horizontal scroll step (ms)'] = result.horizontal

    expect(result.mid.top).toBe(100 * (28 * 17 + 5))
    expect(result.mid.first).toBeGreaterThan(1700 - 10)
    expect(result.mid.first).toBeLessThanOrEqual(Math.floor(result.mid.top / 28))
    expect(result.mid.text).toBe(String(result.mid.first + 1))
    expect(result.mid.rows).toBeLessThan(40)
    // Rows are handed on, not made: the body holds one screen of them and no more.
    expect(result.before).toBeLessThan(40)
    expect(result.mid.children).toBeLessThan(40)
    expect(result.mid.children - result.mid.rows).toBeLessThanOrEqual(2)
    expect(result.right.left).toBeGreaterThan(0)
    expect(result.right.lastHead).toBe('note')
    expect(result.right.cells).toBeLessThan(12)
    expect(result.end.last).toBe(99999)
    expect(result.end.text).toMatch(/^note 999 /)
    expect(result.vertical.p95).toBeLessThan(16)
    expect(result.horizontal.p95).toBeLessThan(16)
  })

  it('sorts by a number column and by a text column', async () => {
    const result = await page.json(on(`
      const a = api('big'), out = {}
      out.numberFirst = timed(() => { a.setSort([{ key: 'score', direction: 'asc' }]); layout('big') })
      out.lowest = texts('big', 4).slice(0, 3)
      out.numberAgain = timed(() => { a.setSort([{ key: 'score', direction: 'desc' }]); layout('big') })
      out.highest = texts('big', 4).slice(0, 3)
      out.textFirst = timed(() => { a.setSort([{ key: 'email', direction: 'asc' }]); layout('big') })
      out.emails = texts('big', 2).slice(0, 2)
      out.textAgain = timed(() => { a.setSort([{ key: 'email', direction: 'desc' }]); layout('big') })
      out.fewFirst = timed(() => { a.setSort([{ key: 'city', direction: 'asc' }]); layout('big') })
      out.cities = texts('big', 7).slice(0, 2)
      out.two = timed(() => { a.setSort([{ key: 'city', direction: 'asc' }, { key: 'age', direction: 'desc' }]); layout('big') })
      out.ages = texts('big', 3).slice(0, 2)
      a.setSort([])
      return out
    `))
    numbers['sort by number: first, again (ms)'] = [+result.numberFirst.toFixed(1), +result.numberAgain.toFixed(1)]
    numbers['sort by text, 100,000 distinct: first, again (ms)'] = [+result.textFirst.toFixed(1), +result.textAgain.toFixed(1)]
    numbers['sort by text, 10 distinct (ms)'] = +result.fewFirst.toFixed(1)
    numbers['sort by two columns (ms)'] = +result.two.toFixed(1)

    const lowest = result.lowest.map(Number)
    const highest = result.highest.map(Number)
    expect(lowest[0]).toBeLessThanOrEqual(lowest[1])
    expect(lowest[1]).toBeLessThanOrEqual(lowest[2])
    expect(highest[0]).toBeGreaterThanOrEqual(highest[1])
    expect(highest[0]).toBeGreaterThan(lowest[0])
    expect(result.emails[0] < result.emails[1]).toBe(true)
    expect(result.emails[0]).toMatch(/^ada\./)
    expect(result.cities).toEqual(['Berlin', 'Berlin'])
    expect(result.ages).toEqual(['77', '77'])
    expect(result.numberFirst).toBeLessThan(1500)
    expect(result.textFirst).toBeLessThan(4000)
    expect(result.textAgain).toBeLessThan(1500)
  })

  it('filters, and filters again faster', async () => {
    const result = await page.json(on(`
      const a = api('big'), out = {}
      out.first = timed(() => { a.setFilter('lovelace'); layout('big') })
      out.count = view('big').model.count
      out.status = status('big')
      out.again = timed(() => { a.setFilter('turing osaka'); layout('big') })
      out.second = view('big').model.count
      out.names = texts('big', 1).slice(0, 3)
      out.cleared = timed(() => { a.setFilter(''); layout('big') })
      out.expected = [window.bigRows.filter(r => r.name.includes('Lovelace')).length, window.bigRows.filter(r => r.name.includes('Turing') && r.city === 'Osaka').length]
      return out
    `))
    numbers['filter: first, again, cleared (ms)'] = [+result.first.toFixed(1), +result.again.toFixed(1), +result.cleared.toFixed(1)]

    expect(result.count).toBe(result.expected[0])
    expect(result.second).toBe(result.expected[1])
    expect(result.count).toBeGreaterThan(1000)
    expect(result.status).toBe(`${new Intl.NumberFormat('en-US').format(result.count)} of 100,000 rows`)
    for (const name of result.names)
      expect(name).toContain('Turing')
    expect(result.first).toBeLessThan(3000)
    expect(result.again).toBeLessThan(500)
  })

  it('resizes a column, selects everything and exports the lot', async () => {
    const result = await page.json(on(`
      const out = {}, steps = []
      const handle = head('big', 1).querySelector('.stx-dg-resize'), c = centre(handle)
      pointer(handle, 'pointerdown', c.x, c.y)
      for (let i = 1; i <= 40; i++) steps.push(timed(() => { pointer(handle, 'pointermove', c.x + i * 3, c.y); layout('big') }))
      pointer(handle, 'pointerup', c.x + 120, c.y)
      out.resize = stats(steps)
      const g = grid('big'); g.focus()
      out.selectAll = timed(() => { press(g, 'a', { metaKey: true }); layout('big') })
      out.selected = api('big').getSelection().indices.length
      api('big').clearSelection()
      let csv = ''
      out.csv = timed(() => { csv = api('big').exportCsv() })
      out.csvLines = csv.split('\\r\\n').length
      out.csvBytes = csv.length
      out.csvHead = csv.slice(0, csv.indexOf('\\r\\n'))
      let json = ''
      out.json = timed(() => { json = api('big').exportJson() })
      out.jsonRows = JSON.parse(json).length
      return out
    `))
    numbers['column resize step (ms)'] = result.resize
    numbers['select all (ms)'] = +result.selectAll.toFixed(1)
    numbers['CSV export of 100,000 rows (ms, MB)'] = [+result.csv.toFixed(1), +(result.csvBytes / 1e6).toFixed(1)]
    numbers['JSON export of 100,000 rows (ms)'] = +result.json.toFixed(1)

    expect(result.selected).toBe(100000)
    expect(result.csvLines).toBe(100002)
    expect(result.csvHead).toBe('id,name,email,age,score,active,created,city,balance,visits,tags,note')
    expect(result.jsonRows).toBe(100000)
    expect(result.resize.p95).toBeLessThan(16)
    expect(result.csv).toBeLessThan(3000)
  })

  it('takes the same rows through a bound prop, which costs more', async () => {
    const result = await page.json(on(`
      const stringify = timed(() => JSON.stringify(window.bigRows))
      const start = performance.now()
      probe.boundRows.set(window.bigRows)
      const sync = performance.now() - start
      const done = () => grid('bound').getAttribute('aria-rowcount') === '100001'
      return new Promise((resolve) => {
        const check = () => {
          if (done()) return resolve({ sync, stringify, total: performance.now() - start, attribute: (grid('bound').closest('[data-stx-scope]').getAttribute('rows') || '').length })
          if (performance.now() - start > 20000) return resolve({ sync, stringify, total: -1, attribute: -1 })
          setTimeout(check, 0)
        }
        check()
      })
    `))
    numbers['bound :rows, 100,000 rows: synchronous, until drawn (ms)'] = [+result.sync.toFixed(1), +result.total.toFixed(1)]
    numbers['JSON.stringify of the same rows, alone (ms)'] = +result.stringify.toFixed(1)
    numbers['bound :rows, text written to the DOM attribute (MB)'] = +(result.attribute / 1e6).toFixed(1)

    expect(result.total).toBeGreaterThan(0)
    expect(await page.run(on(`return status('bound')`))).toBe('100,000 rows')
    expect(await page.errors()).toEqual([])
  })

  afterAll(() => {
    console.log(`\nDataGrid, 100,000 rows x 12 columns, ${page?.apple ? 'WebKit' : 'Chrome'} (headless):`)
    for (const [name, value] of Object.entries(numbers))
      console.log(`  ${name}: ${JSON.stringify(value)}`)
  })
})
