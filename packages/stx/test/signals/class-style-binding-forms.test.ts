/**
 * How a bound class or style meets the static one (stacksjs/stx#2214).
 *
 * - A string `:class` adds to the static list and takes back only what it
 *   added, so it cannot turn a static class off. The object form can: a false
 *   value removes the class even when `class` wrote it, which is how a static
 *   class stands for the state before hydration.
 * - `:style` takes a declaration string as well as an object, custom
 *   properties included.
 *
 * Both rules are documented in docs/guide/prefix-convention.md; these pin them.
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
  delete window.__stx_setup_classforms
})

async function mount(markup: string, scope: Record<string, unknown>) {
  window.__stx_setup_classforms = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_classforms">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await Bun.sleep(30)
}

// eslint-disable-next-line ts/no-explicit-any
const classes = (id: string) => (document.getElementById(id) as any).className.split(/\s+/).filter(Boolean).sort()

for (const prefix of [':class', 'x-class']) {
  it(`${prefix}: a string adds to the static list and never removes from it`, async () => {
    const open = window.stx.state(false)
    await mount(`<span id="s" class="flex hidden" ${prefix}="open() ? 'block' : 'hidden'">x</span>`, { open })
    expect(classes('s')).toEqual(['flex', 'hidden'])
    open.set(true)
    await Bun.sleep(10)
    expect(classes('s')).toEqual(['block', 'flex', 'hidden'])
    open.set(false)
    await Bun.sleep(10)
    expect(classes('s')).toEqual(['flex', 'hidden'])
  })

  it(`${prefix}: an object turns a static class off and on`, async () => {
    const pending = window.stx.state(true)
    await mount(`<span id="o" class="flex hidden" ${prefix}="{ hidden: !pending() }">y</span>`, { pending })
    expect(classes('o')).toEqual(['flex'])
    pending.set(false)
    await Bun.sleep(10)
    expect(classes('o')).toEqual(['flex', 'hidden'])
    pending.set(true)
    await Bun.sleep(10)
    expect(classes('o')).toEqual(['flex'])
  })
}

for (const prefix of [':style', 'x-style']) {
  it(`${prefix}: takes a declaration string, custom properties included`, async () => {
    const gradient = window.stx.state('--from: #f00; color: red')
    await mount(`<a id="a" style="margin: 1px" ${prefix}="gradient()">x</a>`, { gradient })
    // eslint-disable-next-line ts/no-explicit-any
    const el = document.getElementById('a') as any
    expect(el.style.getPropertyValue('--from')).toBe('#f00')
    expect(el.style.color).toBe('red')
    gradient.set('--from: #00f')
    await Bun.sleep(10)
    expect(el.style.getPropertyValue('--from')).toBe('#00f')
    // Dropped from the string: the binding owned it, so it goes.
    expect(el.style.color || '').toBe('')
    // Never the binding's: the static declaration stays.
    expect(el.style.margin).toBe('1px')
  })
}
