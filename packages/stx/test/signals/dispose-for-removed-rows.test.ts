/**
 * A `:for` row that leaves the list disposes the effects that bound it
 * (stacksjs/stx#1954, Reproduction 1).
 *
 * New rows are hydrated with a bare `processElement(el, itemScope)`, not
 * wrapped in `trackEffects`, so a row never gets an `__stx_disposers` handle.
 * Every removal path — `removeGroup` from the keyed diff, and
 * `clearRenderedItems` when the list empties — only runs
 * `disposeSubtreeScopes` before `remove()`, which fires scope destroy hooks
 * but never touches effects. The removed row's bindings stay subscribed to
 * every signal they read and keep re-running on each later change.
 *
 * Unkeyed loops are not exempt: `getItemKey` falls back to the index, so a
 * shrinking unkeyed list drops the trailing index keys through the same path.
 *
 * The DOM stays correct throughout, so the leak is only visible as work. These
 * tests measure how many times the row binding evaluates on ONE write to a
 * signal it reads, and compare that with how many rows are actually rendered.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { flushEffects, installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const CYCLES = 5

// Values differ from their indexes, and the shrink keeps a MIDDLE value, so
// the keyed variants reuse row 105 by key while the unkeyed variants reuse
// index 0 and update its item signal. Both then remove the other nine rows.
const FULL = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109]
const ONE = [105]
const EMPTY: number[] = []

interface Variant {
  name: string
  markup: string
}

// Every row carries data-row and a class binding that calls probe(row). The
// binding reads tick, so each tick write re-runs every live copy of it once.
const VARIANTS: Variant[] = [
  {
    name: 'keyed element :for',
    markup: `<li :for="row in items" :key="row" data-row x-class="probe(row)">{{ row }}</li>`,
  },
  {
    name: 'unkeyed element :for',
    markup: `<li :for="row in items" data-row x-class="probe(row)">{{ row }}</li>`,
  },
  {
    name: 'keyed <template :for>',
    markup: `<template :for="row in items" :key="row"><li data-row x-class="probe(row)">{{ row }}</li></template>`,
  },
  {
    name: 'unkeyed <template :for>',
    markup: `<template :for="row in items"><li data-row x-class="probe(row)">{{ row }}</li></template>`,
  },
]

interface Step {
  step: string
  rendered: number
  evaluations: number
}

let seq = 0

const rowNodes = () => [...document.querySelectorAll('#rows [data-row]')]
const rendered = () => rowNodes().length
const labels = () => rowNodes().map((node: any) => Number(node.textContent.trim()))

/** Mount a list whose rows carry a counting binding. */
async function mountList(variant: Variant) {
  const items = window.stx.state(FULL)
  const tick = window.stx.state(0)
  const counter = { evaluations: 0 }

  const probe = (row: number) => {
    counter.evaluations++
    return tick() >= 0 ? `row row-${row}` : 'row'
  }

  const setupName = `__stx_setup_dispose_for_rows_${++seq}`
  window[setupName] = () => ({ items, tick, probe })

  document.body.innerHTML = `
    <main data-stx="${setupName}">
      <ul id="rows">${variant.markup}</ul>
    </main>
  `
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await flushEffects()

  /** Write tick once and return how many row binding evaluations it caused. */
  async function evaluationsForOneUpdate() {
    await flushEffects()
    const before = counter.evaluations
    tick.set(tick() + 1)
    await flushEffects()
    return counter.evaluations - before
  }

  async function setItems(next: number[]) {
    items.set([...next])
    await flushEffects()
  }

  return { evaluationsForOneUpdate, setItems }
}

/**
 * Alternate `removed` and FULL for CYCLES cycles, then end on `removed`.
 * After each step, record the rendered rows and one update's evaluations, and
 * check the DOM itself holds exactly the list's rows.
 */
async function runCycles(list: Awaited<ReturnType<typeof mountList>>, label: string, removed: number[]) {
  const trace: Step[] = []
  const dom: Array<{ step: string, labels: number[] }> = []
  const expectedDom: Array<{ step: string, labels: number[] }> = []

  const record = async (step: string, expected: number[]) => {
    dom.push({ step, labels: labels() })
    expectedDom.push({ step, labels: expected })
    trace.push({ step, rendered: rendered(), evaluations: await list.evaluationsForOneUpdate() })
  }

  for (let cycle = 1; cycle <= CYCLES; cycle++) {
    await list.setItems(removed)
    await record(`${label} ${cycle}`, removed)
    await list.setItems(FULL)
    await record(`grow ${cycle}`, FULL)
  }
  await list.setItems(removed)
  await record(`final ${label}`, removed)

  // The DOM is always right; the leak is only in the work.
  expect(dom).toEqual(expectedDom)
  return trace
}

describe(':for disposes the effects of removed rows (#1954)', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  for (const variant of VARIANTS) {
    describe(variant.name, () => {
      it(`runs one binding per rendered row across ${CYCLES} shrink/grow cycles`, async () => {
        const list = await mountList(variant)

        // Harness check before any removal: all ten rows rendered, their
        // bindings applied, and one update runs each exactly once. A harness
        // that failed to bind would read 0 here and fail, rather than pass the
        // leak check below vacuously.
        expect(labels()).toEqual(FULL)
        expect(rowNodes()[0].classList.contains('row-100')).toBe(true)
        expect(await list.evaluationsForOneUpdate()).toBe(10)

        const trace = await runCycles(list, 'shrink', ONE)

        // One update must run exactly one binding per rendered row. Every
        // removed row whose binding is still subscribed adds one more.
        expect(trace).toEqual(trace.map(t => ({ ...t, evaluations: t.rendered })))
      })

      it(`runs no row bindings once emptied after ${CYCLES} grow/empty cycles`, async () => {
        const list = await mountList(variant)

        expect(labels()).toEqual(FULL)
        expect(await list.evaluationsForOneUpdate()).toBe(10)

        // An empty list takes clearRenderedItems rather than the keyed diff.
        const trace = await runCycles(list, 'empty', EMPTY)

        // Nothing rendered means nothing should re-run on an update.
        expect(trace).toEqual(trace.map(t => ({ ...t, evaluations: t.rendered })))
      })
    })
  }
})
