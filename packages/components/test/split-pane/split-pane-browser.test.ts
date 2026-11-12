/**
 * <SplitPane> in a real browser: where the panes actually are after a drag, a
 * key, a reload with a stored layout, and a container that changes size.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { EVENTS, openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

const HELPERS = `
  ${EVENTS}
  const split = id => document.getElementById(id)
  const panes = id => Array.from(split(id).querySelectorAll(':scope > [data-split-pane]'))
  const seps = id => Array.from(split(id).querySelectorAll(':scope > [data-split-separator]'))
  const widths = id => panes(id).map(p => Math.round(p.getBoundingClientRect().width))
  const heights = id => panes(id).map(p => Math.round(p.getBoundingClientRect().height))
  const drag = (sep, dx, dy) => { const c = centre(sep); pointer(sep, 'pointerdown', c.x, c.y); pointer(sep, 'pointermove', c.x + dx, c.y + dy); pointer(sep, 'pointerup', c.x + dx, c.y + dy) }
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'split-pane-browser',
    width: 1000,
    height: 900,
    ready: `document.querySelectorAll('[data-split-ready]').length === 4`,
    body: `
<script client>
localStorage.setItem('stx:split-pane:kept', '[0.25,0.75]')
const events = { resize: [], end: [] }
const shares = state([1, 1, 2])
window.probe = { events, shares }
</script>
<div id="box" style="width: 801px; height: 200px">
  <SplitPane id="two" sizes="30,70" minSize="100" @resize="events.resize.push($event)" @resize-end="events.end.push($event)">
    <div>left</div>
    <div>right</div>
  </SplitPane>
</div>
<div style="width: 802px; height: 200px">
  <SplitPane id="three" :sizes="shares()" minSize="100">
    <div>a</div>
    <div data-min-size="200">b</div>
    <div>c</div>
  </SplitPane>
</div>
<div style="width: 400px; height: 301px">
  <SplitPane id="stacked" direction="vertical" label="Resize editor and output">
    <div data-size="2">top</div>
    <div data-size="1">bottom</div>
  </SplitPane>
</div>
<div style="width: 801px; height: 100px">
  <SplitPane id="kept" storageKey="kept" sizes="50,50">
    <div>one</div>
    <div>two</div>
  </SplitPane>
</div>`,
  })
}, 60_000)

afterAll(() => page?.close())

describe('what is drawn', () => {
  it('raises no script errors', async () => {
    expect(await page.errors()).toEqual([])
  })

  it('lays the panes out in their shares, with a separator between each pair', async () => {
    const drawn = await page.json(on(`return { two: widths('two'), three: widths('three'), stacked: heights('stacked'), seps: [seps('two').length, seps('three').length, seps('stacked').length] }`))

    expect(drawn.two).toEqual([240, 560])
    expect(drawn.three).toEqual([200, 200, 400])
    expect(drawn.stacked).toEqual([200, 100])
    expect(drawn.seps).toEqual([1, 2, 1])
  })

  it('describes each separator to assistive technology', async () => {
    const info = await page.json(on(`
      const read = s => ({ role: s.getAttribute('role'), tab: s.tabIndex, orientation: s.getAttribute('aria-orientation'), label: s.getAttribute('aria-label'), now: s.getAttribute('aria-valuenow'), min: s.getAttribute('aria-valuemin'), max: s.getAttribute('aria-valuemax'), controls: Boolean(document.getElementById(s.getAttribute('aria-controls'))) })
      return { two: read(seps('two')[0]), stacked: read(seps('stacked')[0]), three: seps('three').map(s => s.getAttribute('aria-label')) }
    `))

    expect(info.two).toEqual({ role: 'separator', tab: 0, orientation: 'vertical', label: 'Resize panes', now: '30', min: '13', max: '88', controls: true })
    expect(info.stacked.orientation).toBe('horizontal')
    expect(info.stacked.label).toBe('Resize editor and output')
    expect(info.three).toEqual(['Resize panes 1 and 2', 'Resize panes 2 and 3'])
  })
})

describe('resizing', () => {
  it('follows a drag, and says so', async () => {
    const result = await page.json(on(`
      drag(seps('two')[0], 100, 0)
      return { widths: widths('two'), resize: probe.events.resize.length, end: probe.events.end.slice(-1)[0] }
    `))

    expect(result.widths).toEqual([340, 460])
    expect(result.resize).toBeGreaterThan(0)
    expect(result.end.source).toBe('pointer')
    expect(result.end.index).toBe(0)
    expect(result.end.pixels).toEqual([340, 460])
    expect(result.end.sizes[0]).toBeCloseTo(0.425)
  })

  it('stops a drag at a minimum', async () => {
    expect(await page.json(on(`drag(seps('two')[0], -700, 0); return widths('two')`))).toEqual([100, 700])
    expect(await page.json(on(`drag(seps('two')[0], 900, 0); return widths('two')`))).toEqual([700, 100])
  })

  it('goes back to the starting layout on a double click', async () => {
    expect(await page.json(on(`seps('two')[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); return widths('two')`))).toEqual([240, 560])
  })

  it('moves with the arrow keys, further with shift, and to the ends with Home and End', async () => {
    const result = await page.json(on(`
      const s = seps('two')[0], out = {}
      const handled = !press(s, 'ArrowRight'); out.right = widths('two')
      press(s, 'ArrowLeft', { shiftKey: true }); out.shiftLeft = widths('two')
      press(s, 'Home'); out.home = widths('two')
      press(s, 'End'); out.end = widths('two')
      press(s, 'Enter'); out.enter = widths('two')
      out.handled = handled; out.ignored = press(s, 'a')
      return out
    `))

    expect(result.right).toEqual([256, 544])
    expect(result.shiftLeft).toEqual([176, 624])
    expect(result.home).toEqual([100, 700])
    expect(result.end).toEqual([700, 100])
    expect(result.enter).toEqual([240, 560])
    expect(result.handled).toBe(true)
    expect(result.ignored).toBe(true)
  })

  it('uses the up and down arrows when the panes are stacked', async () => {
    const result = await page.json(on(`
      const s = seps('stacked')[0]
      const sideways = press(s, 'ArrowRight')
      press(s, 'ArrowDown')
      return { sideways, heights: heights('stacked') }
    `))

    expect(result.sideways).toBe(true)
    expect(result.heights).toEqual([216, 84])
  })

  it('pushes through a pane at its own minimum', async () => {
    // a 200 | b 200 (minimum 200) | c 400. The first divider cannot shrink b.
    expect(await page.json(on(`drag(seps('three')[0], 150, 0); return widths('three')`))).toEqual([350, 200, 250])
  })

  it('takes a new layout from its sizes prop', async () => {
    const widths = await page.json(on(`probe.shares.set([1, 1, 1]); return new Promise(done => setTimeout(() => done(widths('three')), 60))`))

    expect(widths).toEqual([267, 267, 267])
  })

  it('keeps the proportions when the container changes size', async () => {
    const widths = await page.json(on(`
      document.getElementById('box').style.width = '401px'
      return new Promise(done => setTimeout(() => done(widths('two')), 80))
    `))

    expect(widths).toEqual([120, 280])
  })

  it('holds a minimum when the container shrinks under the layout', async () => {
    const widths = await page.json(on(`
      document.getElementById('box').style.width = '301px'
      return new Promise(done => setTimeout(() => done(widths('two')), 80))
    `))

    expect(widths).toEqual([100, 200])
  })
})

describe('a kept layout', () => {
  it('starts from what was stored, not from the sizes prop', async () => {
    expect(await page.json(on(`return widths('kept')`))).toEqual([200, 600])
  })

  it('stores a resize under its key', async () => {
    const stored = await page.json(on(`drag(seps('kept')[0], 200, 0); return JSON.parse(localStorage.getItem('stx:split-pane:kept'))`))

    expect(stored).toEqual([0.5, 0.5])
  })

  it('exposes the layout to the page', async () => {
    const result = await page.json(on(`
      const api = split("kept").closest("[data-stx-scope]").__stx_exposed
      api.setSizes([3, 1])
      const set = widths('kept')
      api.reset()
      return { set, reset: widths('kept'), sizes: api.getSizes() }
    `))

    expect(result.set).toEqual([600, 200])
    expect(result.reset).toEqual([400, 400])
    expect(result.sizes).toEqual([0.5, 0.5])
  })
})
