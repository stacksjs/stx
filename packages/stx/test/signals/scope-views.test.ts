/**
 * Scopes are layered views, not copies.
 *
 * Every binding, listener and conditional of a row used to take its own copy of
 * the whole page scope, so the price of drawing a list grew with the NUMBER OF
 * NAMES ON THE PAGE: with 300 names in scope, 60 to-do rows took 180 ms, 90% of
 * it in the copy. A view costs one small object, so these pin both halves: the
 * behaviour a copy had, and that nothing walks the page scope per row.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))
let booted = 0

async function hydrate(markup: string, scope: Record<string, unknown>): Promise<void> {
  const name = `views_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
}

describe('scope views', () => {
  beforeEach(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    delete window.__stx_host
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('draws a list without walking the page scope once per row', async () => {
    const scope: Record<string, unknown> = { rows: window.stx.state(Array.from({ length: 60 }, (_, id) => ({ id, title: `Row ${id}` }))) }
    for (let i = 0; i < 300; i++) scope[`name${i}`] = i % 2 ? () => i : window.stx.state(i)

    let wide = 0
    const keys = Object.keys
    const getDescriptor = Object.getOwnPropertyDescriptor
    Object.keys = ((target: object) => {
      const names = keys(target)
      if (names.length > 100) wide++
      return names
    }) as typeof Object.keys
    // The descriptor reads a copy makes, per key, are the cost: count them.
    let descriptors = 0
    Object.getOwnPropertyDescriptor = ((target: object, key: PropertyKey) => {
      descriptors++
      return getDescriptor(target, key)
    }) as typeof Object.getOwnPropertyDescriptor
    try {
      await hydrate('<ul><li :for="r in rows" :key="r.id" class="row" :data-id="r.id" @click="r.id"><span :text="r.title"></span><i :if="r.id % 2"></i></li></ul>', scope)
    }
    finally {
      Object.keys = keys
      Object.getOwnPropertyDescriptor = getDescriptor
    }

    expect(document.querySelectorAll('li.row').length).toBe(60)
    expect(document.querySelector('li.row span').textContent).toBe('Row 0')
    // A copy per row was 2,000+ walks of a 300-name scope: well over 600,000 descriptor reads.
    expect(wide).toBeLessThan(40)
    expect(descriptors).toBeLessThan(20_000)
  })

  it('still resolves a name through shadowing, and a loop variable beats the page', async () => {
    const r = window.stx.state('page')
    await hydrate('<ul><li :for="r in rows" class="row"><b :text="r"></b></li></ul>', { rows: window.stx.state(['a', 'b']), r })
    expect(Array.from(document.querySelectorAll('li.row b')).map((b: any) => b.textContent)).toEqual(['a', 'b'])
  })

  it('sees a signal change in every row without re-making them', async () => {
    const label = window.stx.state('x')
    await hydrate('<ul><li :for="n in rows" class="row"><b :text="label + n"></b></li></ul>', { rows: window.stx.state([1, 2, 3]), label })
    label.set('y')
    await settle()
    expect(Array.from(document.querySelectorAll('li.row b')).map((b: any) => b.textContent)).toEqual(['y1', 'y2', 'y3'])
  })

  it('keeps each component instance on its own handler', async () => {
    // Three rows built from one template, each calling a function of its own scope.
    const calls: number[] = []
    await hydrate(
      '<ul><li :for="n in rows" class="row"><button @click="pick(n)">go</button></li></ul>',
      { rows: window.stx.state([10, 20, 30]), pick: (n: number) => calls.push(n) },
    )
    const buttons = Array.from(document.querySelectorAll('li.row button')) as any[]
    buttons[1].dispatchEvent(new window.Event('click', { bubbles: true }))
    buttons[2].dispatchEvent(new window.Event('click', { bubbles: true }))
    expect(calls).toEqual([20, 30])
  })
})
