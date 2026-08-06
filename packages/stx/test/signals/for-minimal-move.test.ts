/**
 * A row that has not moved is not touched (stacksjs/stx#1882).
 *
 * The keyed-reuse path round-tripped EVERY surviving row through a
 * DocumentFragment on each re-diff:
 *
 *     const fragment = document.createDocumentFragment()
 *     liveNodes.forEach(groupNode => fragment.appendChild(groupNode))
 *     parent.insertBefore(fragment, placeholder)
 *
 * `appendChild` into a fragment detaches the node from the document first, and
 * removing a focused node blurs it and resets `activeElement`. So a list could
 * not contain a field the user was typing in — any write to the backing array
 * kicked them out of it, losing caret, selection and undo history. It ran for
 * every row unconditionally, including rows that had not moved, and unkeyed
 * loops took the same path because `getItemKey` falls back to the index.
 *
 * ## What these tests can and cannot show
 *
 * happy-dom does not emulate blur-on-detach, so the FOCUS LOSS itself is not
 * observable here — asserting on `activeElement` would pass against the broken
 * runtime and prove nothing. What is observable is the mechanism that causes
 * it, so that is what is pinned: no fragment is created, and an unchanged list
 * performs zero DOM insertions. Those are the properties the fix actually
 * guarantees; the focus behaviour follows from the DOM spec.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

let seq = 0

/** Mount a keyed list and return handles for driving it. */
async function mountList(initial: Array<{ id: number, label: string }>) {
  const items = window.stx.state(initial)
  const setupName = `__stx_setup_minmove_${++seq}`
  window[setupName] = () => ({ items })

  document.body.innerHTML = `
    <main data-stx="${setupName}">
      <ul id="list"><li :for="row in items" :key="row.id" data-row>{{ row.label }}</li></ul>
    </main>
  `
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await new Promise(resolve => setTimeout(resolve, 30))

  return { items, list: document.querySelector('#list') }
}

const rows = () => [...document.querySelectorAll('[data-row]')]
const labels = () => rows().map((n: any) => n.textContent.trim())
const settle = () => new Promise(resolve => setTimeout(resolve, 30))

/** Count DOM insertions and fragment creations across an update. */
function instrument(list: any) {
  const realInsert = list.insertBefore.bind(list)
  const realFragment = document.createDocumentFragment.bind(document)
  const counts = { inserts: 0, fragments: 0 }

  list.insertBefore = (node: any, ref: any) => {
    counts.inserts++
    return realInsert(node, ref)
  }
  document.createDocumentFragment = () => {
    counts.fragments++
    return realFragment()
  }

  return {
    counts,
    restore() {
      delete list.insertBefore
      document.createDocumentFragment = realFragment
    },
  }
}

describe('x-for keyed reuse is minimal-move (#1882)', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('does no DOM work when the order is unchanged', async () => {
    // The case that matters. Typing in a list edits the backing array, which
    // re-diffs every row — and every row used to be detached and reattached.
    const { items, list } = await mountList([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
      { id: 3, label: 'c' },
    ])

    const spy = instrument(list)
    items.set([
      { id: 1, label: 'a2' },
      { id: 2, label: 'b2' },
      { id: 3, label: 'c2' },
    ])
    await settle()
    spy.restore()

    expect(spy.counts.inserts).toBe(0)
    expect(spy.counts.fragments).toBe(0)
    // The rows must still have picked up the new data — zero DOM work is only
    // correct if the bindings updated in place.
    expect(labels()).toEqual(['a2', 'b2', 'c2'])
  })

  it('never builds a fragment, even when rows do move', async () => {
    const { items, list } = await mountList([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ])

    const spy = instrument(list)
    items.set([
      { id: 2, label: 'b' },
      { id: 1, label: 'a' },
    ])
    await settle()
    spy.restore()

    expect(spy.counts.fragments).toBe(0)
    expect(labels()).toEqual(['b', 'a'])
  })

  it('moves only the rows that actually changed position', async () => {
    // Swapping the two ends of a three-row list needs one move, not three.
    const { items, list } = await mountList([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
      { id: 3, label: 'c' },
    ])

    const spy = instrument(list)
    items.set([
      { id: 3, label: 'c' },
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ])
    await settle()
    spy.restore()

    expect(labels()).toEqual(['c', 'a', 'b'])
    expect(spy.counts.inserts).toBe(1)
  })

  it('preserves node identity across an update', async () => {
    // Control: reuse itself was never broken, and must stay working — a fix
    // that recreated rows would also "not detach" them, vacuously.
    const { items } = await mountList([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ])
    const before = rows()

    items.set([
      { id: 1, label: 'a2' },
      { id: 2, label: 'b2' },
    ])
    await settle()

    const after = rows()
    expect(after[0]).toBe(before[0])
    expect(after[1]).toBe(before[1])
  })

  it('keeps a live element inside a reused row attached throughout', async () => {
    // The closest observable proxy for the focus guarantee: the node the user
    // would be typing into never leaves the document.
    const { items } = await mountList([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ])
    const target = rows()[0]
    expect(target.isConnected).toBe(true)

    items.set([
      { id: 1, label: 'a2' },
      { id: 2, label: 'b2' },
    ])
    await settle()

    expect(target.isConnected).toBe(true)
    expect(rows()[0]).toBe(target)
  })
})

describe('x-for reconciliation stays correct (#1882)', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('inserts a new row in the middle at the right place', async () => {
    const { items } = await mountList([
      { id: 1, label: 'a' },
      { id: 3, label: 'c' },
    ])

    items.set([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
      { id: 3, label: 'c' },
    ])
    await settle()

    expect(labels()).toEqual(['a', 'b', 'c'])
  })

  it('prepends a new row', async () => {
    const { items } = await mountList([{ id: 2, label: 'b' }])
    items.set([{ id: 1, label: 'a' }, { id: 2, label: 'b' }])
    await settle()
    expect(labels()).toEqual(['a', 'b'])
  })

  it('removes a row from the middle', async () => {
    const { items } = await mountList([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
      { id: 3, label: 'c' },
    ])

    items.set([{ id: 1, label: 'a' }, { id: 3, label: 'c' }])
    await settle()

    expect(labels()).toEqual(['a', 'c'])
  })

  it('reverses a list', async () => {
    const { items } = await mountList([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
      { id: 3, label: 'c' },
    ])

    items.set([
      { id: 3, label: 'c' },
      { id: 2, label: 'b' },
      { id: 1, label: 'a' },
    ])
    await settle()

    expect(labels()).toEqual(['c', 'b', 'a'])
  })

  it('handles a wholesale replacement', async () => {
    const { items } = await mountList([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ])

    items.set([{ id: 8, label: 'x' }, { id: 9, label: 'y' }])
    await settle()

    expect(labels()).toEqual(['x', 'y'])
  })

  it('empties the list', async () => {
    const { items } = await mountList([{ id: 1, label: 'a' }])
    items.set([])
    await settle()
    expect(labels()).toEqual([])
  })
})
