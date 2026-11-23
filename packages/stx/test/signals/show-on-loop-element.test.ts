/**
 * `x-show` / `:show` on the element that carries the loop (stacksjs/stx#2212).
 *
 * Reported as silently dropped: Postline moved its `x-show` onto a wrapper,
 * on the belief that `bindFor` returned as soon as it saw the loop attribute.
 * On main each rendered row carries the condition and follows it, whether it
 * reads the row or a signal outside the loop. Pinned so it stays that way.
 */
import { afterEach, beforeAll, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

beforeAll(() => {
  installNodeConstants()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

afterEach(() => {
  window.stx._cleanupContainer(document.body)
  document.body.innerHTML = ''
  delete window.__stx_setup_loopshow
})

async function mount(markup: string, scope: Record<string, unknown>) {
  window.__stx_setup_loopshow = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_loopshow">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await Bun.sleep(30)
}

function shownRows(): string[] {
  return [...document.querySelectorAll('.row')]
    // eslint-disable-next-line ts/no-explicit-any
    .filter((el: any) => el.textContent.trim() && el.style.display !== 'none')
    // eslint-disable-next-line ts/no-explicit-any
    .map((el: any) => el.textContent.trim())
}

for (const [loop, show] of [['x-for', 'x-show'], [':for', ':show'], ['x-for', ':show'], [':for', 'x-show']]) {
  it(`${loop} with ${show} follows a signal outside the loop`, async () => {
    const rows = window.stx.state([1, 2, 3])
    const busy = window.stx.state(true)
    await mount(`<div class="row" ${loop}="row in rows()" ${show}="busy()">r{{ row }}</div>`, { rows, busy })
    expect(shownRows()).toEqual(['r1', 'r2', 'r3'])
    busy.set(false)
    await Bun.sleep(10)
    expect(shownRows()).toEqual([])
    busy.set(true)
    await Bun.sleep(10)
    expect(shownRows()).toEqual(['r1', 'r2', 'r3'])
  })

  it(`${loop} with ${show} reads each row`, async () => {
    const items = window.stx.state([{ id: 1, on: true }, { id: 2, on: false }, { id: 3, on: true }])
    await mount(`<div class="row" ${loop}="item in items()" :key="item.id" ${show}="item.on">r{{ item.id }}</div>`, { items })
    expect(shownRows()).toEqual(['r1', 'r3'])
    items.set([{ id: 1, on: false }, { id: 2, on: true }, { id: 3, on: true }])
    await Bun.sleep(10)
    expect(shownRows()).toEqual(['r2', 'r3'])
  })
}
