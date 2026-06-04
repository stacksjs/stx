/**
 * Islands (stacksjs/stx#1746): a deferred component's onMount must fire when it
 * HYDRATES (on the trigger), not at page load. Previously the DOMContentLoaded
 * pass flushed every scope's onMount eagerly, even for scopes whose binding was
 * deferred via stx-hydrate — so onMount ran before the component was wired up.
 *
 * Driven against the real runtime via the #1741 DOM shim using the synchronous
 * `interaction` trigger (a dispatched click) so load-time vs hydration-time is
 * deterministic.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { flushEffects, setupStxTestDom, shimAttributes } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('island onMount timing (#1746)', () => {
  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('defers onMount until the (interaction) trigger for a stx-hydrate scope', async () => {
    let mounted = 0
    window.stx._scopes = { isle: { __mountCallbacks: [() => { mounted++ }] } }
    document.body.innerHTML
      = '<section data-stx-scope="isle" stx-hydrate="interaction"><span class="c">x</span></section>'
    shimAttributes(document.body)

    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()
    expect(mounted).toBe(0) // NOT fired at page load — hydration is deferred

    document.querySelector('[data-stx-scope="isle"]').dispatchEvent(new window.Event('click'))
    await flushEffects()
    expect(mounted).toBe(1) // fired on hydration
  })

  it('still fires onMount eagerly for a non-deferred scope (unchanged)', async () => {
    let mounted = 0
    window.stx._scopes = { eager: { __mountCallbacks: [() => { mounted++ }] } }
    document.body.innerHTML = '<section data-stx-scope="eager"><span>x</span></section>'
    shimAttributes(document.body)

    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()
    expect(mounted).toBe(1) // eager — fired at load, as before
  })

  it('does not double-fire onMount', async () => {
    let mounted = 0
    window.stx._scopes = { once: { __mountCallbacks: [() => { mounted++ }] } }
    document.body.innerHTML
      = '<section data-stx-scope="once" stx-hydrate="interaction"><span>x</span></section>'
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()
    const el = document.querySelector('[data-stx-scope="once"]')
    el.dispatchEvent(new window.Event('click'))
    el.dispatchEvent(new window.Event('click')) // second interaction
    await flushEffects()
    expect(mounted).toBe(1) // exactly once
  })
})
