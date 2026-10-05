/**
 * A binding expression is compiled once, not on every evaluation.
 *
 * Every binding was compiled with `new Function` each time it was evaluated,
 * over every name in scope. A page with a few hundred names rebuilt a function
 * of a few hundred parameters for every binding of every row, each time a row
 * rendered: opening a 386-message conversation in a desktop app froze the
 * window for seven seconds in WebKit, and clicks made meanwhile seemed to do
 * nothing.
 *
 * Counted rather than timed: the runtime is run with a `Function` that counts
 * what it is asked to build, so the test fails on the shape of the work, not on
 * the speed of the machine.
 */
import { describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { generateSignalsRuntimeDev } from '../../src/signals'

function renderList(rows: number): { compiles: number, rerender: () => number, touchUnrelated: () => number, text: () => string } {
  const window = new Window({ url: 'http://localhost/' }) as any
  let compiles = 0
  // eslint-disable-next-line no-new-func
  const CountingFunction = function (...args: string[]) {
    compiles++
    return new Function(...args)
  } as unknown as FunctionConstructor
  const quiet = { ...console, log() {}, debug() {}, info() {}, warn() {} }
  // eslint-disable-next-line no-new-func
  new Function('window', 'document', 'console', 'Function', generateSignalsRuntimeDev())(window, window.document, quiet, CountingFunction)

  const stx = window.stx
  const make = (n: number, tag: string) => Array.from({ length: n }, (_, i) => ({ id: i, name: `${tag}${i}` }))
  const items = stx.state(make(rows, 'a'))
  const unrelated = stx.state(0)
  let labelled = 0
  stx._scopes.list = { items, unrelated, label: (item: { name: string }) => { labelled++; return item.name.toUpperCase() } }

  const container = window.document.createElement('div')
  container.setAttribute('data-stx-scope', 'list')
  container.innerHTML = '<ul><li :for="item in items()" :key="item.id">{{ label(item) }}</li></ul>'
  window.document.body.appendChild(container)
  stx.hydrate(container)

  return {
    compiles,
    touchUnrelated() {
      const before = labelled
      unrelated.set(unrelated() + 1)
      return labelled - before
    },
    rerender() {
      const before = compiles
      items.set(make(rows, 'b'))
      return compiles - before
    },
    text: () => container.textContent,
  }
}

describe('expression compile cache', () => {
  it('renders the list', () => {
    const list = renderList(5)
    expect(list.text()).toContain('A0')
    expect(list.text()).toContain('A4')
  })

  it('compiles the same amount whether the list has 10 rows or 200', () => {
    const small = renderList(10)
    const large = renderList(200)
    expect(large.compiles).toBe(small.compiles)
  })

  it('compiles nothing new when the rows change', () => {
    const list = renderList(50)
    expect(list.rerender()).toBe(0)
    expect(list.text()).toContain('B49')
  })

  it('re-runs a binding only for the signals it names', () => {
    // Every binding was handed - and so read - every value in scope, which
    // subscribed it to every signal on the page: changing one unrelated value
    // re-ran every row.
    const list = renderList(20)
    expect(list.touchUnrelated()).toBe(0)
  })
})
