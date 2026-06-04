/**
 * Islands (stacksjs/stx#1746): a deferred component's SETUP SCRIPT must not run
 * until it hydrates. The server emits the scope IIFE as an inert
 * `<script type="stx/island">`; the runtime executes it (registering the scope +
 * running any side-effectful setup like a fetch) only when the trigger fires.
 *
 * This is the difference between deferring just the binding (previous increment)
 * and deferring the whole client-side execution: a `client="visible"` component
 * that fetches in its `<script client>` body now fetches when scrolled into
 * view, not at page load.
 *
 * Driven against the real runtime via the #1741 DOM shim using the synchronous
 * `interaction` trigger so load-time vs hydration-time is deterministic.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { flushEffects, setupStxTestDom, shimAttributes } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('island deferred setup script (#1746)', () => {
  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('defers the setup script execution until the (interaction) trigger', async () => {
    window.__islandSetupRuns = 0
    window.__islandMounts = 0
    // Inert island setup: registers the scope + a signal + onMount, and bumps a
    // global counter so we can prove exactly WHEN it executed.
    const islandSrc = [
      'window.__islandSetupRuns++;',
      'window.stx._scopes["isleX"] = {',
      '  greeting: window.stx.state("hello"),',
      '  __mountCallbacks: [function(){ window.__islandMounts++; }],',
      '};',
    ].join('')
    delete window.stx._scopes.isleX
    document.body.innerHTML
      = `<script type="stx/island" data-stx-island="isleX" data-stx-scoped>${islandSrc}</script>`
      + '<section data-stx-scope="isleX" stx-hydrate="interaction"><span class="g" x-text="greeting"></span></section>'
    shimAttributes(document.body)

    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()
    // At page load: the script must NOT have run — scope unregistered, no mount.
    expect(window.__islandSetupRuns).toBe(0)
    expect(window.stx._scopes.isleX).toBeUndefined()
    expect(window.__islandMounts).toBe(0)

    // Trigger hydration.
    document.querySelector('[data-stx-scope="isleX"]').dispatchEvent(new window.Event('click'))
    await flushEffects()
    // Now the setup ran exactly once → scope registered, onMount fired, bound.
    expect(window.__islandSetupRuns).toBe(1)
    expect(window.stx._scopes.isleX).toBeDefined()
    expect(window.__islandMounts).toBe(1)
    expect(document.querySelector('.g').textContent).toBe('hello')
  })

  it('reveals island HTML at load (x-cloak removed) but keeps the script deferred', async () => {
    window.__islandRuns2 = 0
    const src = 'window.__islandRuns2++; window.stx._scopes["isleC"] = { n: window.stx.state(1) };'
    delete window.stx._scopes.isleC
    document.body.innerHTML
      = `<script type="stx/island" data-stx-island="isleC" data-stx-scoped>${src}</script>`
      + '<section data-stx-scope="isleC" stx-hydrate="visible" x-cloak><span>hi</span></section>'
    shimAttributes(document.body)

    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()
    const host = document.querySelector('[data-stx-scope="isleC"]')
    // visible uses IntersectionObserver (no-op in happy-dom) → never fires here.
    expect(host.hasAttribute('x-cloak')).toBe(false) // HTML revealed at load
    expect(window.__islandRuns2).toBe(0) // but setup script still deferred
    expect(window.stx._scopes.isleC).toBeUndefined()
  })

  it('cancels a pending island trigger on SPA navigation (cleanupContainer)', async () => {
    window.__islandRuns3 = 0
    const src = 'window.__islandRuns3++; window.stx._scopes["isleS"] = { __mountCallbacks: [] };'
    delete window.stx._scopes.isleS
    document.body.innerHTML
      = '<main data-stx-content>'
      + `<script type="stx/island" data-stx-island="isleS" data-stx-scoped>${src}</script>`
      + '<section data-stx-scope="isleS" stx-hydrate="interaction"><span>x</span></section>'
      + '</main>'
    shimAttributes(document.body)

    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()
    const host = document.querySelector('[data-stx-scope="isleS"]')
    expect(typeof host.__stx_hydration_cancel).toBe('function') // armed, cancelable

    // Simulate SPA navigation tearing down the departing page container.
    window.stx._cleanupContainer(document.querySelector('[data-stx-content]'))
    expect(host.__stx_hydration_cancel).toBeNull() // trigger cancelled

    // The (now-removed) interaction listener must not hydrate the detached island.
    host.dispatchEvent(new window.Event('click'))
    await flushEffects()
    expect(window.__islandRuns3).toBe(0) // setup never ran — trigger was cancelled
    expect(window.stx._scopes.isleS).toBeUndefined()
  })

  it('does not eval anything for a plain (non-island) stx-hydrate subtree', async () => {
    // Pre-registered scope, no data-stx-island script → run() must not try to
    // eval; it binds with the captured scope exactly as before.
    let mounted = 0
    window.stx._scopes = { plain: { msg: window.stx.state('yo'), __mountCallbacks: [() => { mounted++ }] } }
    document.body.innerHTML
      = '<section data-stx-scope="plain" stx-hydrate="interaction"><span class="p" x-text="msg"></span></section>'
    shimAttributes(document.body)

    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()
    expect(mounted).toBe(0)

    document.querySelector('[data-stx-scope="plain"]').dispatchEvent(new window.Event('click'))
    await flushEffects()
    expect(mounted).toBe(1)
    expect(document.querySelector('.p').textContent).toBe('yo')
  })
})
