/**
 * <JsonTree> in a real browser: how many rows are actually drawn for a tree of
 * five thousand, what a key does, where a cycle leads, and what each of those
 * costs with layout included.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { EVENTS, openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

const HELPERS = `
  ${EVENTS}
  const tree = id => document.getElementById(id)
  const api = id => tree(id).closest('[data-stx-scope]').__stx_exposed
  const scroller = id => tree(id).querySelector('[data-jt="scroller"]')
  const drawn = id => Array.from(tree(id).querySelectorAll('[role="treeitem"]')).filter(r => r.style.display !== 'none').sort((a, b) => Number(a.dataset.jtIndex) - Number(b.dataset.jtIndex))
  const text = row => row.querySelector('.stx-jt-label').textContent + (row.querySelector('.stx-jt-separator').style.display === 'none' ? '' : ': ') + row.querySelector('.stx-jt-preview').textContent
  const lines = id => drawn(id).map(text)
  const active = id => { const el = document.getElementById(scroller(id).getAttribute('aria-activedescendant')); return el ? text(el) : null }
  const key = (id, name, extra) => press(scroller(id), name, extra)
  const rowOf = (id, label) => drawn(id).find(r => r.querySelector('.stx-jt-label').textContent === label)
  const stats = list => { const s = list.slice().sort((a, b) => a - b); return { mean: s.reduce((a, b) => a + b, 0) / s.length, median: s[Math.floor(s.length / 2)], p95: s[Math.floor(s.length * 0.95)], max: s[s.length - 1] } }
  // Five rows per record: the record, id, name, tags and the one tag.
  const records = count => ({ kind: 'array', id: 'root', preview: 'Array(' + count + ')', children: Array.from({ length: count }, (_, i) => ({ kind: 'object', label: String(i), preview: '{id, name, tags}', children: [
    { kind: 'number', label: 'id', value: i },
    { kind: 'string', label: 'name', value: 'record ' + i },
    { kind: 'array', label: 'tags', children: [{ kind: 'string', label: '0', value: 'tag' }] },
  ] })) })
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'json-tree-browser',
    width: 900,
    height: 1000,
    ready: `document.querySelectorAll('[data-jt-ready]').length === 4`,
    body: `
<script client>
const user = { kind: 'object', id: 'user', preview: '{name, tags, address, bio}', openable: 'graph', children: [
  { kind: 'string', label: 'name', value: 'Ada' },
  { kind: 'array', label: 'tags', id: 'tags', openable: ['table', 'chart'], children: [{ kind: 'string', label: '0', value: 'a' }, { kind: 'string', label: '1', value: 'b' }], more: 40 },
  { kind: 'object', label: 'address', id: 'address', children: [{ kind: 'string', label: 'city', value: 'London' }, { kind: 'string', label: 'post code', value: 'N1' }, { kind: 'ref', label: 'owner', ref: 'user' }] },
  { kind: 'string', label: 'bio', value: 'braces {' + '{ 1 + 1 }} and <b>markup</b>' },
  { kind: 'html', label: 'mail', value: '<p>Hi</p>', preview: 'mail (9 characters)', openable: 'preview' },
] }
const small = state(user)
const depth = state(1)
const result = state({ t: 'object', id: 1, entries: [
  ['user', { t: 'model', id: 2, model: 'User', key: { t: 'number', v: 7 }, attributes: [['id', { t: 'number', v: 7 }], ['email', { t: 'string', v: 'ada@example.com' }]], hidden: ['password'] }],
  ['self', { t: 'ref', id: 1 }],
  ['failed', { t: 'error', name: 'TypeError', message: 'nope' }],
] })
const events = { select: [], toggle: [], copy: [], open: [], more: [], context: [] }
const onlyTables = (node, path) => (node.kind === 'array' ? 'table' : null)
window.probe = { small, depth, result, events }
</script>
<div style="width: 600px; padding: 8px">
  <JsonTree id="small" label="User" height="300px" :value="small()" :depth="depth()"
    @select="events.select.push($event)" @toggle="events.toggle.push($event)" @copy="events.copy.push($event)"
    @open="events.open.push($event)" @load-more="events.more.push($event)" @context="events.context.push($event)" />
</div>
<div style="width: 600px; padding: 8px">
  <JsonTree id="tinker" height="200px" depth="2" :tinker="result()" :openable="onlyTables" contextMenu />
</div>
<div style="width: 600px; padding: 8px">
  <JsonTree id="big" height="400px" rowHeight="20" />
</div>
<div style="width: 600px; padding: 8px">
  <JsonTree id="empty" height="60px" />
</div>`,
  })
}, 60_000)

afterAll(() => page?.close())

describe('what is drawn', () => {
  it('raises no script errors', async () => {
    expect(await page.errors()).toEqual([])
  })

  it('opens the root and shows its children closed', async () => {
    expect(await page.json(on(`return lines('small')`))).toEqual([
      '{name, tags, address, bio}',
      'name: "Ada"',
      'tags: Array(42)',
      'address: {3}',
      'bio: "braces {{ 1 + 1 }} and <b>markup</b>"',
      'mail: mail (9 characters)',
    ])
  })

  it('shows a value holding braces or markup as the text it is', async () => {
    const bio = await page.json(on(`const row = rowOf('small', 'bio'); return { html: row.querySelector('.stx-jt-preview').innerHTML, tags: row.querySelectorAll('b').length }`))

    expect(bio.html).toContain('{{ 1 + 1 }}')
    expect(bio.html).toContain('&lt;b&gt;')
    expect(bio.tags).toBe(0)
  })

  it('is a tree to assistive technology', async () => {
    const info = await page.json(on(`
      const s = scroller('small'), rows = drawn('small')
      const read = r => ({ role: r.getAttribute('role'), level: r.getAttribute('aria-level'), expanded: r.getAttribute('aria-expanded'), pos: r.getAttribute('aria-posinset'), size: r.getAttribute('aria-setsize'), selected: r.getAttribute('aria-selected'), id: Boolean(r.id) })
      return { role: s.getAttribute('role'), label: s.getAttribute('aria-label'), tab: s.tabIndex, root: read(rows[0]), leaf: read(rows[1]), closed: read(rows[2]), between: [s.firstElementChild.getAttribute('role'), s.firstElementChild.firstElementChild.getAttribute('role')], status: tree('small').querySelector('[role="status"]').getAttribute('aria-live') }
    `))

    expect(info.role).toBe('tree')
    expect(info.label).toBe('User')
    expect(info.tab).toBe(0)
    expect(info.root).toEqual({ role: 'treeitem', level: '1', expanded: 'true', pos: '1', size: '1', selected: 'false', id: true })
    expect(info.leaf).toEqual({ role: 'treeitem', level: '2', expanded: null, pos: '1', size: '5', selected: 'false', id: true })
    expect(info.closed.expanded).toBe('false')
    expect(info.between).toEqual(['none', 'none'])
    expect(info.status).toBe('polite')
  })

  it('colours a value by its kind, and indents by depth', async () => {
    const style = await page.json(on(`
      const colour = label => getComputedStyle(rowOf('small', label).querySelector('.stx-jt-preview')).color
      const left = label => parseFloat(getComputedStyle(rowOf('small', label)).paddingLeft)
      return { string: colour('name'), container: colour('tags'), key: getComputedStyle(rowOf('small', 'name').querySelector('.stx-jt-label')).color, root: parseFloat(getComputedStyle(drawn('small')[0]).paddingLeft), child: left('name'), height: drawn('small')[0].getBoundingClientRect().height }
    `))

    expect(style.string).not.toBe(style.container)
    expect(style.key).not.toBe(style.container)
    expect(style.child - style.root).toBe(14)
    expect(style.height).toBe(22)
  })

  it('draws nothing for no value', async () => {
    expect(await page.json(on(`return { rows: drawn('empty').length, height: tree('empty').querySelector('[data-jt="content"]').style.height }`))).toEqual({ rows: 0, height: '0px' })
  })
})

describe('the keyboard', () => {
  it('puts the cursor on the first row when the tree takes focus', async () => {
    // A headless window never has the system's focus, so the element becomes
    // the active one without the engine sending the event. Send it.
    const result = await page.json(on(`
      scroller('small').focus()
      if (active('small') === null) scroller('small').dispatchEvent(new FocusEvent('focus'))
      return { active: active('small'), focused: document.activeElement === scroller('small'), selected: probe.events.select.slice(-1)[0].pathText }
    `))

    expect(result).toEqual({ active: '{name, tags, address, bio}', focused: true, selected: '$' })
  })

  it('moves with the arrows, Home and End', async () => {
    const result = await page.json(on(`
      const out = {}
      const handled = !key('small', 'ArrowDown'); out.down = active('small')
      key('small', 'ArrowDown'); out.down2 = active('small')
      key('small', 'End'); out.end = active('small')
      key('small', 'ArrowDown'); out.stays = active('small')
      key('small', 'Home'); out.home = active('small')
      out.handled = handled
      out.marked = drawn('small').filter(r => r.getAttribute('aria-selected') === 'true').length
      return out
    `))

    expect(result).toEqual({ down: 'name: "Ada"', down2: 'tags: Array(42)', end: 'mail: mail (9 characters)', stays: 'mail: mail (9 characters)', home: '{name, tags, address, bio}', handled: true, marked: 1 })
  })

  it('opens with right, steps in, and closes with left', async () => {
    const result = await page.json(on(`
      const out = {}
      probe.events.toggle.length = 0
      key('small', 'ArrowDown'); key('small', 'ArrowDown')
      key('small', 'ArrowRight'); out.opened = lines('small')
      key('small', 'ArrowRight'); out.inside = active('small')
      key('small', 'ArrowLeft'); out.parent = active('small')
      key('small', 'ArrowLeft'); out.closed = lines('small').length
      out.toggles = probe.events.toggle.map(t => [t.pathText, t.expanded])
      return out
    `))

    expect(result.opened.slice(2, 6)).toEqual(['tags: Array(42)', '0: "a"', '1: "b"', '… 40 more'])
    expect(result.inside).toBe('0: "a"')
    expect(result.parent).toBe('tags: Array(42)')
    expect(result.closed).toBe(6)
    expect(result.toggles).toEqual([['$.tags', true], ['$.tags', false]])
  })

  it('toggles with Enter and Space, and opens every sibling with star', async () => {
    const result = await page.json(on(`
      const out = {}
      key('small', 'Enter'); out.enter = lines('small').length
      key('small', ' '); out.space = lines('small').length
      key('small', '*'); out.star = lines('small')
      key('small', 'Home'); key('small', 'ArrowDown'); key('small', 'ArrowDown'); key('small', 'ArrowLeft')
      key('small', 'ArrowDown'); key('small', 'ArrowLeft')
      out.after = lines('small').length
      return out
    `))

    expect(result.enter).toBe(9)
    expect(result.space).toBe(6)
    expect(result.star).toContain('city: "London"')
    expect(result.star).toContain('0: "a"')
    expect(result.after).toBe(6)
  })

  it('jumps to a label as it is typed', async () => {
    const result = await page.json(on(`
      const out = {}
      key('small', 'Home')
      key('small', 'a'); out.a = active('small')
      return new Promise(done => setTimeout(() => {
        key('small', 'b'); out.b = active('small')
        key('small', 'i'); out.bi = active('small')
        done(out)
      }, 700))
    `))

    expect(result).toEqual({ a: 'address: {3}', b: 'bio: "braces {{ 1 + 1 }} and <b>markup</b>"', bi: 'bio: "braces {{ 1 + 1 }} and <b>markup</b>"' })
  })

  it('copies the value, and with shift the path', async () => {
    const result = await page.json(on(`
      probe.events.copy.length = 0
      key('small', 'Home'); key('small', 'ArrowDown'); key('small', 'ArrowDown'); key('small', 'ArrowDown')
      const handled = !key('small', 'c', { metaKey: true })
      key('small', 'C', { ctrlKey: true, shiftKey: true })
      key('small', 'ArrowRight'); key('small', 'ArrowDown'); key('small', 'ArrowDown')
      key('small', 'c', { metaKey: true, shiftKey: true })
      key('small', 'ArrowLeft'); key('small', 'ArrowLeft')
      return { handled, copies: probe.events.copy.map(c => [c.what, c.text]), said: tree('small').querySelector('[role="status"]').textContent }
    `))

    expect(result.handled).toBe(true)
    expect(result.copies).toEqual([
      ['value', '{\n  "city": "London",\n  "post code": "N1",\n  "owner": "[Circular]"\n}'],
      ['path', '$.address'],
      ['path', '$.address["post code"]'],
    ])
    expect(result.said).toBe('Copied path $.address["post code"]')
  })

  it('opens the first place a node can go with shift and Enter', async () => {
    const opened = await page.json(on(`
      probe.events.open.length = 0
      key('small', 'Home'); key('small', 'Enter', { shiftKey: true })
      key('small', 'ArrowDown'); key('small', 'Enter', { shiftKey: true })
      key('small', 'ArrowDown'); key('small', 'Enter', { shiftKey: true })
      key('small', 'Home'); key('small', 'ArrowRight')
      return probe.events.open.map(o => [o.pathText, o.as])
    `))

    expect(opened).toEqual([['$', 'graph'], ['$.tags', 'table']])
  })

  it('leaves keys that are not its own alone', async () => {
    expect(await page.json(on(`return [key('small', 'Tab'), key('small', 'a', { metaKey: true }), key('small', 'F5')]`))).toEqual([true, true, true])
  })
})

describe('the pointer', () => {
  it('toggles a container on a click and moves the cursor there', async () => {
    const result = await page.json(on(`
      const out = {}
      rowOf('small', 'address').click(); out.open = lines('small')
      out.active = active('small')
      rowOf('small', 'address').click(); out.closed = lines('small').length
      rowOf('small', 'name').click(); out.leaf = [lines('small').length, active('small')]
      return out
    `))

    expect(result.open).toContain('post code: "N1"')
    expect(result.active).toBe('address: {3}')
    expect(result.closed).toBe(6)
    expect(result.leaf).toEqual([6, 'name: "Ada"'])
  })

  it('offers a button for each place a node can be opened, and two to copy', async () => {
    const result = await page.json(on(`
      probe.events.open.length = 0; probe.events.copy.length = 0
      const buttons = row => Array.from(row.querySelectorAll('button')).map(b => [b.textContent, b.getAttribute('aria-label'), b.tabIndex, b.type])
      const out = { tags: buttons(rowOf('small', 'tags')), name: buttons(rowOf('small', 'name')), hidden: getComputedStyle(rowOf('small', 'bio').querySelector('.stx-jt-actions')).display }
      const before = lines('small').length
      rowOf('small', 'tags').querySelector('[data-jt-as="chart"]').click()
      rowOf('small', 'mail').querySelector('[data-jt-as="preview"]').click()
      rowOf('small', 'name').querySelector('[data-jt-action="copy-value"]').click()
      rowOf('small', 'name').querySelector('[data-jt-action="copy-path"]').click()
      out.shown = getComputedStyle(rowOf('small', 'name').querySelector('.stx-jt-actions')).display
      out.untoggled = lines('small').length === before
      out.opens = probe.events.open.map(o => [o.pathText, o.as, o.node.kind])
      out.copies = probe.events.copy.map(c => [c.what, c.text])
      return out
    `))

    expect(result.tags).toEqual([['Table', 'Open as table', -1, 'button'], ['chart', 'Open as chart', -1, 'button'], ['Copy', 'Copy value', -1, 'button'], ['Path', 'Copy path', -1, 'button']])
    expect(result.name).toEqual([['Copy', 'Copy value', -1, 'button'], ['Path', 'Copy path', -1, 'button']])
    expect(result.hidden).toBe('none')
    expect(result.shown).not.toBe('none')
    expect(result.untoggled).toBe(true)
    expect(result.opens).toEqual([['$.tags', 'chart', 'array'], ['$.mail', 'preview', 'html']])
    expect(result.copies).toEqual([['value', '"Ada"'], ['path', '$.name']])
  })

  it('opens a leaf on a double click', async () => {
    const opened = await page.json(on(`
      probe.events.open.length = 0
      rowOf('small', 'mail').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
      rowOf('small', 'name').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
      return probe.events.open.map(o => o.as)
    `))

    expect(opened).toEqual(['preview'])
  })

  it('reports a context click with the row and where it happened', async () => {
    const result = await page.json(on(`
      probe.events.context.length = 0
      const c = centre(rowOf('small', 'bio'))
      const allowed = mouse(rowOf('small', 'bio'), 'contextmenu', c.x, c.y)
      const row = drawn('tinker')[1], d = centre(row)
      const suppressed = !mouse(row, 'contextmenu', d.x, d.y)
      const e = probe.events.context[0]
      return { allowed, suppressed, path: e.pathText, kind: e.node.kind, x: e.x === c.x, y: e.y === c.y, active: active('small') }
    `))

    // The browser's own menu is only kept away when the host says it has one.
    expect(result).toEqual({ allowed: true, suppressed: true, path: '$.bio', kind: 'string', x: true, y: true, active: 'bio: "braces {{ 1 + 1 }} and <b>markup</b>"' })
  })
})

describe('children that were not sent', () => {
  it('are asked for through their row, and drawn when they arrive', async () => {
    const result = await page.json(on(`
      probe.events.more.length = 0
      const out = {}
      rowOf('small', 'tags').click()
      const more = drawn('small').find(r => r.dataset.kind === 'more')
      out.button = more.querySelector('button').textContent
      more.click()
      out.asked = probe.events.more.map(m => [m.id, m.pathText, m.node.more])
      out.added = api('small').appendChildren('tags', [{ kind: 'string', label: '2', value: 'c' }], 39)
      out.partial = lines('small').slice(2, 7)
      api('small').appendChildren('tags', [{ kind: 'string', label: '3', value: 'd' }])
      out.done = lines('small').slice(2, 7)
      rowOf('small', 'tags').click()
      return out
    `))

    expect(result.button).toBe('Load')
    expect(result.asked).toEqual([['tags', '$.tags', 40]])
    expect(result.added).toBe(true)
    expect(result.partial).toEqual(['tags: Array(42)', '0: "a"', '1: "b"', '2: "c"', '… 39 more'])
    expect(result.done).toEqual(['tags: Array(4)', '0: "a"', '1: "b"', '2: "c"', '3: "d"'])
  })
})

describe('a cycle', () => {
  it('leads back to the node it points at', async () => {
    const result = await page.json(on(`
      const out = {}
      rowOf('small', 'address').click()
      const owner = rowOf('small', 'owner')
      out.shown = text(owner); out.expandable = owner.getAttribute('aria-expanded')
      owner.click()
      out.active = active('small')
      rowOf('small', 'address').click()
      return out
    `))

    expect(result).toEqual({ shown: 'owner: [Circular]', expandable: null, active: '{name, tags, address, bio}' })
  })
})

describe('a tinker result', () => {
  it('is adapted and opened to the depth asked for', async () => {
    expect(await page.json(on(`return lines('tinker')`))).toEqual([
      '{user, self, failed}',
      'user: User #7',
      'id: 7',
      'email: "ada@example.com"',
      '[hidden]: password',
      'self: [Circular]',
      'failed: TypeError: nope',
      'message: "nope"',
    ])
  })

  it('takes where a node opens from the function it is given', async () => {
    const buttons = await page.json(on(`return drawn('tinker').slice(0, 2).map(r => Array.from(r.querySelectorAll('[data-jt-action="open"]')).map(b => b.textContent))`))

    // The adapter would offer a graph for both; the host's function says no.
    expect(buttons).toEqual([[], []])
  })

  it('follows a new result, and a reference inside it', async () => {
    const result = await page.json(on(`
      probe.result.set({ t: 'array', id: 1, length: 2, items: [{ t: 'object', id: 2, entries: [['n', { t: 'number', v: 1 }], ['up', { t: 'ref', id: 1 }]] }, { t: 'string', v: 'x' }] })
      return new Promise(done => setTimeout(() => {
        const out = { lines: lines('tinker'), table: drawn('tinker')[0].querySelector('[data-jt-action="open"]').textContent }
        rowOf('tinker', 'up').click()
        out.active = active('tinker')
        done(out)
      }, 60))
    `))

    expect(result.lines).toEqual(['Array(2)', '0: {n, up}', 'n: 1', 'up: [Circular]', '1: "x"'])
    expect(result.table).toBe('Table')
    expect(result.active).toBe('Array(2)')
  })
})

describe('props that change', () => {
  it('reopens to a new depth', async () => {
    const result = await page.json(on(`
      probe.depth.set(0)
      return new Promise(done => setTimeout(() => {
        const closed = lines('small')
        probe.depth.set(2)
        setTimeout(() => done({ closed, open: lines('small').length }), 60)
      }, 60))
    `))

    expect(result.closed).toEqual(['{name, tags, address, bio}'])
    expect(result.open).toBe(13)
  })

  it('shows a new value', async () => {
    const result = await page.json(on(`
      probe.depth.set(1)
      probe.small.set([{ kind: 'number', label: 'a', value: 1 }, { kind: 'array', label: 'b', children: [{ kind: 'null', value: null }] }])
      return new Promise(done => setTimeout(() => done({ lines: lines('small'), selected: api('small').getSelected() }), 60))
    `))

    expect(result.lines).toEqual(['a: 1', 'b: Array(1)', '0: null'])
    expect(result.selected).toBeNull()
  })

  it('exposes the tree to the page', async () => {
    const result = await page.json(on(`
      const a = api('small'), out = {}
      a.collapseAll(); out.collapsed = lines('small')
      a.expandAll(); out.expanded = lines('small').length
      out.select = a.select('1'); out.selected = a.getSelected().pathText
      out.collapse = a.collapse('1'); out.expand = a.expand('1')
      out.model = a.tree().model.rows.length
      a.focus(); out.focused = document.activeElement === scroller('small')
      return out
    `))

    expect(result).toEqual({ collapsed: ['a: 1', 'b: Array(1)'], expanded: 3, select: true, selected: '$[1]', collapse: true, expand: true, model: 3, focused: true })
  })
})

describe('five thousand nodes', () => {
  it('draws the rows on screen and no others', async () => {
    const result = await page.json(on(`
      const node = records(1000)
      let t = performance.now()
      api('big').setValue(node)
      scroller('big').getBoundingClientRect()
      const mount = performance.now() - t
      t = performance.now()
      api('big').expandAll()
      scroller('big').getBoundingClientRect()
      const expand = performance.now() - t
      window.timings = { mount, expand }
      return { rows: api('big').tree().model.rows.length, drawn: drawn('big').length, elements: tree('big').querySelectorAll('[role="treeitem"]').length, height: tree('big').querySelector('[data-jt="content"]').style.height, first: lines('big').slice(0, 5), mount, expand }
    `))

    expect(result.rows).toBe(5001)
    // 400px of 20px rows is 20 on screen, plus the overscan at one end.
    expect(result.drawn).toBeGreaterThanOrEqual(20)
    expect(result.drawn).toBeLessThan(40)
    expect(result.elements).toBeLessThan(60)
    expect(result.height).toBe('100020px')
    expect(result.first).toEqual(['Array(1000)', '0: {id, name, tags}', 'id: 0', 'name: "record 0"', 'tags: Array(1)'])
    expect(result.mount).toBeLessThan(250)
    expect(result.expand).toBeLessThan(250)
  })

  it('keeps the cursor on screen through a hundred and fifty arrow keys', async () => {
    const result = await page.json(on(`
      scroller('big').focus()
      key('big', 'Home')
      const times = []
      for (let step = 0; step < 150; step++) {
        const t = performance.now()
        key('big', 'ArrowDown')
        scroller('big').getBoundingClientRect()
        times.push(performance.now() - t)
      }
      const el = document.getElementById(scroller('big').getAttribute('aria-activedescendant'))
      const box = el.getBoundingClientRect(), view = scroller('big').getBoundingClientRect()
      window.timings.arrow = stats(times)
      return { active: active('big'), index: el.dataset.jtIndex, inside: box.top >= view.top - 1 && box.bottom <= view.bottom + 1, top: scroller('big').scrollTop, drawn: drawn('big').length, arrow: stats(times) }
    `))

    expect(result.active).toBe('0: "tag"')
    expect(result.index).toBe('150')
    expect(result.inside).toBe(true)
    expect(result.top).toBe(151 * 20 - 400)
    expect(result.drawn).toBeLessThan(40)
    expect(result.arrow.p95).toBeLessThan(16)
  })

  it('repaints a scroll inside a frame', async () => {
    const result = await page.json(on(`
      const s = scroller('big'), times = []
      for (let step = 1; step <= 100; step++) {
        s.scrollTop = step * 730
        const t = performance.now()
        s.dispatchEvent(new Event('scroll'))
        s.getBoundingClientRect()
        times.push(performance.now() - t)
      }
      const rows = drawn('big'), view = s.getBoundingClientRect()
      const indexes = rows.map(r => Number(r.dataset.jtIndex))
      const first = rows[0].getBoundingClientRect()
      window.timings.scroll = stats(times)
      return { top: s.scrollTop, from: indexes[0], to: indexes[indexes.length - 1], drawn: rows.length, contiguous: indexes.every((value, i) => i === 0 || value === indexes[i - 1] + 1), placed: Math.round(first.top - view.top + s.scrollTop) === indexes[0] * 20, scroll: stats(times), elements: tree('big').querySelectorAll('[role="treeitem"]').length }
    `))

    expect(result.top).toBe(73000)
    expect(result.from).toBe(3650 - 6)
    expect(result.to).toBe(3650 + 20 + 6 - 1)
    expect(result.contiguous).toBe(true)
    expect(result.placed).toBe(true)
    expect(result.elements).toBeLessThan(60)
    expect(result.scroll.p95).toBeLessThan(16)
  })

  it('jumps to the end and back', async () => {
    const result = await page.json(on(`
      const out = {}
      let t = performance.now(); key('big', 'End'); scroller('big').getBoundingClientRect(); out.endMs = performance.now() - t
      out.end = active('big')
      t = performance.now(); api('big').collapseAll(); scroller('big').getBoundingClientRect(); out.collapseMs = performance.now() - t
      out.collapsed = lines('big')
      window.timings.end = out.endMs; window.timings.collapse = out.collapseMs
      return out
    `))

    expect(result.end).toBe('0: "tag"')
    expect(result.collapsed).toEqual(['Array(1000)'])
    expect(result.endMs).toBeLessThan(50)
  })

  it('reports what it measured', async () => {
    // What binding the same tree with :value costs on top: stx writes a bound
    // object onto the element as JSON, whatever the component then does with it.
    const bound = await page.json(on(`
      const node = records(1000)
      const t = performance.now()
      let size = 0
      for (let round = 0; round < 10; round++) size = JSON.stringify(node).length
      return { ms: (performance.now() - t) / 10, size }
    `))
    const timings = await page.json(`return window.timings`)
    const ms = (value: number): string => `${value.toFixed(2)} ms`

    // eslint-disable-next-line no-console
    console.log(`JsonTree, 5,001 rows (${page.apple ? 'WebKit' : 'Chrome'}, headless, layout forced):
  set value (1,001 rows)   ${ms(timings.mount)}
  expand all (5,001 rows)  ${ms(timings.expand)}
  collapse all             ${ms(timings.collapse)}
  arrow key                mean ${ms(timings.arrow.mean)}, median ${ms(timings.arrow.median)}, p95 ${ms(timings.arrow.p95)}, max ${ms(timings.arrow.max)}
  scroll repaint (730px)   mean ${ms(timings.scroll.mean)}, median ${ms(timings.scroll.median)}, p95 ${ms(timings.scroll.p95)}, max ${ms(timings.scroll.max)}
  End key                  ${ms(timings.end)}
  JSON of the tree, as a bound prop writes it: ${ms(bound.ms)}, ${Math.round(bound.size / 1024)} KB`)
    expect(timings.arrow.median).toBeGreaterThanOrEqual(0)
  })

  it('still raises no script errors', async () => {
    expect(await page.errors()).toEqual([])
  })
})
