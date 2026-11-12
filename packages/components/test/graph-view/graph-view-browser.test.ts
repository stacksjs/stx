/**
 * <GraphView> in a real browser: what is drawn, where a click, a drag, a wheel
 * and a key land, and what two hundred nodes cost.
 */
import type { GraphEdge, GraphNode } from '../../src/ui/graph-view/core'
import type { BrowserPage } from '../support/browser-page'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import { seededRandom } from '../../src/ui/graph-view/core'
import { EVENTS, openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

/** Two hundred nodes: a tree, plus a hundred more edges, some closing cycles. */
function bigGraph(): { nodes: GraphNode[], edges: GraphEdge[] } {
  const random = seededRandom(11)
  const nodes = Array.from({ length: 200 }, (_, index) => ({ id: `n${index}`, label: `Node ${index}` }))
  const edges: GraphEdge[] = []
  for (let index = 1; index < 200; index++)
    edges.push({ source: `n${Math.floor(random() * index)}`, target: `n${index}` })
  for (let index = 0; index < 101; index++) {
    const a = Math.floor(random() * 200)
    const b = Math.floor(random() * 200)
    if (a !== b)
      edges.push({ id: `x${index}`, source: `n${a}`, target: `n${b}`, label: index % 4 === 0 ? 'ref' : undefined })
  }
  return { nodes, edges }
}

const BIG = bigGraph()

const HELPERS = `
  ${EVENTS}
  const root = id => document.getElementById(id)
  const api = id => root(id).closest('[data-stx-scope]').__stx_exposed
  const canvas = id => api(id).canvas()
  const surface = id => root(id).querySelector('[data-gv="surface"]')
  const node = (id, name) => root(id).querySelector('.stx-gv-node[data-node="' + name + '"]')
  const edge = (id, name) => root(id).querySelector('.stx-gv-edge[data-edge="' + name + '"]')
  const names = id => Array.from(root(id).querySelectorAll('.stx-gv-node')).map(n => n.getAttribute('data-node'))
  const box = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) } }
  const click = el => { const c = centre(el); pointer(el, 'pointerdown', c.x, c.y); pointer(el, 'pointerup', c.x, c.y) }
  const key = (id, name, extra) => !press(surface(id), name, extra)
  const status = id => root(id).querySelector('[data-gv="status"]').textContent
  const stats = list => { const s = list.slice().sort((a, b) => a - b); return { median: s[Math.floor(s.length / 2)], p95: s[Math.floor(s.length * 0.95)], max: s[s.length - 1] } }
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'graph-view-browser',
    width: 1100,
    height: 1300,
    ready: `document.querySelectorAll('[data-gv-ready]').length === 3 && document.querySelectorAll('#big .stx-gv-node').length === 200`,
    context: { bigNodes: BIG.nodes, bigEdges: BIG.edges },
    body: `
<script client>
const modelNodes = [
  { id: 'User', label: 'User', kind: 'model', detail: 'users', expandable: true },
  { id: 'Post', label: 'Post', kind: 'model' },
  { id: 'Team', label: 'Team', kind: 'model' },
  { id: 'Comment', label: 'Comment', kind: 'model', expandable: false },
  { id: 'Tag', label: '{' + '{ 1 + 1 }}', kind: 'model' },
]
const modelEdges = [
  { source: 'User', target: 'Post', label: 'hasMany' },
  { source: 'Post', target: 'User', label: 'belongsTo' },
  { source: 'User', target: 'Team', label: 'belongsTo' },
  { source: 'Post', target: 'Comment', label: 'hasMany' },
  { source: 'Post', target: 'Tag', label: 'belongsToMany', directed: false },
  { source: 'Team', target: 'Team', label: 'parent' },
]
const events = { select: [], expand: [], open: [], move: [], viewport: [], context: [], layout: [] }
const smallNodes = state([{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }])
const smallEdges = state([{ source: 'a', target: 'b' }])
const picked = state('')
const bigNodes = {{ bigNodes }}
const bigEdges = {{ bigEdges }}
window.probe = { events, smallNodes, smallEdges, picked, bigNodes, bigEdges }
</script>
<div style="width: 800px; padding: 8px">
  <GraphView id="models" label="Model relations" height="400px" animate="false" contextMenu :nodes="modelNodes" :edges="modelEdges"
    @select="events.select.push($event)" @expand="events.expand.push($event)" @open="events.open.push($event)" @move="events.move.push($event)"
    @viewport="events.viewport.push($event)" @context="events.context.push($event)" @layout="events.layout.push($event)" />
</div>
<div style="width: 500px; padding: 8px">
  <GraphView id="small" height="240px" animate="false" toolbar="false" direction="TB" :nodes="smallNodes()" :edges="smallEdges()" :selected="picked()" />
</div>
<div style="width: 1000px; padding: 8px">
  <GraphView id="big" height="560px" animate="false" :nodes="bigNodes" :edges="bigEdges" />
</div>`,
  })
}, 60_000)

afterAll(() => page?.close())

describe('what is drawn', () => {
  it('raises no script errors', async () => {
    expect(await page.errors()).toEqual([])
  })

  it('draws every node and edge into one SVG', async () => {
    const drawn = await page.json(on(`
      return {
        nodes: names('models'),
        edges: root('models').querySelectorAll('.stx-gv-edge').length,
        labels: Array.from(root('models').querySelectorAll('.stx-gv-edge-label text')).map(t => t.textContent),
        arrows: Array.from(root('models').querySelectorAll('.stx-gv-edge path')).filter(p => p.getAttribute('marker-end')).length,
        stage: root('models').querySelector('.stx-gv-stage').getAttribute('transform'),
        detail: node('models', 'User').querySelector('.stx-gv-node-detail').textContent,
        mark: node('models', 'User').querySelector('.stx-gv-node-mark').textContent,
        kind: node('models', 'User').getAttribute('data-kind'),
      }
    `))

    expect(drawn.nodes).toEqual(['User', 'Post', 'Team', 'Comment', 'Tag'])
    expect(drawn.edges).toBe(6)
    expect(drawn.labels).toEqual(['hasMany', 'belongsTo', 'belongsTo', 'hasMany', 'belongsToMany', 'parent'])
    // The many-to-many edge is undirected: no arrowhead.
    expect(drawn.arrows).toBe(5)
    expect(drawn.stage).toMatch(/^translate\(.+\) scale\(1\)$/)
    expect(drawn.detail).toBe('users')
    expect(drawn.mark).toBe('+')
    expect(drawn.kind).toBe('model')
  })

  it('writes a label as text, braces and all', async () => {
    expect(await page.run(on(`return node('models', 'Tag').querySelector('.stx-gv-node-label').textContent`))).toBe('{{ 1 + 1 }}')
  })

  it('lays the models out left to right along their relations, inside the view', async () => {
    const at = await page.json(on(`
      const s = box(surface('models'))
      return { user: box(node('models', 'User')), post: box(node('models', 'Post')), comment: box(node('models', 'Comment')), s, all: names('models').map(n => box(node('models', n))) }
    `))

    expect(at.user.x).toBeLessThan(at.post.x)
    expect(at.post.x).toBeLessThan(at.comment.x)
    for (const one of at.all) {
      expect(Math.abs(one.x - at.s.x)).toBeLessThan(at.s.w / 2)
      expect(Math.abs(one.y - at.s.y)).toBeLessThan(at.s.h / 2)
    }
  })

  it('stacks the layers when the direction is top to bottom', async () => {
    const at = await page.json(on(`return { a: box(node('small', 'a')), b: box(node('small', 'b')), path: edge('small', 'a->b').querySelector('path').getAttribute('d') }`))

    expect(at.a.y).toBeLessThan(at.b.y)
    expect(at.a.x).toBe(at.b.x)
    expect(at.path).toContain(' C ')
  })

  it('describes itself to assistive technology', async () => {
    const info = await page.json(on(`
      const s = surface('models'), bar = root('models').querySelector('[role="toolbar"]')
      return {
        role: s.getAttribute('role'), description: s.getAttribute('aria-roledescription'), label: s.getAttribute('aria-label'), tab: s.tabIndex,
        describedBy: document.getElementById(s.getAttribute('aria-describedby')).getAttribute('role'),
        node: node('models', 'User').getAttribute('aria-label'), loop: node('models', 'Team').getAttribute('aria-label'),
        bar: bar.getAttribute('aria-label'), buttons: Array.from(bar.querySelectorAll('button')).map(b => b.getAttribute('aria-label') || b.textContent.trim()),
        pressed: Array.from(bar.querySelectorAll('[data-gv-layout]')).map(b => b.getAttribute('aria-pressed')),
        noBar: root('small').querySelector('[role="toolbar"]'),
      }
    `))

    expect(info.role).toBe('application')
    expect(info.description).toBe('graph')
    expect(info.label).toBe('Model relations')
    expect(info.tab).toBe(0)
    expect(info.describedBy).toBe('status')
    expect(info.node).toBe('User, 2 connections')
    expect(info.loop).toBe('Team, 1 connection')
    expect(info.bar).toBe('Model relations controls')
    expect(info.buttons).toEqual(['Zoom out', 'Zoom in', 'Fit', 'Layered', 'Force'])
    expect(info.pressed).toEqual(['true', 'false'])
    expect(info.noBar).toBeNull()
  })
})

describe('selecting', () => {
  it('selects a node on a click, lights what it touches and dims the rest', async () => {
    const result = await page.json(on(`
      click(node('models', 'User'))
      const opacity = el => getComputedStyle(el).opacity
      // The dimming fades in; read it once it has.
      return new Promise(done => setTimeout(() => done({
        selected: node('models', 'User').hasAttribute('data-selected'),
        neighbours: names('models').filter(n => node('models', n).hasAttribute('data-neighbour')),
        active: Array.from(root('models').querySelectorAll('.stx-gv-edge[data-active]')).map(e => e.getAttribute('data-edge')),
        dim: [opacity(node('models', 'Comment')), opacity(node('models', 'Post')), opacity(edge('models', 'Post->Comment:hasMany'))],
        marker: edge('models', 'User->Post:hasMany').querySelector('path').getAttribute('marker-end'),
        event: probe.events.select.slice(-1)[0],
        active_descendant: surface('models').getAttribute('aria-activedescendant') === node('models', 'User').id,
        status: status('models'),
        focused: document.activeElement === surface('models'),
      }), 220))
    `))

    expect(result.selected).toBe(true)
    expect(result.neighbours).toEqual(['Post', 'Team'])
    expect(result.active).toEqual(['User->Post:hasMany', 'Post->User:belongsTo', 'User->Team:belongsTo'])
    expect(Number(result.dim[0])).toBeLessThan(0.5)
    expect(result.dim[1]).toBe('1')
    expect(Number(result.dim[2])).toBeLessThan(0.5)
    expect(result.marker).toContain('arrow-active')
    expect(result.event.node.id).toBe('User')
    expect(result.event.neighbours.map((n: GraphNode) => n.id)).toEqual(['Post', 'Team'])
    expect(result.active_descendant).toBe(true)
    expect(result.status).toBe('User, 2 connections: Post, Team')
    expect(result.focused).toBe(true)
  })

  it('clears the selection on a click on the background', async () => {
    const result = await page.json(on(`
      const s = surface('models'), r = s.getBoundingClientRect()
      pointer(s, 'pointerdown', r.left + 6, r.top + 6); pointer(s, 'pointerup', r.left + 6, r.top + 6)
      return { any: root('models').hasAttribute('data-has-selection'), event: probe.events.select.slice(-1)[0], active: surface('models').hasAttribute('aria-activedescendant') }
    `))

    expect(result.any).toBe(false)
    expect(result.event).toEqual({ node: null, neighbours: [] })
    expect(result.active).toBe(false)
  })

  it('follows its selected prop without echoing an event', async () => {
    const result = await page.json(on(`
      probe.picked.set('b')
      return new Promise(done => setTimeout(() => done({ selected: node('small', 'b').hasAttribute('data-selected'), status: status('small') }), 60))
    `))

    expect(result.selected).toBe(true)
    expect(result.status).toBe('Beta, 1 connection: Alpha')
  })
})

describe('growing the graph', () => {
  it('asks for a node to be expanded on a double click, and opens one that cannot be', async () => {
    const result = await page.json(on(`
      click(node('models', 'User')); click(node('models', 'User'))
      click(node('models', 'Comment')); click(node('models', 'Comment'))
      return { expand: probe.events.expand.map(e => e.node.id), open: probe.events.open.map(e => e.node.id) }
    `))

    expect(result.expand).toEqual(['User'])
    expect(result.open).toEqual(['Comment'])
  })

  it('adds the answer around the node, ignoring what it already has', async () => {
    const result = await page.json(on(`
      const added = api('models').addNeighbours('User',
        [{ id: 'Post' }, { id: 'Order', label: 'Order' }, { id: 'Profile', label: 'Profile' }],
        [{ source: 'User', target: 'Post', label: 'hasMany' }, { source: 'User', target: 'Order', label: 'hasMany' }, { source: 'User', target: 'Profile', label: 'hasOne' }])
      api('models').updateNode('User', { expandable: false })
      return {
        added, nodes: names('models').length, edges: root('models').querySelectorAll('.stx-gv-edge').length,
        status: status('models'), label: node('models', 'User').getAttribute('aria-label'), mark: node('models', 'User').querySelector('.stx-gv-node-mark'),
        order: box(node('models', 'Order')), user: box(node('models', 'User')), count: api('models').graph().nodeCount,
      }
    `))

    expect(result.added).toEqual({ nodes: ['Order', 'Profile'], edges: ['User->Order:hasMany', 'User->Profile:hasOne'] })
    expect(result.nodes).toBe(7)
    expect(result.edges).toBe(8)
    expect(result.count).toBe(7)
    expect(result.status).toBe('2 nodes added to User')
    expect(result.label).toBe('User, 4 connections')
    expect(result.mark).toBeNull()
    expect(result.order.x).toBeGreaterThan(result.user.x)
  })

  it('redraws when its nodes and edges props change', async () => {
    const result = await page.json(on(`
      probe.smallNodes.set([{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }, { id: 'c', label: 'Gamma' }])
      probe.smallEdges.set([{ source: 'a', target: 'b' }, { source: 'a', target: 'c' }])
      return new Promise(done => setTimeout(() => done({ nodes: names('small'), edges: root('small').querySelectorAll('.stx-gv-edge').length }), 80))
    `))

    expect(result.nodes).toEqual(['a', 'b', 'c'])
    expect(result.edges).toBe(2)
  })
})

describe('the keyboard', () => {
  it('walks the nodes with the arrow keys and says where it landed', async () => {
    const result = await page.json(on(`
      api('models').select('User')
      const out = { handled: key('models', 'ArrowRight') }
      out.right = canvas('models').getSelected(); out.status = status('models')
      key('models', 'ArrowRight'); out.again = canvas('models').getSelected()
      key('models', 'ArrowLeft'); out.back = canvas('models').getSelected()
      out.box = [box(node('models', 'User')), box(node('models', out.right))]
      return out
    `))

    expect(result.handled).toBe(true)
    expect(result.right).not.toBe('User')
    expect(result.box[1].x).toBeGreaterThan(result.box[0].x)
    expect(result.status.startsWith(`${result.right}, `)).toBe(true)
    expect(result.back).toBe(result.right)
    expect(result.again).not.toBe(result.right)
  })

  it('starts from the node nearest the middle when nothing is selected', async () => {
    const picked = await page.json(on(`api('models').select(null); key('models', 'ArrowDown'); return canvas('models').getSelected()`))

    expect(typeof picked).toBe('string')
  })

  it('expands with Enter and Space, opens with o, and lets go with Escape', async () => {
    const result = await page.json(on(`
      const before = { expand: probe.events.expand.length, open: probe.events.open.length }
      api('models').select('Post')
      key('models', 'Enter'); key('models', ' '); key('models', 'o')
      const out = { expand: probe.events.expand.slice(before.expand).map(e => e.node.id), open: probe.events.open.slice(before.open).map(e => e.node.id) }
      out.escape = key('models', 'Escape'); out.selected = canvas('models').getSelected(); out.idle = key('models', 'Escape')
      return out
    `))

    expect(result.expand).toEqual(['Post', 'Post'])
    expect(result.open).toEqual(['Post'])
    expect(result.escape).toBe(true)
    expect(result.selected).toBeNull()
    // With nothing selected Escape is not the graph's to take.
    expect(result.idle).toBe(false)
  })

  it('zooms with plus and minus, fits with 0 and centres the node with f', async () => {
    const result = await page.json(on(`
      api('models').fit()
      const k = () => Math.round(api('models').getViewport().k * 1000) / 1000
      const out = { start: k() }
      key('models', '+'); out.plus = k()
      key('models', '-'); key('models', '-'); out.minus = k()
      key('models', '0'); out.fit = k()
      api('models').select('Comment'); key('models', 'f')
      out.node = box(node('models', 'Comment')); out.surface = box(surface('models'))
      out.typed = key('models', 'x'); out.withMod = key('models', '0', { metaKey: true })
      key('models', '0')
      return out
    `))

    expect(result.start).toBe(1)
    expect(result.plus).toBe(1.25)
    expect(result.minus).toBe(0.8)
    expect(result.fit).toBe(1)
    expect(Math.abs(result.node.x - result.surface.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(result.node.y - result.surface.y)).toBeLessThanOrEqual(1)
    expect(result.typed).toBe(false)
    expect(result.withMod).toBe(false)
  })
})

describe('the pointer', () => {
  it('pans when the background is dragged', async () => {
    const result = await page.json(on(`
      api('models').select(null)
      const s = surface('models'), r = s.getBoundingClientRect(), before = api('models').getViewport(), was = box(node('models', 'User'))
      pointer(s, 'pointerdown', r.left + 5, r.top + 5); pointer(s, 'pointermove', r.left + 65, r.top + 35)
      const dragging = root('models').getAttribute('data-dragging')
      pointer(s, 'pointerup', r.left + 65, r.top + 35)
      const after = api('models').getViewport(), now = box(node('models', 'User'))
      return { dx: after.x - before.x, dy: after.y - before.y, k: after.k, moved: [now.x - was.x, now.y - was.y], dragging, left: root('models').hasAttribute('data-dragging'), event: probe.events.viewport.slice(-1)[0], selects: probe.events.select.slice(-1)[0] }
    `))

    expect(result.dx).toBe(60)
    expect(result.dy).toBe(30)
    expect(result.moved).toEqual([60, 30])
    expect(result.dragging).toBe('pan')
    expect(result.left).toBe(false)
    expect(result.event.k).toBe(result.k)
  })

  it('moves a node that is dragged, with its edges, and says where it went', async () => {
    const result = await page.json(on(`
      const n = node('models', 'Team'), c = centre(n), before = canvas('models').getPositions().Team
      const path = edge('models', 'User->Team:belongsTo').querySelector('path'), was = path.getAttribute('d')
      const selects = probe.events.select.length
      pointer(n, 'pointerdown', c.x, c.y); pointer(n, 'pointermove', c.x + 40, c.y + 50); pointer(n, 'pointerup', c.x + 40, c.y + 50)
      const after = canvas('models').getPositions().Team
      return { dx: after.x - before.x, dy: after.y - before.y, redrawn: path.getAttribute('d') !== was, event: probe.events.move.slice(-1)[0], selected: probe.events.select.length - selects, now: box(node('models', 'Team')), then: { x: Math.round(c.x), y: Math.round(c.y) } }
    `))

    expect(result.dx).toBe(40)
    expect(result.dy).toBe(50)
    expect(result.redrawn).toBe(true)
    expect(result.event.node.id).toBe('Team')
    expect(result.event.x).toBeCloseTo(result.event.x)
    // A drag is not a click.
    expect(result.selected).toBe(0)
    expect(result.now.x - result.then.x).toBe(40)
    expect(result.now.y - result.then.y).toBe(50)
  })

  it('pans on a wheel and zooms about the pointer with Control held', async () => {
    const result = await page.json(on(`
      api('models').fit()
      const s = surface('models'), r = s.getBoundingClientRect(), before = api('models').getViewport()
      const wheel = extra => s.dispatchEvent(new WheelEvent('wheel', Object.assign({ bubbles: true, cancelable: true, clientX: r.left + 200, clientY: r.top + 100 }, extra)))
      const taken = !wheel({ deltaX: 30, deltaY: 40 })
      const panned = api('models').getViewport()
      const anchor = { x: (200 - panned.x) / panned.k, y: (100 - panned.y) / panned.k }
      wheel({ deltaY: -50, ctrlKey: true })
      const zoomed = api('models').getViewport()
      const out = { taken, pan: [panned.x - before.x, panned.y - before.y], k: zoomed.k, drift: [anchor.x * zoomed.k + zoomed.x - 200, anchor.y * zoomed.k + zoomed.y - 100] }
      for (let i = 0; i < 80; i++) wheel({ deltaY: -100, ctrlKey: true })
      out.max = api('models').getViewport().k
      for (let i = 0; i < 200; i++) wheel({ deltaY: 100, ctrlKey: true })
      out.min = api('models').getViewport().k
      api('models').fit()
      return out
    `))

    expect(result.taken).toBe(true)
    expect(result.pan).toEqual([-30, -40])
    expect(result.k).toBeCloseTo(Math.exp(0.5))
    expect(Math.abs(result.drift[0])).toBeLessThan(0.001)
    expect(Math.abs(result.drift[1])).toBeLessThan(0.001)
    expect(result.max).toBe(4)
    expect(result.min).toBe(0.1)
  })

  it('reports a right click with the node under it, and keeps the browser menu away', async () => {
    const result = await page.json(on(`
      const n = node('models', 'Post'), c = centre(n)
      const allowed = n.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y }))
      const s = surface('small')
      const plain = s.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }))
      return { allowed, plain, event: probe.events.context.slice(-1)[0], x: Math.round(c.x), selected: canvas('models').getSelected() }
    `))

    expect(result.allowed).toBe(false)
    // Without the contextMenu prop the browser's own menu is left alone.
    expect(result.plain).toBe(true)
    expect(result.event.node.id).toBe('Post')
    expect(Math.round(result.event.x)).toBe(result.x)
    expect(result.selected).toBe('Post')
  })
})

describe('the toolbar', () => {
  it('zooms and fits from its buttons, and shows the zoom', async () => {
    const result = await page.json(on(`
      api('models').fit()
      const bar = root('models').querySelector('[role="toolbar"]'), button = label => Array.from(bar.querySelectorAll('button')).find(b => (b.getAttribute('aria-label') || b.textContent.trim()) === label)
      button('Zoom in').click()
      const k = api('models').getViewport().k
      return new Promise(done => setTimeout(() => {
        const text = bar.querySelector('.stx-gv-zoom').textContent
        button('Zoom out').click(); button('Zoom out').click()
        const low = api('models').getViewport().k
        button('Fit').click()
        done({ k, text, low, fit: api('models').getViewport().k })
      }, 60))
    `))

    expect(result.k).toBe(1.25)
    expect(result.text).toBe('125%')
    expect(result.low).toBeCloseTo(0.8)
    expect(result.fit).toBe(1)
  })

  it('switches layout, and the edges go from curves to straight lines', async () => {
    const result = await page.json(on(`
      const bar = root('models').querySelector('[role="toolbar"]'), path = () => edge('models', 'Post->Comment:hasMany').querySelector('path').getAttribute('d')
      const before = path(), was = canvas('models').getPositions()
      bar.querySelector('[data-gv-layout="force"]').click()
      const during = path(), now = canvas('models').getPositions()
      return new Promise(done => setTimeout(() => {
        const pressed = Array.from(bar.querySelectorAll('[data-gv-layout]')).map(b => b.getAttribute('aria-pressed'))
        bar.querySelector('[data-gv-layout="layered"]').click()
        done({ before, during, pressed, moved: was.User.x !== now.User.x || was.User.y !== now.User.y, events: probe.events.layout.map(e => e.layout), layout: canvas('models').getLayout(), back: path() })
      }, 60))
    `))

    expect(result.before).toContain(' C ')
    expect(result.during).toContain(' L ')
    expect(result.pressed).toEqual(['false', 'true'])
    expect(result.moved).toBe(true)
    expect(result.events).toEqual(['force', 'layered'])
    expect(result.layout).toBe('layered')
    expect(result.back).toContain(' C ')
  })
})

describe('two hundred nodes', () => {
  it('draws them all, fitted into the view', async () => {
    const drawn = await page.json(on(`
      const s = surface('big').getBoundingClientRect(), stage = root('big').querySelector('.stx-gv-stage').getBoundingClientRect()
      return { nodes: names('big').length, edges: root('big').querySelectorAll('.stx-gv-edge').length, count: probe.bigEdges.length, k: api('big').getViewport().k, inside: stage.left >= s.left - 1 && stage.right <= s.right + 1 && stage.top >= s.top - 1 && stage.bottom <= s.bottom + 1 }
    `))

    expect(drawn.nodes).toBe(200)
    expect(drawn.edges).toBe(drawn.count)
    expect(drawn.count).toBeGreaterThan(290)
    expect(drawn.k).toBeLessThan(1)
    expect(drawn.inside).toBe(true)
  })

  it('lays out, draws, pans, zooms and grows inside a frame or two', async () => {
    const measured = await page.json(on(`
      const c = canvas('big'), svg = root('big').querySelector('svg'), out = {}
      const timed = work => { const t = performance.now(); work(); svg.getBoundingClientRect(); return performance.now() - t }

      c.setLayout('force'); out.force = c.timings.layout
      c.setLayout('layered'); out.layered = c.timings.layout
      out.first = timed(() => api('big').setGraph(probe.bigNodes, probe.bigEdges))
      out.firstLayout = c.timings.layout; out.firstRender = c.timings.render

      const pans = [], zooms = []
      // The engine's clock is coarse (a millisecond in WebKit), so each step is
      // timed for its worst case and the run as a whole for its mean.
      let began = performance.now()
      for (let i = 0; i < 100; i++) pans.push(timed(() => c.panBy(i % 2 ? 3 : -3, 2)))
      out.panMean = (performance.now() - began) / 100
      began = performance.now()
      for (let i = 0; i < 100; i++) zooms.push(timed(() => c.zoomBy(i % 2 ? 1.02 : 0.98, { x: 400, y: 250 })))
      out.zoomMean = (performance.now() - began) / 100
      out.pan = stats(pans); out.zoom = stats(zooms)

      const more = Array.from({ length: 10 }, (_, i) => ({ id: 'grown' + i, label: 'Grown ' + i }))
      out.grow = timed(() => c.addNeighbours('n5', more, more.map(n => ({ source: 'n5', target: n.id, label: 'has' }))))
      c.setLayout('force')
      const again = Array.from({ length: 10 }, (_, i) => ({ id: 'forced' + i, label: 'Forced ' + i }))
      out.growForce = timed(() => c.addNeighbours('n9', again, again.map(n => ({ source: 'n9', target: n.id }))))
      out.growForceLayout = c.timings.layout
      out.nodes = names('big').length
      return out
    `))

    const ms = (value: number): string => `${value.toFixed(2)} ms`
    console.log([
      `[graph-view, ${page.apple ? 'WebKit' : 'Chrome'}] 200 nodes, ${BIG.edges.length} edges`,
      `  layered layout ${ms(measured.layered)}, force layout ${ms(measured.force)}`,
      `  first render ${ms(measured.first)} (layout ${ms(measured.firstLayout)}, SVG ${ms(measured.firstRender)})`,
      `  pan step mean ${ms(measured.panMean)}, median ${ms(measured.pan.median)}, p95 ${ms(measured.pan.p95)}`,
      `  zoom step mean ${ms(measured.zoomMean)}, median ${ms(measured.zoom.median)}, p95 ${ms(measured.zoom.p95)}`,
      `  expand by 10: layered ${ms(measured.grow)}, force ${ms(measured.growForce)} (layout ${ms(measured.growForceLayout)})`,
    ].join('\n'))

    expect(measured.nodes).toBe(220)
    expect(measured.layered).toBeLessThan(100)
    expect(measured.force).toBeLessThan(600)
    expect(measured.first).toBeLessThan(500)
    expect(measured.pan.p95).toBeLessThan(16)
    expect(measured.zoom.p95).toBeLessThan(16)
    expect(measured.grow).toBeLessThan(200)
    expect(measured.growForce).toBeLessThan(200)
    expect(await page.errors()).toEqual([])
  })
})
