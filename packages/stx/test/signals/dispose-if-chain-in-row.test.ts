/**
 * An if/else CHAIN inside a removed :for row (stacksjs/stx#1954).
 *
 * `@if(...)@else@endif` reading a signal is rewritten by
 * convertSignalDirectivesToAttributes into an `@if`/`@else-if`/`@else`
 * attribute chain, and `findIfChain`/`getElseAttrInfo` treat `@`, `:` and `x-`
 * forms identically. So this covers the `@if` form too; `:` is used here only
 * because happy-dom drops `@`-prefixed attributes from innerHTML.
 *
 * The chain's own effect, and whatever branch is showing when the row is
 * first processed, are created inside the row's tracker and disposed with it.
 * A branch picked LATER is processed inside the chain effect, where no tracker
 * is active -- so those effects have to be reachable some other way, or a row
 * whose branch switched before removal leaks them.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const CYCLES = 5
const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
let seq = 0
const settle = () => new Promise(resolve => setTimeout(resolve, 30))
const rendered = () => document.querySelectorAll('#rows [data-probe]').length

beforeAll(() => {
  installNodeConstants()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

async function mountChainList() {
  const items = window.stx.state([...ALL])
  const mode = window.stx.state('a')
  const tick = window.stx.state(0)
  const counter = { evaluations: 0 }
  const probe = (i: number) => {
    counter.evaluations++
    return tick() >= 0 ? `hit hit-${i}` : 'hit'
  }

  const setupName = `__stx_setup_dispose_if_chain_${++seq}`
  window[setupName] = () => ({ items, mode, tick, probe })

  document.body.innerHTML = `
    <main data-stx="${setupName}">
      <ul id="rows">
        <template :for="i in items" :key="i">
          <li data-row>
            <b data-probe :if="mode() === 'a'" x-class="probe(i)">A</b>
            <b data-probe :else x-class="probe(i)">B</b>
          </li>
        </template>
      </ul>
    </main>
  `
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()

  return {
    items,
    mode,
    async oneUpdate() {
      const before = counter.evaluations
      tick.set(tick() + 1)
      await settle()
      return counter.evaluations - before
    },
  }
}

describe('if/else chain inside a :for row disposes with the row (#1954)', () => {
  it('runs one branch binding per rendered row before any cycles', async () => {
    const list = await mountChainList()
    expect(rendered()).toBe(ALL.length)
    expect(await list.oneUpdate()).toBe(ALL.length)
  })

  it('does not grow per cycle when rows whose branch switched are removed', async () => {
    // A chain keeps the previously-shown branch processed so re-show works
    // (#1737, and #1954 scopes that out), so a row whose branch switched runs
    // one hidden binding besides the visible one. That is a CONSTANT, not
    // growth: what must not happen is the removed rows' branches surviving.
    const list = await mountChainList()
    expect(await list.oneUpdate()).toBe(ALL.length)

    const shrunk: number[] = []
    const grown: number[] = []
    for (let cycle = 0; cycle < CYCLES; cycle++) {
      list.mode.set(cycle % 2 === 0 ? 'b' : 'a')
      await settle()
      expect(rendered()).toBe(ALL.length)

      list.items.set([0])
      await settle()
      expect(rendered()).toBe(1)
      shrunk.push(await list.oneUpdate())

      list.items.set([...ALL])
      await settle()
      expect(rendered()).toBe(ALL.length)
      grown.push(await list.oneUpdate())
    }

    // Every cycle must cost what the first one did.
    expect(shrunk).toEqual(shrunk.map(() => shrunk[0]))
    expect(grown).toEqual(grown.map(() => grown[0]))
    // And that constant must be the live rows plus at most one retained
    // branch per rendered row -- not the ten rows that were removed.
    expect(shrunk[0]).toBeLessThanOrEqual(2)
    expect(grown[0]).toBeLessThanOrEqual(ALL.length * 2)
  })
})
