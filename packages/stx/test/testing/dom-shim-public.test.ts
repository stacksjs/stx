/**
 * Dogfoods the PUBLIC testing surface (stx/testing) that #1741 ships: the DOM
 * runtime shim that lets adopters drive a component's reactive directives in a
 * unit test against happy-dom. Imports from `../../src/testing` the same way an
 * adopter imports `@stacksjs/stx/testing`.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { flushEffects, setupStxTestDom, shimAttributes } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('public stx/testing DOM shim (#1741)', () => {
  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('exposes the shim helpers from the public surface', () => {
    expect(typeof setupStxTestDom).toBe('function')
    expect(typeof shimAttributes).toBe('function')
    expect(typeof flushEffects).toBe('function')
  })

  it('drives a reactive :if/:else chain to the correct branch', async () => {
    window.stx._scopes = { demo: { loading: window.stx.state(false), items: window.stx.state(['a', 'b']) } }
    document.body.innerHTML
      = `<section data-stx-scope="demo">`
      + `<ul :if="loading()">skeleton</ul>`
      + `<div :else-if="items().length === 0">empty</div>`
      + `<ul :else>list</ul>`
      + `</section>`
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()

    const visible = (t: string) =>
      Array.from(document.querySelectorAll('div,ul')).some((e: any) => e.isConnected && (e.textContent || '').trim() === t)
    expect(visible('list')).toBe(true)
    expect(visible('skeleton')).toBe(false)
    expect(visible('empty')).toBe(false)
  })

  it('setupStxTestDom installs Node constants + rAF (idempotent)', () => {
    setupStxTestDom()
    setupStxTestDom() // second call must not throw
    expect((globalThis as any).Node.ELEMENT_NODE).toBe(1)
    expect(typeof (globalThis as any).requestAnimationFrame).toBe('function')
  })

  it('shimAttributes exposes a NamedNodeMap-shaped attributes accessor', () => {
    const el = document.createElement('div')
    el.setAttribute(':if', 'x()')
    el.setAttribute('class', 'card')
    document.body.appendChild(el)
    shimAttributes(el)
    const attrs = Array.from(el.attributes) as Array<{ name: string, value: string }>
    expect(attrs.every(a => typeof a.name === 'string')).toBe(true)
    expect(attrs.find(a => a.name === ':if')?.value).toBe('x()')
    // Backing get/set still work (happy-dom internals depend on these).
    expect(el.getAttribute('class')).toBe('card')
    el.setAttribute('id', 'z')
    expect(el.getAttribute('id')).toBe('z')
  })
})
