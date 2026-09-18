/**
 * Disposal must not reach bindings that are still on the page (stacksjs/stx#1954).
 *
 * The #1954 fix disposes a subtree's effects when a :for row is removed or a
 * <template :if> clone is hidden. The failure that fix risks is the opposite
 * of the leak: disposing, or orphaning, bindings that are still rendered.
 * The four leak tests only count work, so a fix that disposed too much could
 * pass them. These count work AND check what is rendered and still updates.
 * The kept-rows case was confirmed to fail when reused rows are disposed.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

let seq = 0
const settle = () => new Promise(resolve => setTimeout(resolve, 30))

beforeAll(() => {
  installNodeConstants()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

/** Mount markup against a setup scope; returns a counter for probe() calls. */
async function mount(markup: string, scope: Record<string, unknown>) {
  const counter = { evaluations: 0 }
  const tick = window.stx.state(0)
  const probe = (label: unknown) => {
    counter.evaluations++
    return tick() >= 0 ? `hit hit-${String(label)}` : ''
  }
  const setupName = `__stx_setup_dispose_keeps_live_${++seq}`
  window[setupName] = () => ({ ...scope, tick, probe })
  document.body.innerHTML = `<main data-stx="${setupName}">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
  return {
    async oneUpdate() {
      const before = counter.evaluations
      tick.set(tick() + 1)
      await settle()
      return counter.evaluations - before
    },
  }
}

const hits = (selector: string) => document.querySelectorAll(`${selector}.hit`).length

describe('#1954 disposal keeps live bindings live', () => {
  it('removes a <template :for> nested in a hidden <template :if>, and rebinds it on show', async () => {
    const shown = window.stx.state(true)
    const items = window.stx.state([1, 2, 3])
    const page = await mount(`
      <div id="host">
        <template :if="shown()">
          <ul><template :for="i in items" :key="i"><li class="row" x-class="probe(i)">{{ i }}</li></template></ul>
        </template>
      </div>`, { shown, items })

    expect(hits('#host .row')).toBe(3)
    for (let cycle = 0; cycle < 5; cycle++) {
      shown.set(false)
      await settle()
      expect(document.querySelectorAll('#host .row').length).toBe(0)
      expect(await page.oneUpdate()).toBe(0)
      shown.set(true)
      await settle()
      expect(hits('#host .row')).toBe(3)
      expect(await page.oneUpdate()).toBe(3)
    }
  })

  it('removes rows of a <template :for> placed DIRECTLY under a hidden <template :if>', async () => {
    // Unwrapped on purpose: the rendered rows are siblings of the :for clone,
    // not descendants of anything the :if tracks, so hiding the branch has to
    // reach them some other way. The earlier #1954 attempt left them on screen.
    const shown = window.stx.state(true)
    const items = window.stx.state([1, 2, 3])
    const page = await mount(`
      <div id="host"><template :if="shown()"><template :for="i in items" :key="i"><b class="row" x-class="probe(i)">{{ i }}</b></template></template></div>`, { shown, items })

    expect(hits('#host .row')).toBe(3)
    for (let cycle = 0; cycle < 5; cycle++) {
      shown.set(false)
      await settle()
      expect(document.querySelectorAll('#host .row').length).toBe(0)
      expect(await page.oneUpdate()).toBe(0)
      shown.set(true)
      await settle()
      expect(hits('#host .row')).toBe(3)
      expect(await page.oneUpdate()).toBe(3)
    }
  })

  it('keeps surviving keyed rows bound after a middle row is removed', async () => {
    const items = window.stx.state([1, 2, 3, 4])
    const page = await mount(`
      <ul id="list"><template :for="i in items" :key="i"><li class="row" x-class="probe(i)">{{ i }}</li></template></ul>`, { items })

    expect(await page.oneUpdate()).toBe(4)
    items.set([1, 3, 4])
    await settle()
    expect(document.querySelectorAll('#list .row').length).toBe(3)
    expect(await page.oneUpdate()).toBe(3)
    items.set([4, 1, 3])
    await settle()
    expect(await page.oneUpdate()).toBe(3)
    expect([...document.querySelectorAll('#list .row')].map((n: { textContent: string }) => n.textContent.trim())).toEqual(['4', '1', '3'])
  })

  it('lets TransitionGroup leaving rows finish and leave, without their bindings running on', async () => {
    // Leaving rows are disposed BEFORE tgLeave, then removed by the leave's
    // own frame-and-timeout path, which never touches their effects. Headless
    // Chrome under a virtual-time budget produces no animation frames unless
    // something writes to the page, so leaves can stall there; animation frames
    // run here, which is what a real browser does.
    const items = window.stx.state([1, 2, 3, 4, 5])
    const page = await mount(`
      <ul id="tg" data-stx-transition-group="fade"><li :for="i in items" :key="i" class="row" x-class="probe(i)">{{ i }}</li></ul>`, { items })

    expect(await page.oneUpdate()).toBe(5)
    for (let cycle = 0; cycle < 3; cycle++) {
      items.set([1])
      await new Promise(resolve => setTimeout(resolve, 400))
      expect(document.querySelectorAll('#tg .row').length).toBe(1)
      expect(await page.oneUpdate()).toBe(1)
      items.set([1, 2, 3, 4, 5])
      await settle()
      expect(await page.oneUpdate()).toBe(5)
    }
  })

  it('leaves a row\'s own :if working across many toggles while the row stays', async () => {
    const items = window.stx.state([1, 2])
    const open = window.stx.state(true)
    const page = await mount(`
      <ul id="list"><template :for="i in items" :key="i"><li class="row"><span :if="open()" class="detail" x-class="probe(i)">d</span></li></template></ul>`, { items, open })

    expect(hits('#list .detail')).toBe(2)
    for (let cycle = 0; cycle < 6; cycle++) {
      open.set(false)
      await settle()
      expect(document.querySelectorAll('#list .detail').length).toBe(0)
      open.set(true)
      await settle()
      expect(hits('#list .detail')).toBe(2)
    }
    expect(await page.oneUpdate()).toBe(2)
  })

  it('rebinds a <template :if> nested inside another after either one toggles', async () => {
    const outer = window.stx.state(true)
    const inner = window.stx.state(true)
    const page = await mount(`
      <div id="host">
        <template :if="outer()">
          <section><template :if="inner()"><em class="leaf" x-class="probe('leaf')">leaf</em></template></section>
        </template>
      </div>`, { outer, inner })

    for (let cycle = 0; cycle < 5; cycle++) {
      inner.set(false)
      await settle()
      inner.set(true)
      await settle()
      outer.set(false)
      await settle()
      expect(document.querySelectorAll('#host .leaf').length).toBe(0)
      outer.set(true)
      await settle()
      expect(hits('#host .leaf')).toBe(1)
    }
    expect(await page.oneUpdate()).toBe(1)
  })
})
