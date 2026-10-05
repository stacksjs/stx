/**
 * A false :if in a :for row builds nothing.
 *
 * A row is a clone of the loop's template, so a conditional element in it was
 * created for every row and then parked off-document while false. In WebKit a
 * <video> or <audio> sets up a media player as it is created: a message list
 * with one media slot per attachment took 1.8s to render instead of 18ms.
 *
 * The loop now moves each conditional element of its template into an inert
 * <template> before cloning rows, and <template :if> clones its content only
 * when the condition holds. Asserted here: nothing is parked for a false
 * branch, the branch appears with live bindings when it turns true, and goes
 * again when it turns false. Chains stay as they were.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

async function render(scopeVars: Record<string, unknown>, innerHtml: string) {
  window.stx._scopes = { test: scopeVars }
  document.body.innerHTML = `<section data-stx-scope="test">${innerHtml}</section>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await new Promise(r => setTimeout(r, 50))
}

const tick = () => new Promise(r => setTimeout(r, 50))

describe('a conditional element inside a :for row', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('is not built or parked while its condition is false', async () => {
    const items = window.stx.state([{ id: 1 }, { id: 2 }, { id: 3 }])
    await render({ items, playing: window.stx.state(false) }, `<ul><li :for="item in items()" :key="item.id"><b>row {{ item.id }}</b><em :if="playing()">media {{ item.id }}</em></li></ul>`)

    const rows = Array.from(document.querySelectorAll('li'))
    expect(rows).toHaveLength(3)
    expect(document.querySelectorAll('em')).toHaveLength(0)
    // The old path built each row's <em> and parked it on the row.
    for (const row of rows as any[])
      expect(row.__stx_detached_if ? row.__stx_detached_if.size : 0).toBe(0)
  })

  it('constructs the element only once its condition holds', async () => {
    // A custom element counts its constructions: the DOM constructs one on
    // clone and on insertion into the document, as a browser does (and as a
    // <video> sets up its media player).
    let constructed = 0
    class XMedia extends window.HTMLElement {
      constructor() {
        super()
        constructed++
      }
    }
    if (!window.customElements.get('x-media'))
      window.customElements.define('x-media', XMedia)

    const items = window.stx.state([{ id: 1 }, { id: 2 }, { id: 3 }])
    const playing = window.stx.state(false)
    constructed = 0
    await render({ items, playing }, `<ul><li :for="item in items()" :key="item.id">row<x-media :if="playing()"></x-media></li></ul>`)
    // Parsing the page's own markup builds the one in the loop's source;
    // nothing else does while the condition is false.
    const fromSource = constructed
    expect(fromSource).toBe(1)

    items.set([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
    await tick()
    expect(constructed).toBe(fromSource)

    playing.set(true)
    await tick()
    expect(document.querySelectorAll('x-media')).toHaveLength(4)
    expect(constructed - fromSource).toBe(4)
  })

  it('appears in every row, bound, when the condition turns true, and goes when it turns false', async () => {
    const items = window.stx.state([{ id: 1 }, { id: 2 }])
    const playing = window.stx.state(false)
    await render({ items, playing }, `<ul><li :for="item in items()" :key="item.id"><em :if="playing()">media {{ item.id }}</em></li></ul>`)

    playing.set(true)
    await tick()
    expect(Array.from(document.querySelectorAll('em')).map((e: any) => e.textContent.trim())).toEqual(['media 1', 'media 2'])

    playing.set(false)
    await tick()
    expect(document.querySelectorAll('em')).toHaveLength(0)
  })

  it('evaluates a per-row condition against that row', async () => {
    const items = window.stx.state([{ id: 1, video: true }, { id: 2, video: false }, { id: 3, video: true }])
    await render({ items }, `<ul><li :for="item in items()" :key="item.id"><em :if="item.video">video {{ item.id }}</em></li></ul>`)
    expect(Array.from(document.querySelectorAll('em')).map((e: any) => e.textContent.trim())).toEqual(['video 1', 'video 3'])
  })

  it('leaves an if/else chain in a row working', async () => {
    const items = window.stx.state([{ id: 1, on: true }, { id: 2, on: false }])
    await render({ items }, `<ul><li :for="item in items()" :key="item.id"><em :if="item.on">on</em><i :else>off</i></li></ul>`)
    expect(Array.from(document.querySelectorAll('li')).map((li: any) => li.textContent.trim())).toEqual(['on', 'off'])
  })
})
