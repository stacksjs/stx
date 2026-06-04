/**
 * Islands + SPA navigation (stacksjs/stx#1746).
 *
 * A deferred island (`client="visible|idle|interaction|…"`) reached via SPA
 * navigation arrives with its setup script inert and its scope unregistered.
 * The SPA re-init path (`_handleStxLoad`, fired by `stx:load`) walks
 * `[data-stx-scope]` and previously did `if (!scopeVars) return` — silently
 * skipping the island, so it never hydrated. The fix arms its trigger the same
 * way the initial-load DOMContentLoaded path does.
 *
 * Driven against the real runtime via the #1741 DOM shim, dispatching the actual
 * `stx:load` event so the real `_handleStxLoad` runs (it debounces ~5ms).
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { flushEffects, setupStxTestDom, shimAttributes } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('island hydration after SPA navigation (#1746)', () => {
  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('arms + hydrates a deferred island that arrives via stx:load (SPA swap)', async () => {
    window.__spaMounts = 0
    const sid = 'spaIsle'
    delete window.stx._scopes[sid]

    // Post-swap DOM: inert inline island script + host, scope NOT yet registered
    // (exactly the state a client="interaction" island lands in after a fragment swap).
    const iife = `(function(){ window.stx._scopes["${sid}"] = { greeting: window.stx.state("hey"), __mountCallbacks: [function(){ window.__spaMounts++; }] }; })();`
    document.body.innerHTML
      = `<main data-stx-content>`
      + `<script type="stx/island" data-stx-island="${sid}" data-stx-scoped>${iife}</script>`
      + `<section data-stx-scope="${sid}" stx-hydrate="interaction"><span class="g" x-text="greeting"></span></section>`
      + `</main>`
    shimAttributes(document.body)

    // SPA navigation fires stx:load (debounced ~5ms inside the runtime).
    window.dispatchEvent(new window.Event('stx:load'))
    await new Promise((r) => { setTimeout(r, 25) })
    await flushEffects()

    // Armed by the re-init pass, but not hydrated yet (interaction hasn't fired).
    const host = document.querySelector(`[data-stx-scope="${sid}"]`)
    expect(host.__stx_hydration_scheduled).toBe(true)
    expect(window.stx._scopes[sid]).toBeUndefined()
    expect(window.__spaMounts).toBe(0)

    // Trigger → island executes, registers scope, binds, mounts.
    host.dispatchEvent(new window.Event('click'))
    await flushEffects()
    expect(window.stx._scopes[sid]).toBeDefined()
    expect(window.__spaMounts).toBe(1)
    expect(document.querySelector('.g').textContent).toBe('hey')
  })
})
