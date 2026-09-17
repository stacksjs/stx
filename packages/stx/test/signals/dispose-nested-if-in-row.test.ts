/**
 * A single-element `:if` nested inside a `:for` row disposes the effects of
 * its deferred hydration when the row is removed (stacksjs/stx#1954).
 *
 * When a single-element `:if` becomes visible, `bindIf` hydrates the element
 * and its children in a `setTimeout`, after the row's own `processElement`
 * pass has returned. By then `activeDisposers` is null, so the bindings created
 * in that deferred pass are registered with no tracker at all: not the page
 * root's, and not any tracker a row might get. Removing the row removes the
 * nodes, but those bindings stay subscribed to every signal they read and keep
 * re-running on each later change. Every shrink of the list leaves the removed
 * rows' branch bindings behind, so the work per update grows with each cycle.
 *
 * The DOM stays correct throughout, so the leak is only visible as work. That
 * is what these tests measure: how many times the binding INSIDE the nested
 * `:if` evaluates on ONE write to a signal it reads, compared with how many of
 * those bindings are actually in the DOM.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const CYCLES = 6
const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const ONE = [0]

let seq = 0

// Longer than the setTimeout(0) the nested :if uses to hydrate its subtree, so
// every count below is taken after the deferred bindings exist.
const settle = () => new Promise(resolve => setTimeout(resolve, 30))
const rows = () => document.querySelectorAll('#rows [data-row]').length
const rendered = () => document.querySelectorAll('#rows [data-probe]').length

/** Mount a keyed list whose rows each carry a nested single-element :if. */
async function mountList() {
  const items = window.stx.state([...ALL])
  const shown = window.stx.state(true)
  const tick = window.stx.state(0)
  const counter = { evaluations: 0 }

  // The binding inside the nested :if. It reads tick, so every tick write
  // re-runs each live copy of it exactly once.
  const probe = (i: number) => {
    counter.evaluations++
    return tick() >= 0 ? `hit hit-${i}` : 'hit'
  }

  const setupName = `__stx_setup_dispose_nested_if_in_row_${++seq}`
  window[setupName] = () => ({ items, shown, tick, probe })

  // The :if sits on a CHILD of the row, not on the row itself, and has no
  // else sibling, so it takes the single-element bindIf path with deferred
  // hydration. The probe is on a child of the conditional element.
  document.body.innerHTML = `
    <main data-stx="${setupName}">
      <ul id="rows">
        <li :for="i in items" :key="i" data-row>
          <div :if="shown" data-branch>
            <b data-probe x-class="probe(i)">x</b>
          </div>
        </li>
      </ul>
    </main>
  `
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()

  /** Write tick once and return how many branch binding evaluations it caused. */
  async function evaluationsForOneUpdate() {
    const before = counter.evaluations
    tick.set(tick() + 1)
    await settle()
    return counter.evaluations - before
  }

  async function shrink() {
    items.set([...ONE])
    await settle()
  }

  async function grow() {
    items.set([...ALL])
    await settle()
  }

  return { evaluationsForOneUpdate, shrink, grow, shown, items }
}

/**
 * Harness check before any cycle: every row is rendered, its nested branch is
 * hydrated, and one update runs each branch binding exactly once. A harness
 * that failed to bind (or counted before the deferred hydration ran) would
 * read 0 here and fail, rather than pass the leak checks below.
 */
async function expectBoundBeforeCycles(list: Awaited<ReturnType<typeof mountList>>) {
  expect(rows()).toBe(ALL.length)
  expect(rendered()).toBe(ALL.length)
  const probes = [...document.querySelectorAll('#rows [data-probe]')]
  expect(probes.every((p: any) => p.classList.contains('hit'))).toBe(true)
  expect(await list.evaluationsForOneUpdate()).toBe(ALL.length)
}

describe('nested :if inside a :for row disposes deferred branch effects (#1954)', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it(`runs one branch binding per rendered row after ${CYCLES} shrink/grow cycles`, async () => {
    const list = await mountList()
    await expectBoundBeforeCycles(list)

    // Count after every shrink so a failure shows the growth cycle by cycle.
    const observed: number[] = []
    const expected: number[] = []
    for (let c = 0; c < CYCLES; c++) {
      await list.shrink()
      expect(rows()).toBe(ONE.length)
      expected.push(rendered())
      observed.push(await list.evaluationsForOneUpdate())
      await list.grow()
      expect(rows()).toBe(ALL.length)
    }
    await list.shrink()

    // One row is rendered, so one update must run one branch binding. Every
    // removed row's branch binding that is still subscribed adds one more.
    expect(rows()).toBe(ONE.length)
    expect(rendered()).toBe(ONE.length)
    expect(observed).toEqual(expected)
    expect(await list.evaluationsForOneUpdate()).toBe(rendered())
  })

  it(`runs exactly ${ALL.length} branch bindings with ${ALL.length} rows after ${CYCLES} shrink/grow cycles`, async () => {
    const list = await mountList()
    await expectBoundBeforeCycles(list)

    for (let c = 0; c < CYCLES; c++) {
      await list.shrink()
      await list.grow()
    }

    // Every row is rendered again, each with one live branch binding. The
    // bindings of the rows removed on each shrink must not still be running.
    expect(rows()).toBe(ALL.length)
    expect(rendered()).toBe(ALL.length)
    expect(await list.evaluationsForOneUpdate()).toBe(rendered())
  })
  it('disposes a nested :if that was HIDDEN when its row was removed', async () => {
    // A hidden single-element :if is detached from its row, so walking the
    // removed row's DOM cannot reach it; the runtime records it on the parent.
    const list = await mountList()
    await expectBoundBeforeCycles(list)
    for (let cycle = 0; cycle < CYCLES; cycle++) {
      list.shown.set(false)
      await settle()
      await list.shrink()
      list.shown.set(true)
      await settle()
      expect(rendered()).toBe(ONE.length)
      expect(await list.evaluationsForOneUpdate()).toBe(ONE.length)
      await list.grow()
    }
    expect(rendered()).toBe(ALL.length)
    expect(await list.evaluationsForOneUpdate()).toBe(ALL.length)
  })

  it('does not hydrate a nested :if whose row was removed before its deferred pass ran', async () => {
    const list = await mountList()
    await expectBoundBeforeCycles(list)
    await list.shrink()
    for (let cycle = 0; cycle < CYCLES; cycle++) {
      // Same task: the new rows schedule their deferred pass, then leave.
      list.items.set([...ALL])
      list.items.set([...ONE])
      await settle()
      expect(rendered()).toBe(ONE.length)
      expect(await list.evaluationsForOneUpdate()).toBe(ONE.length)
    }
    await list.grow()
    expect(rendered()).toBe(ALL.length)
    expect(await list.evaluationsForOneUpdate()).toBe(ALL.length)
  })

  it('still binds a nested :if hidden and re-shown before its deferred pass ran', async () => {
    // The skipped pass must be rescheduled on the next show, not lost.
    const list = await mountList()
    await expectBoundBeforeCycles(list)
    await list.shrink()
    list.items.set([...ALL])
    list.shown.set(false)
    await settle()
    list.shown.set(true)
    await settle()
    expect(rendered()).toBe(ALL.length)
    expect(document.querySelectorAll('#rows [data-probe].hit').length).toBe(ALL.length)
    expect(await list.evaluationsForOneUpdate()).toBe(ALL.length)
  })
})
