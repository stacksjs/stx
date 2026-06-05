/**
 * In-boundary hydration (stacksjs/stx#1746 Phase 3). When a streamed suspense
 * boundary swaps in, its content must come alive — `window.stx.hydrate(node)`
 * processes the inserted subtree (scope processing + directive binding + onMount)
 * the same way the SPA re-init pass does, scoped to that node.
 *
 * Driven against the real runtime via the #1741 DOM shim. (Script EXECUTION of a
 * dynamically-cloned `<script>` is a browser behaviour happy-dom doesn't run, so
 * these pin the binding/mount path against a pre-registered scope — the same
 * shape the streamed scope script produces once it runs in a real browser.)
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { flushEffects, setupStxTestDom, shimAttributes } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('window.stx.hydrate (#1746 in-boundary hydration)', () => {
  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('is exposed on window.stx', () => {
    expect(typeof window.stx.hydrate).toBe('function')
  })

  it('binds directives in a swapped-in subtree against its scope', async () => {
    const sid = 'bnd1'
    window.stx._scopes = { [sid]: { msg: window.stx.state('streamed'), __mountCallbacks: [] } }
    document.body.innerHTML = `<section data-stx-scope="${sid}"><span class="m" x-text="msg"></span></section>`
    shimAttributes(document.body)

    window.stx.hydrate(document.querySelector(`[data-stx-scope="${sid}"]`))
    await flushEffects()
    expect(document.querySelector('.m').textContent).toBe('streamed')
  })

  it('fires onMount for the hydrated subtree, exactly once', async () => {
    let mounted = 0
    const sid = 'bnd2'
    window.stx._scopes = { [sid]: { n: window.stx.state('one'), __mountCallbacks: [() => { mounted++ }] } }
    document.body.innerHTML = `<div data-stx-scope="${sid}"><span x-text="n"></span></div>`
    shimAttributes(document.body)
    const el = document.querySelector(`[data-stx-scope="${sid}"]`)

    window.stx.hydrate(el)
    window.stx.hydrate(el) // idempotent — guards prevent a second bind/mount
    await flushEffects()
    expect(mounted).toBe(1)
  })

  it('reacts to signal changes after hydration (genuinely live, not a one-shot render)', async () => {
    const sid = 'bnd3'
    const label = window.stx.state('a')
    window.stx._scopes = { [sid]: { label } }
    document.body.innerHTML = `<div data-stx-scope="${sid}"><span class="c" x-text="label"></span></div>`
    shimAttributes(document.body)

    window.stx.hydrate(document.querySelector(`[data-stx-scope="${sid}"]`))
    await flushEffects()
    expect(document.querySelector('.c').textContent).toBe('a')

    label.set('b')
    await flushEffects()
    expect(document.querySelector('.c').textContent).toBe('b') // effect re-ran
  })

  it('is a safe no-op for a null/elementless argument', () => {
    expect(() => window.stx.hydrate(null)).not.toThrow()
    expect(() => window.stx.hydrate({})).not.toThrow()
  })
})
